import { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebRTCOptions {
  roomId?: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: string) => void;
  onChatMessage?: (message: {id: string, text: string, isOwn: boolean}) => void;
}

export const useWebRTC = (options: UseWebRTCOptions = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const initializePeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', event.candidate);
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
      options.onConnectionStateChange?.(state);
      setIsConnected(state === 'connected');
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
      setError('Failed to access camera/microphone');
      throw err;
    }
  };

  const connect = async (roomId?: string) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      // Initialize socket connection
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      setSocket(newSocket);

      // Initialize peer connection
      const peerConnection = initializePeerConnection();

      // Start local stream
      await startLocalStream();

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server');
        if (roomId) {
          newSocket.emit('join-room', roomId);
        } else {
          newSocket.emit('find-match');
        }
      });

      newSocket.on('match-found', (data: { roomId: string; isInitiator: boolean }) => {
        console.log('Match found:', data);
        if (data.isInitiator) {
          createOffer();
        }
      });

      newSocket.on('offer', async (offer: RTCSessionDescriptionInit) => {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        newSocket.emit('answer', answer);
      });

      newSocket.on('answer', async (answer: RTCSessionDescriptionInit) => {
        await peerConnection.setRemoteDescription(answer);
      });

      newSocket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
        await peerConnection.addIceCandidate(candidate);
      });

      newSocket.on('chat-message', (message: {id: string, text: string, isOwn: boolean}) => {
        options.onChatMessage?.(message);
      });

      newSocket.on('user-disconnected', () => {
        setIsConnected(false);
        setIsConnecting(false);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        setIsConnecting(false);
      });

    } catch (err) {
      setError('Failed to connect');
      setIsConnecting(false);
      console.error('Connection error:', err);
    }
  };

  const createOffer = async () => {
    if (!peerConnectionRef.current) return;

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socket?.emit('offer', offer);
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const disconnect = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }

    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  };

  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.emit('chat-message', message);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage,
  };
};
