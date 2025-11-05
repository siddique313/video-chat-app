import { MessageCircle } from "lucide-react";
import React from "react";
type HeaderProps = {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  connectionStatus: "connected" | "connecting" | "disconnected";
  onlineCount: number;
};
function Header({
  connectionStatus,
  isDarkMode,
  onlineCount,
  setIsDarkMode,
}: HeaderProps) {
  return (
    <header className="flex justify-between items-center p-3 sm:p-6 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
          Meet Stranger.com
        </h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-full px-2 sm:px-4 py-1 sm:py-2">
        <div
          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${
            connectionStatus === "connected"
              ? "bg-green-400"
              : connectionStatus === "connecting"
              ? "bg-yellow-400"
              : "bg-red-400"
          }`}
        ></div>
        <span className="text-white font-medium text-xs sm:text-base">
          {onlineCount}+ online
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div
          className="w-10 h-5 sm:w-12 sm:h-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full relative cursor-pointer shadow-inner"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full absolute top-0.5 transition-all duration-300 shadow-lg ${
              isDarkMode ? "left-0.5" : "left-5 sm:left-6"
            }`}
          ></div>
        </div>
      </div>
    </header>
  );
}

export default Header;
