"use client";

import { Mic, MicOff, Video, VideoOff, PhoneMissed } from "lucide-react";

interface userControlIprops {
  isMuted: boolean;
  isVideoOff: boolean;
  onMuteToggle: () => void;
  onVideoToggle: () => void;
  onDisconnect: () => void;
}
export const UserControls = ({
  isMuted,
  isVideoOff,
  onMuteToggle,
  onVideoToggle,
  onDisconnect,
}: userControlIprops) => {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-2xl">
      <button
        onClick={onMuteToggle}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
          isMuted
            ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
            : "bg-white/20 hover:bg-white/30"
        }`}
      >
        {isMuted ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>

      <button
        onClick={onVideoToggle}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
          isVideoOff
            ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
            : "bg-white/20 hover:bg-white/30"
        }`}
      >
        {isVideoOff ? (
          <VideoOff className="w-6 h-6 text-white" />
        ) : (
          <Video className="w-6 h-6 text-white" />
        )}
      </button>

      <button
        onClick={onDisconnect}
        className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg shadow-red-500/50"
      >
        <PhoneMissed className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};
