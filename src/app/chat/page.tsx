'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MessageCircle, Sun, Flag, Send, Square, Image as ImageIcon } from 'lucide-react';
import { useWebRTC } from '../../hooks/useWebRTC';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatType = searchParams.get('type') || 'text';
  const interests = searchParams.get('interests') || '';

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{id: string, text: string, isOwn: boolean}>>([]);
  const [onlineCount] = useState(8287);

  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage: sendWebRTCMessage
  } = useWebRTC({
    onRemoteStream: (stream) => {
      console.log('Remote stream received');
    },
    onConnectionStateChange: (state) => {
      console.log('Connection state:', state);
    },
    onChatMessage: (message) => {
      setMessages(prev => [...prev, message]);
    }
  });

  const handleStart = async () => {
    if (isConnecting) return;
    
    try {
      await connect();
      // Add a welcome message
      setMessages([{
        id: '1',
        text: 'Connected! Say hello to your new friend.',
        isOwn: false
      }]);
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setMessages([]);
  };

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        isOwn: true
      };
      setMessages(prev => [...prev, newMessage]);
      sendWebRTCMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-orange-500">uhmegle</h1>
        </div>
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-400" />
          <span className="text-white">{onlineCount}+ online</span>
          <div className="w-8 h-4 bg-gray-600 rounded-full relative">
            <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5"></div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Video Section */}
        {chatType === 'video' && (
          <div className="flex-1 flex flex-col">
            {/* Remote User Video (Top) */}
            <div className="flex-1 bg-gray-800 relative">
              {isConnected ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400">Waiting for connection...</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 text-orange-500 font-semibold">
                uhmegle.com
              </div>
              <div className="absolute bottom-4 right-4">
                <Flag className="w-6 h-6 text-red-500 cursor-pointer hover:text-red-400" />
              </div>
            </div>

            {/* Local User Video (Bottom) */}
            <div className="h-64 bg-gray-900 relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Chat Section */}
        <div className="w-80 bg-black border-l border-gray-800 flex flex-col">
          {/* Welcome and Rules */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-white text-lg mb-4">Welcome to Uhmegle.</h2>
            
            {chatType === 'video' && (
              <div className="bg-red-600 text-white p-2 rounded mb-4 flex items-center gap-2">
                <span className="text-lg">🔞</span>
                <span className="font-semibold">You must be 18+</span>
              </div>
            )}

            <div className="text-white text-sm space-y-2">
              <p>• No nudity, hate speech, or harassment</p>
              {chatType === 'video' && <p>• Your webcam must show you, live</p>}
              <p>• Do not ask for gender. This is not a dating site</p>
              <p>• Violators will be permanently banned</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {!isConnected && !isConnecting && (
              <div className="text-center text-gray-400">
                <p className="mb-4">Click "Start" to begin chatting</p>
                {interests && (
                  <p className="text-sm">Interests: {interests}</p>
                )}
              </div>
            )}
            
            {isConnecting && (
              <div className="text-center text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Connecting you with a stranger...</p>
              </div>
            )}

            {error && (
              <div className="text-center text-red-400 mb-4">
                <p>Error: {error}</p>
                <button
                  onClick={handleStart}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Try Again
                </button>
              </div>
            )}

            {isConnected && (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg max-w-[80%] ${
                      msg.isOwn
                        ? 'bg-blue-600 ml-auto'
                        : 'bg-gray-700'
                    }`}
                  >
                    <p className="text-white text-sm">{msg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-800">
            {isConnected ? (
              <div className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSendMessage}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                    <span className="text-xs text-gray-300">Enter</span>
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleStart}
                  disabled={isConnecting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Start
                  <span className="text-xs text-gray-300">Esc</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
