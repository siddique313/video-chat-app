"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";

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
  const [socket, setSocket] = useState<Socket | null>(null);
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

  // ✅ Initialize PeerConnection
  const initializePeerConnection = () => {
    if (typeof window === "undefined") return null;

    const RTCPeer =
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection;

    if (!RTCPeer) {
      setError("WebRTC not supported in this browser/environment");
      return null;
    }

    const peerConnection = new RTCPeer({
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
        if (reconnectTimeoutRef.current)
          clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socket && socket.connected) connect();
        }, 3000);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnection.iceConnectionState);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  // ✅ Start local camera + mic
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

  // ✅ Connect to signaling server
  const connect = async (roomId?: string, data?: { interests?: string }) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        `${window.location.protocol}//${window.location.hostname}:3001`;

      const publicIP = await fetch("https://api.ipify.org?format=json")
        .then((res) => res.json())
        .then((data) => data.ip)
        .catch(() => "unknown");

      const newSocket = io(socketUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000,
        query: { ip: publicIP },
      });

      setSocket(newSocket);

      const peerConnection = initializePeerConnection();
      if (!peerConnection) throw new Error("Failed to initialize WebRTC");

      await startLocalStream();

      newSocket.on("connect", () => {
        console.log("Connected to signaling server");
        if (roomId) newSocket.emit("join-room", roomId);
        else newSocket.emit("find-match", data);
      });

      newSocket.on(
        "match-found",
        async (data: { roomId: string; isInitiator: boolean }) => {
          console.log("Match found:", data);
          if (data.isInitiator) await createOffer();
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

      newSocket.on("chat-message", (message) => {
        options.onChatMessage?.(message);
      });

      // ✅ Fixed TypeScript-safe callbacks
      newSocket.on("user-disconnected", () => {
        setIsConnected(false);
        setIsConnecting(false);
        options.onUserDisconnected?.();
      });

      newSocket.on("user-connected", () => {
        options.onUserConnected?.();
      });

      newSocket.on("online-count", (count: number) => {
        options.onOnlineCountUpdate?.(count);
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
    } catch (err) {
      console.error("Connection error:", err);
      setError("Failed to connect");
      setIsConnecting(false);

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

  // ✅ Create WebRTC offer
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

  // ✅ Disconnect & cleanup
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
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

  // ✅ Send chat message
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

  // ✅ Request camera/mic permissions (HTTPS only)
  const requestPermissions = async () => {
    try {
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!isSecure) {
        const msg = `WebRTC requires HTTPS. Current: ${window.location.href}`;
        setError(msg);
        throw new Error(msg);
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = "getUserMedia not supported in this browser";
        setError(msg);
        throw new Error(msg);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      setError(null);
      console.log("Camera & mic access granted");
      return stream;
    } catch (err: any) {
      console.error("Permission denied:", err);
      let msg = "Camera/Microphone access error";
      if (err.name === "NotAllowedError")
        msg = "Permission denied. Please allow access.";
      else if (err.name === "NotFoundError") msg = "No camera/mic found.";
      setError(msg);
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
