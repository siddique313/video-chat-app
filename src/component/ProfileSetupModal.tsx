"use client";

import React, { useMemo, useState } from "react";

export default function ProfileSetupModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (data: { gender: string; country: string }) => void;
}) {
  const [step, setStep] = useState<"gender" | "country">("gender");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [search, setSearch] = useState("");

  const countries = useMemo(() => [
    "Pakistan", "India", "Bangladesh", "Sri Lanka", "Nepal", "Bhutan",
    "Afghanistan", "China", "Japan", "South Korea", "North Korea",
    "Indonesia", "Malaysia", "Singapore", "Thailand", "Vietnam",
    "Philippines", "Myanmar", "Cambodia", "Laos", "Mongolia",
    "Saudi Arabia", "UAE", "Qatar", "Kuwait", "Oman", "Bahrain",
    "Iran", "Iraq", "Turkey", "Israel", "Jordan", "Lebanon", "Yemen",
    "United States", "United Kingdom", "Canada", "Australia", "Germany",
    "France", "Italy", "Spain", "Brazil", "Mexico", "Russia",
    "Egypt", "Nigeria", "South Africa", "Kenya", "Ghana",
  ], []);

  const filtered = countries.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  const handleReset = () => {
    setStep("gender");
    setGender("");
    setCountry("");
    setSearch("");
    onClose();
  };

  const handleFinish = (c: string) => {
    setCountry(c);
    onComplete({ gender, country: c });
  };

  const genderOptions = [
    {
      label: "Male",
      desc: "Connect as male",
      accent: "#3b82f6",
      bg: "rgba(59,130,246,0.12)",
      border: "rgba(59,130,246,0.28)",
      iconColor: "#93c5fd",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="14" r="5"/>
          <line x1="14.5" y1="9.5" x2="20" y2="4"/>
          <polyline points="16 4 20 4 20 8"/>
        </svg>
      ),
    },
    {
      label: "Female",
      desc: "Connect as female",
      accent: "#ec4899",
      bg: "rgba(236,72,153,0.12)",
      border: "rgba(236,72,153,0.28)",
      iconColor: "#f9a8d4",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="9" r="5"/>
          <line x1="12" y1="14" x2="12" y2="20"/>
          <line x1="9" y1="17" x2="15" y2="17"/>
        </svg>
      ),
    },
    {
      label: "Other",
      desc: "Prefer not to specify",
      accent: "#a855f7",
      bg: "rgba(168,85,247,0.12)",
      border: "rgba(168,85,247,0.28)",
      iconColor: "#d8b4fe",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4"/>
          <line x1="12" y1="2" x2="12" y2="8"/>
          <line x1="12" y1="16" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="8" y2="12"/>
          <line x1="16" y1="12" x2="22" y2="12"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

        .modal-backdrop {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
          animation: bdFade 0.2s ease;
        }

        @media (min-width: 520px) {
          .modal-backdrop {
            align-items: center;
            padding: 16px;
          }
        }

        @keyframes bdFade { from{opacity:0} to{opacity:1} }

        /* ── BOX ── */
        .modal-box {
          background: #0e0e1a;
          border: 1px solid rgba(255,255,255,0.09);
          width: 100%;
          max-width: 440px;
          overflow: hidden;
          font-family: 'Sora', sans-serif;
          box-shadow: 0 24px 80px rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;

          /* Mobile: bottom sheet */
          border-radius: 20px 20px 0 0;
          max-height: 92dvh;
          animation: slideUp 0.28s cubic-bezier(0.4,0,0.2,1);
        }

        @media (min-width: 520px) {
          .modal-box {
            border-radius: 22px;
            max-height: 90vh;
            animation: popIn 0.25s cubic-bezier(0.4,0,0.2,1);
          }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        @keyframes popIn {
          from { transform: scale(0.96) translateY(10px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }

        /* drag handle — mobile only */
        .drag-handle {
          width: 36px; height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.16);
          margin: 12px auto 0;
          flex-shrink: 0;
        }
        @media (min-width: 520px) { .drag-handle { display: none; } }

        /* ── ACCENT BAR ── */
        .modal-accent-bar {
          height: 3px;
          background: linear-gradient(to right, #6c63ff, #a855f7, #ec4899);
          flex-shrink: 0;
        }

        /* ── HEADER ── */
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 0;
          flex-shrink: 0;
        }

        @media (min-width: 520px) { .modal-header { padding: 20px 24px 0; } }

        .modal-logo { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.3px; }
        .modal-logo span { color: #6c63ff; }

        .modal-close {
          width: 30px; height: 30px;
          border-radius: 9px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.4);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .modal-close:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.8); }

        /* ── STEPPER ── */
        .stepper {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 14px 20px 0;
          flex-shrink: 0;
        }
        @media (min-width: 520px) { .stepper { padding: 16px 24px 0; } }

        .step-pip {
          height: 7px;
          border-radius: 4px;
          transition: all 0.25s;
          flex-shrink: 0;
        }
        .step-pip.active   { width: 20px; background: #6c63ff; }
        .step-pip.done     { width: 7px;  border-radius: 50%; background: rgba(108,99,255,0.45); }
        .step-pip.inactive { width: 7px;  border-radius: 50%; background: rgba(255,255,255,0.1); }

        .step-label {
          font-size: 10px; font-weight: 500;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-left: 4px;
        }

        /* ── SCROLLABLE BODY ── */
        .modal-body {
          padding: 16px 20px 0;
          overflow-y: auto;
          flex: 1;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.07) transparent;
        }
        .modal-body::-webkit-scrollbar { width: 3px; }
        .modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }

        @media (min-width: 520px) { .modal-body { padding: 18px 24px 0; } }

        .modal-title {
          font-size: clamp(17px, 4.5vw, 21px);
          font-weight: 600; color: #fff;
          letter-spacing: -0.4px;
          margin-bottom: 5px;
        }
        .modal-subtitle {
          font-size: clamp(12px, 3vw, 13px);
          color: rgba(255,255,255,0.32);
          margin-bottom: 18px;
          line-height: 1.5;
        }

        /* ── GENDER BUTTONS ── */
        .gender-grid { display: flex; flex-direction: column; gap: 9px; padding-bottom: 4px; }

        .gender-btn {
          width: 100%;
          display: flex; align-items: center; gap: 13px;
          padding: clamp(11px, 3vw, 14px) clamp(13px, 3vw, 16px);
          border-radius: clamp(12px, 3vw, 14px);
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          cursor: pointer; transition: all 0.18s;
          text-align: left; font-family: 'Sora', sans-serif;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .gender-btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.14);
          transform: translateX(2px);
        }
        .gender-icon {
          width: clamp(36px, 9vw, 42px);
          height: clamp(36px, 9vw, 42px);
          border-radius: clamp(10px, 3vw, 12px);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.18s;
        }
        .gender-text { flex: 1; min-width: 0; }
        .gender-name { font-size: clamp(13px, 3.5vw, 15px); font-weight: 500; color: #fff; display: block; }
        .gender-desc { font-size: clamp(10px, 2.5vw, 11px); color: rgba(255,255,255,0.28); margin-top: 1px; display: block; }
        .gender-arrow { color: rgba(255,255,255,0.18); transition: all 0.18s; flex-shrink: 0; }
        .gender-btn:hover .gender-arrow { color: rgba(255,255,255,0.5); transform: translateX(2px); }

        /* ── SEARCH ── */
        .search-wrap { position: relative; margin-bottom: 10px; flex-shrink: 0; }
        .search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          height: clamp(40px, 10vw, 46px);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          padding: 0 14px 0 38px;
          color: #fff;
          font-size: clamp(13px, 3vw, 14px);
          font-family: 'Sora', sans-serif;
          outline: none; transition: all 0.18s;
          -webkit-appearance: none;
        }
        .search-input::placeholder { color: rgba(255,255,255,0.2); }
        .search-input:focus {
          border-color: rgba(108,99,255,0.45);
          background: rgba(108,99,255,0.06);
        }

        /* ── COUNTRY LIST ── */
        .country-list {
          display: flex; flex-direction: column; gap: 2px;
          padding-bottom: 6px;
        }
        .country-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%;
          padding: clamp(9px, 2.5vw, 11px) 12px;
          border-radius: 10px; border: none;
          background: transparent;
          color: rgba(255,255,255,0.72);
          font-size: clamp(13px, 3vw, 14px);
          font-family: 'Sora', sans-serif;
          cursor: pointer; text-align: left; transition: all 0.14s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .country-btn:hover { background: rgba(108,99,255,0.1); color: #fff; }
        .country-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(108,99,255,0.35); flex-shrink: 0; transition: all 0.14s;
        }
        .country-btn:hover .country-dot { background: #6c63ff; }
        .country-empty {
          padding: 28px 16px; text-align: center;
          color: rgba(255,255,255,0.18); font-size: 13px;
        }

        /* ── FOOTER ── */
        .modal-footer {
          padding: clamp(10px, 3vw, 14px) 20px clamp(14px, 5vw, 20px);
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        @media (min-width: 520px) { .modal-footer { padding: 12px 24px 18px; } }

        .back-btn {
          display: flex; align-items: center; gap: 5px;
          background: none; border: none;
          color: rgba(255,255,255,0.35);
          font-size: clamp(12px, 3vw, 13px);
          font-family: 'Sora', sans-serif;
          cursor: pointer; transition: all 0.15s; padding: 6px 0;
          -webkit-tap-highlight-color: transparent;
        }
        .back-btn:hover { color: rgba(255,255,255,0.7); }

        .gender-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(108,99,255,0.14);
          border: 1px solid rgba(108,99,255,0.25);
          border-radius: 20px;
          padding: 3px 11px;
          font-size: clamp(10px, 2.5vw, 11px);
          color: #a99fff; font-weight: 500;
        }
      `}</style>

      <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleReset(); }}>
        <div className="modal-box">

          {/* drag pill — mobile */}
          <div className="drag-handle" />

          {/* accent bar */}
          <div className="modal-accent-bar" />

          {/* header */}
          <div className="modal-header">
            <div className="modal-logo">rand<span>om</span>chat</div>
            <button className="modal-close" onClick={handleReset} aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* stepper */}
          <div className="stepper">
            <div className={`step-pip ${step === "gender" ? "active" : "done"}`} />
            <div className={`step-pip ${step === "country" ? "active" : "inactive"}`} />
            <span className="step-label">{step === "gender" ? "Step 1 of 2" : "Step 2 of 2"}</span>
          </div>

          {/* scrollable body */}
          <div className="modal-body">
            {step === "gender" ? (
              <>
                <div className="modal-title">Who are you?</div>
                <div className="modal-subtitle">Choose your gender to help us find the right match.</div>
                <div className="gender-grid">
                  {genderOptions.map((opt) => (
                    <button
                      key={opt.label}
                      className="gender-btn"
                      style={gender === opt.label
                        ? { borderColor: opt.border, background: opt.bg }
                        : {}}
                      onClick={() => { setGender(opt.label); setStep("country"); }}
                    >
                      <div
                        className="gender-icon"
                        style={{ background: opt.bg, color: opt.iconColor, border: `1px solid ${opt.border}` }}
                      >
                        {opt.icon}
                      </div>
                      <div className="gender-text">
                        <span className="gender-name" style={gender === opt.label ? { color: opt.accent } : {}}>
                          {opt.label}
                        </span>
                        <span className="gender-desc">{opt.desc}</span>
                      </div>
                      <svg className="gender-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="modal-title">Where are you from?</div>
                <div className="modal-subtitle">Select your country to personalize your experience.</div>
                <div className="search-wrap">
                  <span className="search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                  <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country…"
                    autoFocus
                  />
                </div>
                <div className="country-list">
                  {filtered.length > 0 ? filtered.map((c) => (
                    <button key={c} className="country-btn" onClick={() => handleFinish(c)}>
                      <span className="country-dot" />
                      {c}
                    </button>
                  )) : (
                    <div className="country-empty">No country found</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* footer */}
          <div className="modal-footer">
            {step === "country" ? (
              <button className="back-btn" onClick={() => setStep("gender")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
            ) : <span />}

            {step === "country" && gender && (
              <span className="gender-chip">{gender}</span>
            )}
          </div>

        </div>
      </div>
    </>
  );
}