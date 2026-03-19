"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import configuration from "../config/config";
import AppBar from "@/component/appBar";

interface Message {
  from: "host" | "remote";
  message: string;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [userCount, setUserCount] = useState("🔃");

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidate[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  /* ================= CAMERA ================= */

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    init();
  }, []);

  /* ================= PEER ================= */

  const createPeerConnection = () => {
    if (pcRef.current) return;

    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Add tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // ICE
    pc.onicecandidate = (e) => {
      if (e.candidate && roomIdRef.current) {
        socketRef.current?.emit("ice-candidates", {
          roomId: roomIdRef.current,
          candidate: e.candidate,
        });
      }
    };

    // TRACK (FIXED)
    pc.ontrack = (e) => {
      console.log("TRACK RECEIVED");

      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      e.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current!.addTrack(track);
      });

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;

        remoteVideoRef.current
          .play()
          .catch((err) => console.log("Play error:", err));
      }
    };

    // DEBUG
    pc.onconnectionstatechange = () => {
      console.log("Connection:", pc.connectionState);
    };
  };

  /* ================= SOCKET ================= */

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
      transports: ["websocket"],
    });

    socketRef.current = socket;
    socket.emit("join");

    socket.on("joined", ({ roomId }) => {
      roomIdRef.current = roomId;
      createPeerConnection();
    });

    // SEND OFFER (FIXED)
    socket.on("send-offer", async () => {
      const pc = pcRef.current;
      if (!pc) return;

      if (pc.signalingState !== "stable") return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", {
        roomId: roomIdRef.current,
        offer: pc.localDescription,
      });
    });

    // RECEIVE OFFER (FIXED)
    socket.on("offer", async ({ offer }) => {
      const pc = pcRef.current;
      if (!pc) return;

      if (pc.signalingState !== "stable") {
        await pc.setLocalDescription({ type: "rollback" });
      }

      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", {
        roomId: roomIdRef.current,
        answer: pc.localDescription,
      });

      pendingIceRef.current.forEach((c) => pc.addIceCandidate(c));
      pendingIceRef.current = [];
    });

    socket.on("answer", async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(answer);
    });

    socket.on("ice-candidates", ({ candidate }) => {
      const pc = pcRef.current;

      if (pc?.remoteDescription) {
        pc.addIceCandidate(candidate);
      } else {
        pendingIceRef.current.push(candidate);
      }
    });

    socket.on("message", ({ message }) => {
      setMessages((prev) => [...prev, { from: "remote", message }]);
    });

    socket.on("user-count", setUserCount);

    socket.on("leaveRoom", cleanup);

    return () => {
      socket.disconnect();
      cleanup();
    };
  }, []);

  /* ================= CLEANUP ================= */

  const cleanup = () => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    pcRef.current = null;
    remoteStreamRef.current = null;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setMessages([]);
  };

  /* ================= ACTIONS ================= */

  const handleSkip = () => {
    socketRef.current?.emit("leaveRoom");
    cleanup();
    socketRef.current?.emit("join");
  };

  const handleSend = () => {
    if (!roomIdRef.current || !messageText.trim()) return;

    socketRef.current?.emit("message", {
      roomId: roomIdRef.current,
      message: messageText,
    });

    setMessages((prev) => [...prev, { from: "host", message: messageText }]);
    setMessageText("");
  };

  /* ================= UI ================= */

  return (
    <div className="bg-zinc-900 min-h-screen flex flex-col">
      <AppBar online={userCount} />

      <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 p-4">
        <div className="md:col-span-5 flex flex-col gap-4">
          <video
            ref={remoteVideoRef}
            autoPlay
            muted
            playsInline
            className="bg-black rounded-2xl h-[45%]"
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="bg-black rounded-2xl h-[45%]"
          />
        </div>

        <div className="md:col-span-7 bg-zinc-800 rounded-2xl p-4 flex flex-col">
          <div className="flex-grow overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={m.from === "host" ? "text-right" : ""}>
                <span className="bg-blue-500 text-white px-3 py-1 rounded">
                  {m.message}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={handleSkip} className="bg-green-500 px-4">
              SKIP
            </button>

            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-grow bg-zinc-700 px-3"
            />

            <button onClick={handleSend} className="bg-blue-500 px-4">
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}