import { useRef, useEffect, useState, useCallback } from "react";
import io from "socket.io-client";

interface UseWebRTCOptions {
  roomId?: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: string) => void;
  onChatMessage?: (message: {
    id: string;
    text: string;
    isOwn: boolean;
  }) => void;
  onUserDisconnected?: () => void;
  onUserConnected?: () => void;
  onOnlineCountUpdate?: (count: number) => void;
}

export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const [socket, setSocket] = useState<SocketIOClient.Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<string>("disconnected");

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initializePeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      options.onRemoteStream?.(remoteStream);
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      setConnectionState(state);
      options.onConnectionStateChange?.(state);
      setIsConnected(state === "connected");

      if (state === "failed" || state === "disconnected") {
        setIsConnected(false);
        // Attempt to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socket && socket.connected) {
            console.log("Attempting to reconnect...");
            connect();
          }
        }, 3000);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnection.iceConnectionState);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (err) {
      setError("Failed to access camera/microphone");
      throw err;
    }
  };

  const connect = async (roomId?: string, data?: { interests?: string }) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Clean up any existing connection first
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      // Initialize socket connection with dynamic URL and WS transport
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        `${window.location.protocol}//${window.location.hostname}:3001`;

      const newSocket = io(socketUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000,
      });
      setSocket(newSocket);

      // Initialize peer connection
      const peerConnection = initializePeerConnection();

      // Start local stream
      await startLocalStream();

      // Socket event handlers
      newSocket.on("connect", () => {
        console.log("Connected to server");
        if (roomId) {
          newSocket.emit("join-room", roomId);
        } else {
          newSocket.emit("find-match", data);
        }
      });

      newSocket.on(
        "match-found",
        (data: { roomId: string; isInitiator: boolean }) => {
          console.log("Match found:", data);
          if (data.isInitiator) {
            createOffer();
          }
        }
      );

      newSocket.on("offer", async (offer: RTCSessionDescriptionInit) => {
        try {
          await peerConnection.setRemoteDescription(offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          newSocket.emit("answer", answer);
        } catch (err) {
          console.error("Error handling offer:", err);
          setError("Failed to handle connection offer");
        }
      });

      newSocket.on("answer", async (answer: RTCSessionDescriptionInit) => {
        try {
          await peerConnection.setRemoteDescription(answer);
        } catch (err) {
          console.error("Error handling answer:", err);
          setError("Failed to handle connection answer");
        }
      });

      newSocket.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
        try {
          await peerConnection.addIceCandidate(candidate);
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      });

      newSocket.on(
        "chat-message",
        (message: { id: string; text: string; isOwn: boolean }) => {
          options.onChatMessage?.(message);
        }
      );

      newSocket.on("user-disconnected", () => {
        setIsConnected(false);
        setIsConnecting(false);
        options.onUserDisconnected?.();
      });

      newSocket.on("user-connected", () => {
        options.onUserConnected?.();
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        setIsConnecting(false);
      });

      newSocket.on("connect_error", (err: unknown) => {
        console.error("Connection error:", err);
        setError("Failed to connect to server");
        setIsConnecting(false);
      });

      newSocket.on("online-count", (count: number) => {
        options.onOnlineCountUpdate?.(count);
      });
    } catch (err) {
      setError("Failed to connect");
      setIsConnecting(false);
      console.error("Connection error:", err);

      // Clean up on error
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        setSocket(null);
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    }
  };

  const createOffer = async () => {
    if (!peerConnectionRef.current) return;

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket?.emit("offer", offer);
    } catch (err) {
      console.error("Error creating offer:", err);
    }
  };

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      setSocket(null);
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    setConnectionState("disconnected");
  }, [socket]);

  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.emit("chat-message", message);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const requestPermissions = async () => {
    try {
      // Check if we're on HTTPS or localhost
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!isSecure) {
        const errorMsg = `WebRTC requires HTTPS for network access. Current URL: ${window.location.href}. Please use HTTPS or access via localhost.`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = "getUserMedia is not supported in this browser";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      // Request both camera & microphone with specific constraints for better Mac compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Store the stream for later use
      localStreamRef.current = stream;

      // Attach stream to your local video ref
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      console.log("Camera & mic access granted");
      setError(null);
      return stream;
    } catch (err: unknown) {
      console.error("Camera/Microphone permission denied:", err);

      let errorMessage = "Camera/Microphone access denied";

      const errorObject = err as
        | { name?: string; message?: string }
        | undefined;

      if (errorObject?.name === "NotAllowedError") {
        errorMessage =
          "Camera/Microphone permission denied. Please allow access and refresh the page.";
      } else if (errorObject?.name === "NotFoundError") {
        errorMessage = "No camera/microphone found. Please check your devices.";
      } else if (errorObject?.name === "NotReadableError") {
        errorMessage =
          "Camera/Microphone is being used by another application.";
      } else if (errorObject?.name === "OverconstrainedError") {
        errorMessage = "Camera/Microphone constraints cannot be satisfied.";
      } else if (errorObject?.name === "SecurityError") {
        errorMessage =
          "Camera/Microphone access blocked due to security restrictions.";
      }

      setError(errorMessage);
      throw err;
    }
  };

  return {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    error,
    connectionState,
    connect,
    disconnect,
    sendMessage,
    requestPermissions,
  };
};
