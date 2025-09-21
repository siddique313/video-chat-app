"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageCircle,
  Sun,
  Flag,
  Send,
  Square,
  Image as ImageIcon,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from "lucide-react";
import { useWebRTC } from "../../hooks/useWebRTC";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatType = searchParams.get("type") || "video";
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
  const [otherUserTyping, setOtherUserTyping] = useState(false);
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
  } = useWebRTC({
    onRemoteStream: (stream) => {
      console.log("Remote stream received");
    },
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
          text: 'User disconnected. Click "Start" to find a new match.',
          isOwn: false,
        },
      ]);
    },
  });

  // Auto scroll to bottom of messages
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-3 sm:p-6 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
            Meet Stranger
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

      <div className="flex flex-1 relative z-10 flex-col lg:flex-row">
        {/* Video Section */}
        <div className="flex-1 flex flex-col p-2 sm:p-4 gap-2 sm:gap-4">
          {/* Remote User Video (Top) */}
          <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 relative rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl border border-white/10 min-h-[200px] sm:min-h-[300px]">
            {isConnected ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center p-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
                    <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <p className="text-gray-300 text-sm sm:text-lg font-medium">
                    Waiting for connection...
                  </p>
                  <div className="flex justify-center mt-3 sm:mt-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/50 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1">
              <span className="text-orange-400 font-semibold text-xs sm:text-sm">
                Meet Stranger.com
              </span>
            </div>
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg shadow-red-500/25">
                <span className="text-white text-xs font-bold">P</span>
              </div>
            </div>
          </div>

          {/* Local User Video (Bottom) */}
          <div className="h-32 sm:h-48 lg:h-64 bg-gradient-to-br from-gray-800 to-gray-900 relative rounded-xl lg:rounded-2xl overflow-hidden shadow-xl border border-white/10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400" />
              </div>
            )}

            {/* Video Controls */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 sm:gap-2">
              <button
                onClick={toggleMute}
                className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                  isMuted
                    ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25"
                    : "bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm"
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <Mic className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                )}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                  isVideoOff
                    ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25"
                    : "bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm"
                }`}
              >
                {isVideoOff ? (
                  <VideoOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                ) : (
                  <Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-80 xl:w-96 bg-black/20 backdrop-blur-md border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col max-h-[50vh] lg:max-h-none">
          {/* Welcome and Rules */}
          <div className="p-3 sm:p-4 border-b border-white/10">
            <h2 className="text-white text-base sm:text-lg mb-3 sm:mb-4 font-semibold">
              Welcome to Meet Stranger.
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
                  Click "Start" to begin chatting
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
                    {(msg as any).isGif ? (
                      <img
                        src={msg.text}
                        alt="GIF"
                        className="max-w-full h-auto rounded"
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
                {otherUserTyping && (
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
                  <div className="bg-gray-800/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-white/10">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                      {sampleGifs.map((gif, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendGif(gif)}
                          className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity hover:scale-105"
                        >
                          <img
                            src={gif}
                            alt={`GIF ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleDisconnect}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                  >
                    <Square className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base">Stop</span>
                    <span className="text-xs text-gray-300">Esc</span>
                  </button>
                  <div className="flex gap-1 sm:gap-2 flex-1">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 p-2 sm:p-3 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg border border-white/20 focus:border-blue-500 focus:outline-none text-sm sm:text-base"
                    />
                    <button
                      onClick={() => setShowGifPicker(!showGifPicker)}
                      className="bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                    >
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline text-sm">Send</span>
                      <span className="text-xs text-gray-300 hidden sm:inline">
                        Enter
                      </span>
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
