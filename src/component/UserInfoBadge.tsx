"use client";

interface UserInfoBadgeProps {
  isLocal: boolean;
  interests?: string;
  connectionTime: number; // in seconds
}
export const UserInfoBadge = ({
  isLocal,
  interests,
  connectionTime,
}: UserInfoBadgeProps) => {
  return (
    <div
      className={`absolute ${
        isLocal ? "top-3 left-3" : "top-4 right-4"
      } bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-white/20`}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-white text-sm font-medium">
          {isLocal ? "You" : "Stranger"}
        </span>
      </div>
      {!isLocal && interests && (
        <div className="text-xs text-gray-300 mt-1">Interests: {interests}</div>
      )}
      {connectionTime > 0 && (
        <div className="text-xs text-gray-400 mt-1">
          Time: {Math.floor(connectionTime / 60)}:
          {(connectionTime % 60).toString().padStart(2, "0")}
        </div>
      )}
    </div>
  );
};
