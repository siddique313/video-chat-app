"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
 
export default function Home() {
  const [interests, setInterests] = useState("");
  const [chatType, setChatType] = useState<"text" | "video" | null>(null);
  const [onlineCount, setOnlineCount] = useState(6824);
  const router = useRouter();
 
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount((n) => n + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(t);
  }, []);
 
  const handleStartChat = () => {
    if (!chatType) return;
    const params = new URLSearchParams();
    if (interests.trim()) params.set("interests", interests.trim());
    params.set("type", chatType);
    router.push(`/chat?${params.toString()}`);
  };
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
 
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
 
        html { font-size: 16px; }
 
        body {
          font-family: 'Sora', sans-serif;
          background: #06060d;
          color: #fff;
          min-height: 100vh;
          -webkit-text-size-adjust: 100%;
        }
 
        .home-root {
          min-height: 100vh;
          background: #06060d;
          position: relative;
          overflow-x: hidden;
          font-family: 'Sora', sans-serif;
          display: flex;
          flex-direction: column;
        }
 
        /* ── BG GLOWS ── */
        .bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .bg-glow-1 {
          width: clamp(200px, 50vw, 500px);
          height: clamp(200px, 50vw, 500px);
          background: rgba(108,99,255,0.09);
          top: -80px; left: -80px;
        }
        .bg-glow-2 {
          width: clamp(160px, 40vw, 400px);
          height: clamp(160px, 40vw, 400px);
          background: rgba(236,72,153,0.06);
          bottom: -60px; right: -60px;
        }
 
        /* ── TOPBAR ── */
        .topbar {
          position: relative; z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
 
        @media (min-width: 640px) { .topbar { padding: 20px 32px; } }
        @media (min-width: 1024px) { .topbar { padding: 22px 48px; } }
 
        .logo {
          font-size: clamp(16px, 4vw, 20px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
          white-space: nowrap;
        }
        .logo span { color: #6c63ff; }
 
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 5px 12px;
          flex-shrink: 0;
        }
 
        .online-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s infinite;
          flex-shrink: 0;
        }
 
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:.5; transform:scale(.8); }
        }
 
        .online-count {
          font-size: clamp(11px, 2.5vw, 13px);
          font-weight: 500;
          color: rgba(255,255,255,0.7);
          white-space: nowrap;
        }
 
        /* ── HERO ── */
        .hero {
          position: relative; z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: clamp(32px, 8vw, 64px) 20px 0;
        }
 
        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(108,99,255,0.12);
          border: 1px solid rgba(108,99,255,0.25);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: clamp(11px, 2.5vw, 13px);
          font-weight: 500;
          color: #a99fff;
          margin-bottom: clamp(16px, 4vw, 24px);
          letter-spacing: 0.3px;
        }
        .hero-tag-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #6c63ff;
          flex-shrink: 0;
        }
 
        .hero-title {
          font-size: clamp(26px, 7vw, 54px);
          font-weight: 700;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: clamp(12px, 3vw, 18px);
          max-width: 700px;
          padding: 0 8px;
        }
        .hero-title .accent {
          background: linear-gradient(135deg, #6c63ff 0%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
 
        .hero-subtitle {
          font-size: clamp(13px, 3vw, 15px);
          color: rgba(255,255,255,0.38);
          max-width: 440px;
          line-height: 1.7;
          font-weight: 400;
          margin-bottom: clamp(28px, 6vw, 48px);
          padding: 0 8px;
        }
 
        /* ── MAIN CARD ── */
        .card {
          position: relative; z-index: 10;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: clamp(16px, 4vw, 24px);
          padding: clamp(18px, 5vw, 32px);
          width: calc(100% - 32px);
          max-width: 500px;
          margin: 0 auto clamp(32px, 6vw, 60px);
        }
 
        /* ── SECTION LABEL ── */
        .section-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.25);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
 
        /* ── CHAT TYPE GRID ── */
        .type-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 22px;
        }
 
        .type-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: clamp(14px, 4vw, 22px) 10px;
          border-radius: clamp(12px, 3vw, 16px);
          border: 1.5px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Sora', sans-serif;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
 
        .type-btn:hover {
          border-color: rgba(108,99,255,0.3);
          background: rgba(108,99,255,0.06);
        }
 
        .type-btn.active {
          border-color: #6c63ff;
          background: rgba(108,99,255,0.12);
        }
 
        .type-icon {
          width: clamp(36px, 9vw, 46px);
          height: clamp(36px, 9vw, 46px);
          border-radius: clamp(10px, 3vw, 14px);
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .type-btn.active .type-icon { background: rgba(108,99,255,0.2); }
 
        .type-name {
          font-size: clamp(13px, 3vw, 15px);
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          transition: color 0.2s;
        }
        .type-btn.active .type-name { color: #fff; }
 
        .type-desc {
          font-size: clamp(10px, 2vw, 12px);
          color: rgba(255,255,255,0.22);
          transition: color 0.2s;
          text-align: center;
        }
        .type-btn.active .type-desc { color: rgba(255,255,255,0.45); }
 
        /* ── INTERESTS INPUT ── */
        .input-wrap {
          position: relative;
          margin-bottom: 14px;
        }
        .input-icon {
          position: absolute;
          left: 13px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.2);
          pointer-events: none;
          flex-shrink: 0;
        }
        .interests-input {
          width: 100%;
          height: clamp(42px, 10vw, 50px);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: clamp(12px, 3vw, 14px);
          padding: 0 14px 0 40px;
          color: #fff;
          font-size: clamp(13px, 3vw, 14px);
          font-family: 'Sora', sans-serif;
          outline: none;
          transition: all 0.18s;
          -webkit-appearance: none;
        }
        .interests-input::placeholder { color: rgba(255,255,255,0.2); }
        .interests-input:focus {
          border-color: rgba(108,99,255,0.4);
          background: rgba(108,99,255,0.06);
        }
 
        /* ── VIDEO WARNING ── */
        .video-warn {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.18);
          border-radius: 12px;
          padding: 11px 13px;
          margin-bottom: 14px;
          font-size: clamp(11px, 2.5vw, 13px);
          color: rgba(245,158,11,0.85);
          animation: fadeWarn 0.22s ease;
          line-height: 1.5;
        }
        @keyframes fadeWarn {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .video-warn svg { flex-shrink: 0; margin-top: 1px; }
 
        /* ── START BUTTON ── */
        .start-btn {
          width: 100%;
          height: clamp(46px, 11vw, 54px);
          border-radius: clamp(12px, 3vw, 16px);
          background: #6c63ff;
          border: none;
          color: #fff;
          font-size: clamp(13px, 3.5vw, 15px);
          font-weight: 600;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .start-btn:hover:not(:disabled) {
          background: #7c74ff;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(108,99,255,0.35);
        }
        .start-btn:active:not(:disabled) { transform: translateY(0); }
        .start-btn:disabled {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.22);
          cursor: not-allowed;
        }
 
        /* ── CARD NOTE ── */
        .card-note {
          font-size: clamp(11px, 2.5vw, 12px);
          color: rgba(255,255,255,0.16);
          text-align: center;
          margin-top: 14px;
          line-height: 1.6;
        }
 
        /* ── FEATURE CHIPS ── */
        .features {
          position: relative; z-index: 10;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 16px clamp(40px, 8vw, 72px);
          max-width: 520px;
          margin: 0 auto;
        }
 
        .feat-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: clamp(10px, 2.5vw, 12px);
          color: rgba(255,255,255,0.32);
          font-weight: 500;
          white-space: nowrap;
        }
        .feat-chip-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
      `}</style>
 
      <div className="home-root">
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
 
        {/* TOPBAR */}
        <header className="topbar">
          <div className="logo">rand<span>om</span>chat</div>
          <div className="topbar-right">
            <div className="online-dot" />
            <span className="online-count">{onlineCount.toLocaleString()} online</span>
          </div>
        </header>
 
        {/* HERO */}
        <div className="hero">
          <div className="hero-tag">
            <div className="hero-tag-dot" />
            The Omegle alternative
          </div>
          <h1 className="hero-title">
            Meet strangers who<br />
            share your <span className="accent">vibe</span>
          </h1>
          <p className="hero-subtitle">
            Instantly paired with someone new. Text or video — your choice. No sign-up, no waiting.
          </p>
        </div>
 
        {/* MAIN CARD */}
        <div className="card">
          <p className="section-label">Choose format</p>
          <div className="type-row">
            <button
              className={`type-btn${chatType === "text" ? " active" : ""}`}
              onClick={() => setChatType("text")}
            >
              <div className="type-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke={chatType === "text" ? "#a99fff" : "rgba(255,255,255,0.3)"}
                  strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="type-name">Text</span>
              <span className="type-desc">Chat by typing</span>
            </button>
 
            <button
              className={`type-btn${chatType === "video" ? " active" : ""}`}
              onClick={() => setChatType("video")}
            >
              <div className="type-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke={chatType === "video" ? "#a99fff" : "rgba(255,255,255,0.3)"}
                  strokeWidth="1.8">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <span className="type-name">Video</span>
              <span className="type-desc">Face to face</span>
            </button>
          </div>
 
          <p className="section-label">Your interests</p>
          <div className="input-wrap">
            <span className="input-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </span>
            <input
              className="interests-input"
              type="text"
              placeholder="e.g. music, gaming, coding… (optional)"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
          </div>
 
          {chatType === "video" && (
            <div className="video-warn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Video is monitored. Please keep it clean and respectful.
            </div>
          )}
 
          <button className="start-btn" onClick={handleStartChat} disabled={!chatType}>
            {chatType ? (
              <>
                Start {chatType === "text" ? "Text" : "Video"} Chat
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            ) : "Select a chat type to begin"}
          </button>
 
          <p className="card-note">
            By starting a chat you agree to our community guidelines. Be kind, be respectful.
          </p>
        </div>
 
        {/* CHIPS */}
        <div className="features">
          {[
            { label: "No sign-up", color: "#4ade80" },
            { label: "Interests", color: "#6c63ff" },
            { label: "Text & Video", color: "#a855f7" },
            { label: "Anonymous", color: "#f59e0b" },
            { label: "Moderated", color: "#3b82f6" },
          ].map((f) => (
            <div key={f.label} className="feat-chip">
              <div className="feat-chip-dot" style={{ background: f.color }} />
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}