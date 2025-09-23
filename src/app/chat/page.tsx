"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageCircle,
  Sun,
  Send,
  Square,
  Image as ImageIcon,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneMissed,
  Share,
} from "lucide-react";
import { useWebRTC } from "../../hooks/useWebRTC";
import Image from "next/image";
import { Suspense } from "react";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const interests = searchParams.get("interests") || "";

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      isOwn: boolean;
      timestamp?: string;
      isGif?: boolean;
    }>
  >([]);
  const [onlineCount, setOnlineCount] = useState(7371);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sample GIFs for demonstration
  const sampleGifs = [
    "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif",
    "https://media.giphy.com/media/26BRrSvJUa5yrsYms/giphy.gif",
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/3o7aTskHEUdgCQAXde/giphy.gif",
    "https://media.giphy.com/media/26BRv0ZflZliuxj0c/giphy.gif",
    "https://media.giphy.com/media/l0MYs8lAOwpsRdGFy/giphy.gif",
  ];

  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage: sendWebRTCMessage,
    requestPermissions,
  } = useWebRTC({
    onConnectionStateChange: (state) => {
      console.log("Connection state:", state);
    },
    onChatMessage: (message) => {
      setMessages((prev) => [...prev, { ...message, isGif: false }]);
    },
    onUserDisconnected: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: "User disconnected. Click &quot;Start&quot; to find a new match.",
          isOwn: false,
        },
      ]);
    },
    onOnlineCountUpdate: (count) => {
      setOnlineCount(count);
    },
  });

  // Request permissions once on mount
  useEffect(() => {
    requestPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto scroll to bottom of messages when list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicators
  const handleTyping = (text: string) => {
    setMessage(text);

    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      // Emit typing start (this would need to be added to the WebRTC hook)
    } else if (text.length === 0 && isTyping) {
      setIsTyping(false);
      // Emit typing stop
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleStart = async () => {
    if (isConnecting) return;

    setIsStarted(true);
    try {
      await connect();
      // Add a welcome message
      setMessages([
        {
          id: "1",
          text: "Connected! Say hello to your new friend.",
          isOwn: false,
        },
      ]);
    } catch (err) {
      console.error("Failed to connect:", err);
      setIsStarted(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setMessages([]);
    setIsStarted(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isOwn: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      sendWebRTCMessage(message.trim());
      setMessage("");
    }
  };

  const handleSendGif = (gifUrl: string) => {
    if (isConnected) {
      const newMessage = {
        id: Date.now().toString(),
        text: gifUrl,
        isOwn: true,
        timestamp: new Date().toISOString(),
        isGif: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      sendWebRTCMessage(gifUrl);
      setShowGifPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Escape") {
      if (isConnected) {
        handleDisconnect();
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-3 sm:p-6 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            Meet Stranger.com
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-full px-2 sm:px-4 py-1 sm:py-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
            <Sun className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-white font-medium text-xs sm:text-base">
              {onlineCount}+ online
            </span>
          </div>
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

      <div className="flex flex-1 relative z-10 flex-col xl:flex-row">
        {/* Video Section */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4 sm:gap-6 min-h-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* Main Video Container */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-0">
            {/* Remote User Video (Main) */}
            <div className="flex-1 relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 min-h-[300px] sm:min-h-[400px]">
              {isConnected ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Connection Status Indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-xs font-medium text-white/80 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                      Connected
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900/80 to-gray-800/80">
                  <div className="text-center p-6 max-w-md">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse">
                        <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
                      Looking for a stranger...
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base mb-4">
                      We&apos;re finding someone interesting for you to chat
                      with
                    </p>
                    <div className="flex justify-center">
                      <div className="flex gap-2">
                        {[0, 0.1, 0.2].map((delay) => (
                          <div
                            key={delay}
                            className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${delay}s` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Brand Badge */}
              <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10">
                <span className="font-bold text-sm bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  MeetStranger.com
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 border border-white/10 hover:border-white/30 shadow-lg">
                  <span className="text-white font-bold text-sm">P</span>
                </button>
                <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 border border-white/10 hover:border-white/30 shadow-lg">
                  <Share className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Local User Video (Sidebar) */}
            <div className="w-full lg:w-80 xl:w-96 h-48 sm:h-56 lg:h-auto relative rounded-2xl overflow-hidden shadow-xl border border-white/10 bg-gradient-to-br from-gray-800 to-gray-900">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Video Off Overlay */}
              {isVideoOff && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400/60 mb-2" />
                    <p className="text-gray-400/80 text-sm">Camera off</p>
                  </div>
                </div>
              )}

              {/* User Status Badge */}
              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                <span className="text-white text-xs font-medium">You</span>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-md rounded-full p-1 border border-white/10">
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    isMuted
                      ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    isVideoOff
                      ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  ) : (
                    <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>

                <button className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 hover:scale-110">
                  <PhoneMissed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Additional Controls */}
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-medium transition-all duration-200 border border-white/10 hover:border-white/30">
              Next Stranger
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full text-white font-medium transition-all duration-200 shadow-lg shadow-purple-500/25">
              Add Friend
            </button>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full xl:w-80 2xl:w-96 bg-black/20 backdrop-blur-md border-t xl:border-t-0 xl:border-l border-white/10 flex flex-col h-[40vh] xl:h-auto xl:max-h-none">
          {/* Welcome and Rules */}
          <div className="p-3 sm:p-4 border-b border-white/10">
            <h2 className="text-white text-base sm:text-lg mb-3 sm:mb-4 font-semibold">
              Welcome to Uhmegle.
            </h2>

            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-2 sm:p-3 rounded-lg mb-3 sm:mb-4 flex items-center gap-2 shadow-lg">
              <span className="text-lg">🔞</span>
              <span className="font-semibold text-sm sm:text-base">
                You must be 18+
              </span>
            </div>

            <div className="text-white text-xs sm:text-sm space-y-1 sm:space-y-2">
              <p>• No nudity, hate speech, or harassment</p>
              <p>• Your webcam must show you, live</p>
              <p>• Do not ask for gender. This is not a dating site</p>
              <p>• Violators will be permanently banned</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
            {!isStarted && !isConnecting && (
              <div className="text-center text-gray-400 p-2">
                <p className="mb-2 sm:mb-4 text-sm sm:text-base">
                  Click &quot;Start&quot; to begin chatting
                </p>
                {interests && (
                  <p className="text-xs sm:text-sm">Interests: {interests}</p>
                )}
              </div>
            )}

            {isConnecting && (
              <div className="text-center text-gray-400 p-2">
                <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base">
                  Connecting you with a stranger...
                </p>
              </div>
            )}

            {error && (
              <div className="text-center text-red-400 mb-4 p-2">
                <p className="text-sm sm:text-base">Error: {error}</p>
                <button
                  onClick={handleStart}
                  className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm sm:text-base transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {isConnected && (
              <div className="space-y-2 sm:space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[80%] ${
                      msg.isOwn
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 ml-auto shadow-lg shadow-blue-500/25"
                        : "bg-gray-700/80 backdrop-blur-sm"
                    }`}
                  >
                    {msg.isGif ? (
                      <Image
                        src={msg.text}
                        alt="GIF"
                        width={320}
                        height={240}
                        className="h-auto rounded"
                        unoptimized
                      />
                    ) : (
                      <p className="text-white text-xs sm:text-sm">
                        {msg.text}
                      </p>
                    )}
                    {msg.timestamp && (
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                ))}
                {false && (
                  <div className="bg-gray-700/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-gray-400 text-xs sm:text-sm">
                        Stranger is typing...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-2 sm:p-4 border-t border-white/10">
            {!isStarted ? (
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleStart}
                  disabled={isConnecting}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 sm:py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                >
                  <Square className="w-4 h-4" />
                  <span className="text-sm sm:text-base">Start</span>
                  <span className="text-xs text-gray-300">Esc</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {/* GIF Picker */}
                {showGifPicker && (
                  <div className="bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                    <div className="grid grid-cols-3 gap-2">
                      {sampleGifs.map((gif, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendGif(gif)}
                          className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity hover:scale-105"
                        >
                          <Image
                            src={gif}
                            alt={`GIF ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleDisconnect}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                  >
                    <Square className="w-4 h-4" />
                    <span className="text-sm">Stop</span>
                    <span className="text-xs text-gray-300">Esc</span>
                  </button>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 p-3 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none text-sm"
                    />
                    <button
                      onClick={() => setShowGifPicker(!showGifPicker)}
                      className="bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm text-white p-3 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                    >
                      <Send className="w-4 h-4" />
                      <span className="text-sm">Send</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-4 text-white">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
