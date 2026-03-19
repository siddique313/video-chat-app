"use client";

import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import configuration from "../config/config";
import ProfileSetupModal from "@/component/ProfileSetupModal";

interface Message {
  from: "host" | "remote";
  message: string;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [userCount, setUserCount] = useState("...");
  const [profileOpen, setProfileOpen] = useState(true);
  const [profile, setProfile] = useState({ gender: "", country: "" });
  const [isConnected, setIsConnected] = useState(false);
  const [strangerProfile, setStrangerProfile] = useState<{ gender: string; country: string } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidate[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── CAMERA ── */
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    });
  }, []);

  /* ── PEER ── */
  const createPeerConnection = () => {
    if (pcRef.current) return;
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate && roomIdRef.current)
        socketRef.current?.emit("ice-candidates", { roomId: roomIdRef.current, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
      e.streams[0].getTracks().forEach((t) => remoteStreamRef.current!.addTrack(t));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch(() => {});
      }
      setIsConnected(true);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") setIsConnected(false);
    };
  };

  /* ── CLEANUP ── */
  const cleanup = () => {
    pcRef.current?.close();
    pcRef.current = null;
    remoteStreamRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setMessages([]);
    setIsConnected(false);
    setStrangerProfile(null);
  };

  /* ── START CHAT ── */
  const startChat = (data: { gender: string; country: string }) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    });

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join", { gender: data.gender, country: data.country });

    socket.on("joined", ({ roomId, stranger }) => {
      roomIdRef.current = roomId;
      if (stranger) setStrangerProfile({ gender: stranger.gender, country: stranger.country });
      createPeerConnection();
    });

    socket.on("send-offer", async () => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState !== "stable") return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId: roomIdRef.current, offer: pc.localDescription });
    });

    socket.on("offer", async ({ offer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (pc.signalingState !== "stable") await pc.setLocalDescription({ type: "rollback" });
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId: roomIdRef.current, answer: pc.localDescription });
      pendingIceRef.current.forEach((c) => pc.addIceCandidate(c));
      pendingIceRef.current = [];
    });

    socket.on("answer", async ({ answer }) => { await pcRef.current?.setRemoteDescription(answer); });

    socket.on("ice-candidates", ({ candidate }) => {
      const pc = pcRef.current;
      if (pc?.remoteDescription) pc.addIceCandidate(candidate);
      else pendingIceRef.current.push(candidate);
    });

    socket.on("message", ({ message }) => {
      setMessages((prev) => [...prev, { from: "remote", message }]);
    });

    socket.on("user-count", setUserCount);
    socket.on("leaveRoom", cleanup);
  };

  /* ── ACTIONS ── */
  const handleSkip = () => {
    socketRef.current?.emit("leaveRoom");
    cleanup();
    socketRef.current?.emit("join");
  };

  const handleSend = () => {
    if (!roomIdRef.current || !messageText.trim()) return;
    socketRef.current?.emit("message", { roomId: roomIdRef.current, message: messageText });
    setMessages((prev) => [...prev, { from: "host", message: messageText }]);
    setMessageText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const genderStyle = (g: string) => {
    const lg = g?.toLowerCase();
    if (lg === "male")   return { background: "rgba(59,130,246,0.18)",  borderColor: "rgba(59,130,246,0.35)",  color: "#93c5fd" };
    if (lg === "female") return { background: "rgba(236,72,153,0.18)",  borderColor: "rgba(236,72,153,0.35)",  color: "#f9a8d4" };
    return               { background: "rgba(168,85,247,0.18)",  borderColor: "rgba(168,85,247,0.35)",  color: "#d8b4fe" };
  };

  /* ══════════════════════════ UI ══════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: 'Sora', sans-serif; }

        .root { position: fixed; inset: 0; background: #000; font-family: 'Sora', sans-serif; }

        /* REMOTE VIDEO — full bg */
        .video-remote {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          background: #050508;
          z-index: 1;
          transition: right 0.3s ease;
        }

        /* WAITING */
        .waiting-overlay {
          position: absolute; inset: 0; z-index: 2;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
          pointer-events: none;
          transition: right 0.3s ease;
        }
        .waiting-ring {
          width: 72px; height: 72px; border-radius: 50%;
          border: 1.5px solid rgba(108,99,255,0.3);
          background: rgba(108,99,255,0.07);
          display: flex; align-items: center; justify-content: center;
          animation: breathe 3s ease-in-out infinite;
        }
        @keyframes breathe {
          0%,100% { transform: scale(1); opacity: .7; }
          50%      { transform: scale(1.08); opacity: 1; }
        }
        .waiting-text { font-size: 13px; color: rgba(255,255,255,0.3); letter-spacing: .3px; }

        /* LOCAL PiP */
        .video-local-wrap {
          position: absolute; z-index: 10;
          bottom: 84px; right: 14px;
          width: 100px; height: 140px;
          border-radius: 14px; overflow: hidden;
          border: 1.5px solid rgba(255,255,255,0.14);
          background: #0a0a12;
          box-shadow: 0 8px 28px rgba(0,0,0,0.55);
          transition: all 0.3s ease;
        }
        .video-local { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); display: block; }
        .local-label {
          position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
          font-size: 9px; color: rgba(255,255,255,0.6);
          background: rgba(0,0,0,0.5); padding: 2px 8px; border-radius: 20px;
          font-weight: 500; letter-spacing: .5px; text-transform: uppercase; white-space: nowrap;
        }

        /* TOP BAR */
        .topbar {
          position: absolute; top: 0; left: 0; right: 0; z-index: 20;
          height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 16px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%);
          transition: right 0.3s ease;
        }
        .topbar-logo { font-size: 17px; font-weight: 600; color: #fff; letter-spacing: -.4px; }
        .topbar-logo span { color: #6c63ff; }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .online-pill {
          display: flex; align-items: center; gap: 6px;
          background: rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 4px 12px;
          font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 500;
          backdrop-filter: blur(8px);
        }
        .online-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        /* Chat toggle (mobile/tablet) */
        .chat-toggle-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(108,99,255,0.22); border: 1px solid rgba(108,99,255,0.35);
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(8px); position: relative;
        }
        .msg-badge {
          position: absolute; top: -4px; right: -4px;
          background: #6c63ff; color: #fff;
          font-size: 9px; font-weight: 600;
          width: 16px; height: 16px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #000;
        }

        /* STRANGER INFO BAR */
        .stranger-bar {
          position: absolute; top: 56px; left: 0; right: 0; z-index: 20;
          padding: 6px 16px;
          display: flex; align-items: center; gap: 7px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%);
          pointer-events: none;
          transition: right 0.3s ease;
        }
        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 500; border: 1px solid;
          backdrop-filter: blur(6px);
        }
        .badge-country { background: rgba(20,184,166,0.15); border-color: rgba(20,184,166,0.3); color: #5eead4; }
        .conn-dot { flex-shrink: 0; border-radius: 50%; }

        /* BOTTOM BAR */
        .bottom-bar {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
          padding: 10px 14px 18px;
          display: flex; align-items: center; gap: 9px;
          background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%);
          transition: right 0.3s ease, bottom 0.3s cubic-bezier(.4,0,.2,1);
        }
        .skip-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 0 14px; height: 44px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14);
          border-radius: 13px; color: rgba(255,255,255,0.8);
          font-size: 13px; font-weight: 500; font-family: 'Sora', sans-serif;
          cursor: pointer; transition: all .18s; white-space: nowrap;
          backdrop-filter: blur(8px); flex-shrink: 0;
        }
        .skip-btn:hover { background: rgba(255,255,255,0.13); }
        .msg-input-wrap { flex: 1; position: relative; }
        .msg-input {
          width: 100%; height: 44px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16);
          border-radius: 13px; padding: 0 46px 0 15px;
          color: #fff; font-size: 13.5px; font-family: 'Sora', sans-serif;
          outline: none; transition: all .18s; backdrop-filter: blur(8px);
        }
        .msg-input::placeholder { color: rgba(255,255,255,0.32); }
        .msg-input:focus { border-color: rgba(108,99,255,0.5); background: rgba(108,99,255,0.12); }
        .send-btn {
          position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
          width: 36px; height: 36px; border-radius: 10px;
          background: #6c63ff; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all .18s;
        }
        .send-btn:hover { background: #7c74ff; transform: translateY(-50%) scale(1.05); }
        .send-btn:active { transform: translateY(-50%) scale(.96); }

        /* ══ CHAT PANEL ══ */
        .chat-panel {
          position: absolute; z-index: 30;
          display: flex; flex-direction: column;
          background: rgba(8,8,16,0.86);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.3s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
        }

        /* Mobile — bottom sheet */
        @media (max-width: 767px) {
          .chat-panel { bottom: 0; left: 0; right: 0; height: 58vh; border-radius: 20px 20px 0 0; border-bottom: none; transform: translateY(100%); }
          .chat-panel.open { transform: translateY(0); }
          .chat-open .video-local-wrap { opacity: 0; pointer-events: none; }
          .chat-open .bottom-bar { bottom: 58vh; }
          .video-local-wrap { bottom: 76px; right: 12px; }
        }

        /* Tablet — right drawer */
        @media (min-width: 768px) and (max-width: 1023px) {
          .chat-panel { top: 0; right: 0; bottom: 0; width: 310px; border-radius: 0; border-right: none; border-top: none; border-bottom: none; transform: translateX(100%); }
          .chat-panel.open { transform: translateX(0); }
          .chat-open .video-local-wrap { right: 326px; }
        }

        /* Desktop — always visible sidebar */
        @media (min-width: 1024px) {
          .chat-panel { top: 0; right: 0; bottom: 0; width: 350px; border-radius: 0; border-right: none; border-top: none; border-bottom: none; transform: translateX(0) !important; }
          .chat-toggle-btn { display: none !important; }
          .video-remote, .waiting-overlay, .topbar, .stranger-bar, .bottom-bar { right: 350px; }
          .video-local-wrap { right: 374px; }
        }

        /* ── Panel internals ── */
        .drag-handle { width: 34px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.18); margin: 10px auto 0; flex-shrink: 0; }
        @media (min-width: 768px) { .drag-handle { display: none; } }

        .chat-header { padding: 12px 15px 11px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; }
        .chat-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .chat-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .close-btn {
          width: 26px; height: 26px; border-radius: 7px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.45); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all .15s;
        }
        .close-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
        @media (min-width: 1024px) { .close-btn { display: none; } }

        .stranger-info { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .conn-label { font-size: 11px; font-weight: 500; }
        .my-chip {
          display: inline-flex; align-items: center; gap: 3px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 2px 9px; font-size: 10px; color: rgba(255,255,255,0.28);
        }

        /* Messages */
        .messages-area {
          flex: 1; overflow-y: auto; padding: 12px 13px 6px;
          display: flex; flex-direction: column; gap: 7px;
          scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.07) transparent;
          overscroll-behavior: contain;
        }
        .messages-area::-webkit-scrollbar { width: 3px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }

        .msg-row { display: flex; flex-direction: column; max-width: 80%; animation: msgIn .18s ease; }
        @keyframes msgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .msg-row.host   { align-self: flex-end;  align-items: flex-end; }
        .msg-row.remote { align-self: flex-start; align-items: flex-start; }

        .msg-bubble { padding: 9px 13px; border-radius: 16px; font-size: 13px; line-height: 1.5; font-weight: 400; word-break: break-word; }
        .msg-bubble.host   { background: #6c63ff; color: #fff; border-bottom-right-radius: 4px; }
        .msg-bubble.remote { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); border-bottom-left-radius: 4px; }

        /* Empty */
        .empty-chat { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; opacity:.25; pointer-events:none; }
        .empty-chat p { font-size: 12px; color: rgba(255,255,255,0.7); }

        /* Panel input */
        .chat-input-bar { padding: 9px 11px 13px; border-top: 1px solid rgba(255,255,255,0.07); display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .chat-msg-input {
          flex:1; height: 40px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 11px; padding: 0 13px;
          color: #fff; font-size: 13px; font-family: 'Sora', sans-serif;
          outline: none; transition: all .18s;
        }
        .chat-msg-input::placeholder { color: rgba(255,255,255,0.22); }
        .chat-msg-input:focus { border-color: rgba(108,99,255,0.5); background: rgba(108,99,255,0.08); }
        .chat-send-btn {
          width: 40px; height: 40px; border-radius: 11px;
          background: #6c63ff; border: none; cursor: pointer;
          display:flex; align-items:center; justify-content:center; transition: all .18s; flex-shrink:0;
        }
        .chat-send-btn:hover { background: #7c74ff; }
        .chat-send-btn:active { transform: scale(.95); }
      `}</style>

      <div className={`root${chatOpen ? " chat-open" : ""}`}>

        {/* REMOTE VIDEO */}
        <video ref={remoteVideoRef} autoPlay playsInline className="video-remote" />

        {/* WAITING */}
        {!isConnected && (
          <div className="waiting-overlay">
            <div className="waiting-ring">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(180,170,255,0.65)" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span className="waiting-text">Looking for a stranger…</span>
          </div>
        )}

        {/* LOCAL PiP */}
        <div className="video-local-wrap">
          <video ref={localVideoRef} autoPlay muted playsInline className="video-local" />
          <span className="local-label">You</span>
        </div>

        {/* TOP BAR */}
        <div className="topbar">
          <div className="topbar-logo">rand<span>om</span>chat</div>
          <div className="topbar-right">
            <div className="online-pill">
              <div className="online-dot" />{userCount} online
            </div>
            <button className="chat-toggle-btn" onClick={() => setChatOpen((v) => !v)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {messages.length > 0 && (
                <span className="msg-badge">{messages.length > 9 ? "9+" : messages.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* STRANGER INFO BAR */}
        {strangerProfile && (
          <div className="stranger-bar">
            <div className="conn-dot" style={{ width: 7, height: 7, background: isConnected ? "#4ade80" : "rgba(255,255,255,0.2)" }} />
            <span className="badge" style={genderStyle(strangerProfile.gender)}>
              {strangerProfile.gender || "Unknown"}
            </span>
            <span className="badge badge-country">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-4 6-4 12 0 18M12 3c4 6 4 12 0 18"/>
              </svg>
              {strangerProfile.country || "Unknown"}
            </span>
          </div>
        )}

        {/* BOTTOM BAR */}
        <div className="bottom-bar">
          <button className="skip-btn" onClick={handleSkip}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
            Skip
          </button>
          <div className="msg-input-wrap">
            <input
              className="msg-input"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setChatOpen(true)}
              placeholder="Type a message…"
            />
            <button className="send-btn" onClick={handleSend}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ══ CHAT PANEL ══ */}
        <div className={`chat-panel${chatOpen ? " open" : ""}`}>
          <div className="drag-handle" />

          <div className="chat-header">
            <div className="chat-header-row">
              <span className="chat-title">Messages</span>
              <button className="close-btn" onClick={() => setChatOpen(false)}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="stranger-info">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="conn-dot" style={{ width: 7, height: 7, background: isConnected ? "#4ade80" : "rgba(255,255,255,0.2)", animation: isConnected ? "pulse 2s infinite" : "none" }} />
                <span className="conn-label" style={{ color: isConnected ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
                  {isConnected ? "Connected" : "Searching…"}
                </span>
              </div>

              {strangerProfile && (
                <>
                  <span className="badge" style={genderStyle(strangerProfile.gender)}>
                    {strangerProfile.gender || "Unknown"}
                  </span>
                  <span className="badge badge-country">{strangerProfile.country || "Unknown"}</span>
                </>
              )}

              {profile.gender && (
                <span className="my-chip">
                  You · {profile.gender}{profile.country ? ` · ${profile.country}` : ""}
                </span>
              )}
            </div>
          </div>

          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`msg-row ${m.from}`}>
                  <div className={`msg-bubble ${m.from}`}>{m.message}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-bar">
            <input
              className="chat-msg-input"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
            />
            <button className="chat-send-btn" onClick={handleSend}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        <ProfileSetupModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          onComplete={(data) => {
            setProfile(data);
            setProfileOpen(false);
            startChat(data);
          }}
        />
      </div>
    </>
  );
}