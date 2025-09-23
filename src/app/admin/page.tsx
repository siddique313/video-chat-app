"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export default function AdminPage() {
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [waitingUsers, setWaitingUsers] = useState(0);
  const [activeRooms, setActiveRooms] = useState(0);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // Connect to the server
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Admin connected to server");
      addLog("Admin connected to server");
    });

    newSocket.on("online-count", (count: number) => {
      setOnlineUsers(count);
      addLog(`Online users updated: ${count}`);
    });

    newSocket.on("disconnect", () => {
      addLog("Admin disconnected from server");
    });

    // Request initial data
    newSocket.emit("admin-request-stats");

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLog((prev) => [
      `[${timestamp}] ${message}`,
      ...prev.slice(0, 19),
    ]);
  };

  const clearLogs = () => {
    setConnectionLog([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
          Uhmegle Admin Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Online Users</p>
                <p className="text-3xl font-bold text-green-400">
                  {onlineUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Waiting Users</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {waitingUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Rooms</p>
                <p className="text-3xl font-bold text-blue-400">
                  {activeRooms}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Log */}
        <div className="bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Connection Log</h2>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-black/40 rounded-lg p-4 h-64 overflow-y-auto">
            {connectionLog.length === 0 ? (
              <p className="text-gray-400 text-center">
                No connection events yet...
              </p>
            ) : (
              <div className="space-y-1">
                {connectionLog.map((log, index) => (
                  <p key={index} className="text-sm font-mono text-gray-300">
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="mt-8 bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">
            How to Test User Connections
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-green-400 mb-2">
                1. Open Multiple Browser Windows/Tabs
              </h3>
              <p className="text-gray-300">
                Open the chat page in different browser windows or incognito
                tabs to simulate multiple users.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">
                2. Test Connection Flow
              </h3>
              <ul className="text-gray-300 space-y-1 ml-4">
                <li>
                  • Open{" "}
                  <code className="bg-gray-700 px-1 rounded">
                    http://localhost:3000/chat?type=video
                  </code>
                </li>
                <li>• Click "Start" button to begin matching</li>
                <li>• Watch the online count increase in this admin panel</li>
                <li>• Open another tab and repeat to see matching in action</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">
                3. Monitor Real-time Updates
              </h3>
              <p className="text-gray-300">
                The admin dashboard will show real-time updates when users
                connect, disconnect, and get matched.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
