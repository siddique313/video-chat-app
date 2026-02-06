"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import configuration from "../config/config";
import { getSocketUrl } from "@/app/config/socketUrl";
import AppBar from "@/component/appBar";
import { useUserCount } from "@/hooks/userCounts";

/* ================= TYPES ================= */

interface Message {
  from: "host" | "remote";
  message: string;
}

/* ================= PAGE ================= */

export default function Page() {
  /* ================= STATE ================= */

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [, setMediaReady] = useState(false);
  const [, setRoomId] = useState<string | null>(null);
  const [socketForCount, setSocketForCount] = useState<Socket | null>(null);

  /* ================= REFS ================= */

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidate[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  /* ================= INIT LOCAL CAMERA (FIXED) ================= */

  useEffect(() => {
    const initCamera = async () => {
      try {
        if (localStreamRef.current) return;
        if (
          typeof window === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          console.warn(
            "getUserMedia not available (e.g. SSR or insecure context)",
          );
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.playsInline = true;
          // Removed explicit play() call - autoPlay attribute handles this
        }

        setMediaReady(true);
      } catch (err) {
        console.error("Camera error:", err);
        alert("Please allow camera & microphone access");
      }
    };

    initCamera();
  }, []);

  /* ================= CREATE PEER CONNECTION ================= */

  const createPeerConnection = () => {
    if (pcRef.current) return;

    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate && roomIdRef.current) {
        socketRef.current?.emit("ice-candidates", {
          roomId: roomIdRef.current,
          candidate: e.candidate,
        });
      }
    };

    // Remote stream
    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
          remoteVideoRef.current.playsInline = true;
        }
      }
      if (
        remoteStreamRef.current &&
        !remoteStreamRef.current.getTracks().includes(e.track)
      ) {
        remoteStreamRef.current.addTrack(e.track);
      }
    };
  };

  /* ================= SOCKET + SIGNALING ================= */

  useEffect(() => {
    const socket = io(getSocketUrl(), {
      transports: ["websocket"],
    });

    socketRef.current = socket;
    setSocketForCount(socket);
    socket.emit("join");

    socket.on("joined", ({ roomId }) => {
      setRoomId(roomId);
      roomIdRef.current = roomId;
      createPeerConnection();
    });

    socket.on("send-offer", async () => {
      if (!pcRef.current) return;
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      socket.emit("offer", {
        roomId: roomIdRef.current,
        offer: pcRef.current.localDescription,
      });
    });

    socket.on("offer", async ({ offer }) => {
      createPeerConnection();

      await pcRef.current!.setRemoteDescription(offer);

      const answer = await pcRef.current!.createAnswer();
      await pcRef.current!.setLocalDescription(answer);

      socket.emit("answer", {
        roomId: roomIdRef.current,
        answer: pcRef.current!.localDescription,
      });

      pendingIceRef.current.forEach((c) => pcRef.current?.addIceCandidate(c));
      pendingIceRef.current = [];
    });

    socket.on("answer", async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(answer);
    });

    socket.on("ice-candidates", ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        pcRef.current.addIceCandidate(candidate);
      } else {
        pendingIceRef.current.push(candidate);
      }
    });

    socket.on("message", ({ message }) => {
      setMessages((prev) => [...prev, { from: "remote", message }]);
    });

    socket.on("leaveRoom", cleanupRoom);

    return () => {
      socket.disconnect();
      cleanupRoom();
    };
  }, []);

  /* ================= CLEANUP ================= */

  const cleanupRoom = () => {
    setRoomId(null);
    roomIdRef.current = null;

    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (pcRef.current) pcRef.current.close();
    pcRef.current = null;

    setMessages([]);
  };

  /* ================= ACTIONS ================= */

  const handleSkip = () => {
    socketRef.current?.emit("leaveRoom");
    cleanupRoom();
    socketRef.current?.emit("join");
  };

  const handleSend = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!roomIdRef.current || !messageText.trim()) return;

    socketRef.current?.emit("message", {
      roomId: roomIdRef.current,
      message: messageText,
    });

    setMessages((prev) => [...prev, { from: "host", message: messageText }]);
    setMessageText("");
  };
  /* ================= userCounts Hook ================= */
  const userCount = useUserCount(socketForCount);

  /* ================= UI ================= */

  return (
    <div className="bg-zinc-900 min-h-screen flex flex-col">
      <AppBar online={userCount} />

      <div className="flex-grow mt-2 mx-4 md:mx-20 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* VIDEO */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="bg-black rounded-3xl overflow-hidden h-[45%]">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              onError={(e) => console.error("Remote video error:", e)}
            />
          </div>

          <div className="bg-black rounded-3xl overflow-hidden h-[45%]">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              onError={(e) => console.error("Local video error:", e)}
            />
          </div>
        </div>

        {/* CHAT */}
        <div className="md:col-span-7 bg-zinc-800 rounded-3xl p-5 flex flex-col">
          <div className="flex-grow overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`my-2 ${
                  m.from === "host" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`px-4 py-2 rounded-2xl inline-block ${
                    m.from === "host"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {m.message}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSkip}
              className="bg-green-500 text-white px-4 rounded-lg"
            >
              SKIP
            </button>

            <input
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
              className="flex-grow bg-zinc-700 text-white px-4 rounded-lg"
              placeholder="Type message..."
            />

            <button
              onClick={handleSend}
              className="bg-blue-500 text-white px-4 rounded-lg"
            >
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
