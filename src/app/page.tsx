"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Video, Sun, Flag } from "lucide-react";

export default function Home() {
  const [interests, setInterests] = useState("");
  const [chatType, setChatType] = useState<"text" | "video" | null>(null);
  const router = useRouter();

  const handleStartChat = () => {
    if (chatType) {
      const params = new URLSearchParams();
      if (interests.trim()) {
        params.set("interests", interests.trim());
      }
      params.set("type", chatType);
      router.push(`/chat?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-orange-500">Meet Stranger</h1>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-400" />
          <span className="text-white">6824+ online</span>
          <div className="w-8 h-4 bg-gray-600 rounded-full relative">
            <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex justify-center items-center min-h-[calc(100vh-120px)] p-6">
        <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Talk to strangers with your interests!
          </h2>

          <p className="text-white mb-8 text-center">
            Meet Stranger is the new Omegle alternative, where you can meet new
            friends. When you use Meet Stranger, you are paired in a random chat
            with a stranger.
          </p>

          <div className="mb-6">
            <p className="text-white mb-4 text-center">Start chatting:</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setChatType("text")}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  chatType === "text"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                Text
              </button>
              <span className="text-white flex items-center">or</span>
              <button
                onClick={() => setChatType("video")}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  chatType === "video"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                Video
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-white mb-2">What do you wanna talk about?</p>
            <input
              type="text"
              placeholder="Add your interests (optional)"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {chatType === "video" && (
            <div className="bg-gray-700 p-3 rounded-lg mb-6 flex items-center gap-2">
              <Flag className="w-5 h-5 text-orange-500" />
              <span className="text-white">
                Video is monitored. Keep it clean !
              </span>
            </div>
          )}

          <button
            onClick={handleStartChat}
            disabled={!chatType}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Start Chatting
          </button>

          <p className="text-white text-sm mt-6 text-center">
            Want more relevant chats? Add your interests on Meet Stranger to
            instantly connect with strangers who share your vibe! Skip the
            awkward intros and dive into conversations about things you both
            love. It's a smarter way to meet new people and why many see Meet
            Stranger as a top Omegle alternative.
          </p>
        </div>
      </main>
    </div>
  );
}
