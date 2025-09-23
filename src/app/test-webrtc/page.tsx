"use client";

import { useState, useRef, useEffect } from "react";
import { useWebRTC } from "../../hooks/useWebRTC";

export default function WebRTCTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<{
    camera: PermissionState | null;
    microphone: PermissionState | null;
  }>({ camera: null, microphone: null });

  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    requestPermissions,
    connectionState,
  } = useWebRTC({
    onRemoteStream: (stream) => {
      addTestResult("✅ Remote stream received successfully");
    },
    onConnectionStateChange: (state) => {
      addTestResult(`🔄 Connection state changed: ${state}`);
    },
    onChatMessage: (message) => {
      addTestResult(`💬 Chat message received: ${message.text}`);
    },
    onUserDisconnected: () => {
      addTestResult("❌ User disconnected");
    },
    onUserConnected: () => {
      addTestResult("✅ User connected");
    },
    onOnlineCountUpdate: (count) => {
      addTestResult(`👥 Online count updated: ${count}`);
    },
  });

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults((prev) => [...prev, `[${timestamp}] ${result}`]);
  };

  const checkPermissions = async () => {
    try {
      addTestResult("🔍 Checking camera and microphone permissions...");

      // Check if permissions API is available
      if ("permissions" in navigator) {
        const cameraPermission = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        const microphonePermission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        setPermissionStatus({
          camera: cameraPermission.state,
          microphone: microphonePermission.state,
        });

        addTestResult(`📷 Camera permission: ${cameraPermission.state}`);
        addTestResult(
          `🎤 Microphone permission: ${microphonePermission.state}`
        );
      } else {
        addTestResult("⚠️ Permissions API not available in this browser");
      }
    } catch (err) {
      addTestResult(`❌ Error checking permissions: ${err}`);
    }
  };

  const testMediaDevices = async () => {
    try {
      addTestResult("🎥 Testing media devices...");

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );

      addTestResult(`📹 Found ${videoDevices.length} video devices`);
      addTestResult(`🎤 Found ${audioDevices.length} audio devices`);

      if (videoDevices.length === 0) {
        addTestResult(
          "⚠️ No video devices found - camera may not be available"
        );
      }
      if (audioDevices.length === 0) {
        addTestResult(
          "⚠️ No audio devices found - microphone may not be available"
        );
      }
    } catch (err) {
      addTestResult(`❌ Error enumerating devices: ${err}`);
    }
  };

  const testGetUserMedia = async () => {
    try {
      addTestResult("🎬 Testing getUserMedia...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      addTestResult(
        "✅ getUserMedia successful - camera and microphone access granted"
      );

      // Test stream properties
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      addTestResult(`📹 Video tracks: ${videoTracks.length}`);
      addTestResult(`🎤 Audio tracks: ${audioTracks.length}`);

      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        addTestResult(
          `📹 Video track settings: ${JSON.stringify(videoTrack.getSettings())}`
        );
      }

      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        addTestResult(
          `🎤 Audio track settings: ${JSON.stringify(audioTrack.getSettings())}`
        );
      }

      // Stop the stream
      stream.getTracks().forEach((track) => track.stop());
      addTestResult("🛑 Test stream stopped");
    } catch (err: any) {
      addTestResult(`❌ getUserMedia failed: ${err.name} - ${err.message}`);

      if (err.name === "NotAllowedError") {
        addTestResult(
          "🚫 Permission denied - user needs to grant camera/microphone access"
        );
        addTestResult(
          "💡 Solution: Click the camera/microphone icon in the address bar and allow access"
        );
      } else if (err.name === "NotFoundError") {
        addTestResult(
          "🔍 No camera/microphone found - check if devices are connected"
        );
      } else if (err.name === "NotReadableError") {
        addTestResult(
          "⚠️ Camera/microphone is being used by another application"
        );
      } else if (err.name === "OverconstrainedError") {
        addTestResult("⚙️ Camera/microphone constraints cannot be satisfied");
      }
    }
  };

  const testWebRTCConnection = async () => {
    try {
      addTestResult("🌐 Testing WebRTC connection...");

      if (isConnecting) {
        addTestResult("⏳ Already connecting, please wait...");
        return;
      }

      await connect();
      addTestResult("✅ WebRTC connection initiated");
    } catch (err) {
      addTestResult(`❌ WebRTC connection failed: ${err}`);
    }
  };

  const runFullTest = async () => {
    setIsTestRunning(true);
    setTestResults([]);

    addTestResult("🚀 Starting WebRTC test suite...");
    addTestResult(`🌐 Browser: ${navigator.userAgent}`);
    addTestResult(`🔗 Protocol: ${window.location.protocol}`);
    addTestResult(`🏠 Host: ${window.location.host}`);

    // Check if running on HTTPS or localhost
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      addTestResult(
        "⚠️ WARNING: WebRTC requires HTTPS or localhost for camera/microphone access"
      );
    }

    await checkPermissions();
    await testMediaDevices();
    await testGetUserMedia();
    await testWebRTCConnection();

    addTestResult("🏁 Test suite completed");
    setIsTestRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const copyResults = () => {
    const resultsText = testResults.join("\n");
    navigator.clipboard.writeText(resultsText);
    addTestResult("📋 Results copied to clipboard");
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">WebRTC Test Suite</h1>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
            <p
              className={`text-sm ${
                isConnected
                  ? "text-green-400"
                  : isConnecting
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {isConnected
                ? "✅ Connected"
                : isConnecting
                ? "⏳ Connecting..."
                : "❌ Disconnected"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              State: {connectionState}
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Permissions</h3>
            <p className="text-sm">
              📷 Camera: {permissionStatus.camera || "Unknown"}
            </p>
            <p className="text-sm">
              🎤 Microphone: {permissionStatus.microphone || "Unknown"}
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Error Status</h3>
            <p
              className={`text-sm ${error ? "text-red-400" : "text-green-400"}`}
            >
              {error ? `❌ ${error}` : "✅ No errors"}
            </p>
          </div>
        </div>

        {/* Video Elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Local Video</h3>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-48 bg-gray-700 rounded"
            />
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Remote Video</h3>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-48 bg-gray-700 rounded"
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={runFullTest}
            disabled={isTestRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold"
          >
            {isTestRunning ? "⏳ Running Tests..." : "🚀 Run Full Test"}
          </button>

          <button
            onClick={testGetUserMedia}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold"
          >
            🎬 Test Camera/Mic
          </button>

          <button
            onClick={testWebRTCConnection}
            disabled={isConnecting}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold"
          >
            🌐 Test WebRTC
          </button>

          <button
            onClick={requestPermissions}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-semibold"
          >
            🔐 Request Permissions
          </button>

          <button
            onClick={disconnect}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold"
          >
            🛑 Disconnect
          </button>

          <button
            onClick={clearResults}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold"
          >
            🗑️ Clear Results
          </button>

          <button
            onClick={copyResults}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold"
          >
            📋 Copy Results
          </button>
        </div>

        {/* Test Results */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-400">
                No test results yet. Click "Run Full Test" to start.
              </p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mac-Specific Instructions */}
        <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-yellow-400">
            🍎 Mac-Specific Instructions
          </h3>
          <div className="text-sm space-y-2">
            <p>If you're getting camera/microphone permission denied on Mac:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>
                Go to <strong>System Preferences</strong> →{" "}
                <strong>Security & Privacy</strong> → <strong>Privacy</strong>
              </li>
              <li>
                Select <strong>Camera</strong> and ensure your browser is
                checked
              </li>
              <li>
                Select <strong>Microphone</strong> and ensure your browser is
                checked
              </li>
              <li>
                If your browser isn't listed, try refreshing the page and
                granting permission when prompted
              </li>
              <li>Restart your browser if permissions were just granted</li>
              <li>
                Make sure no other applications are using the camera/microphone
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
