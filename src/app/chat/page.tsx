"use client";
import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import configuration from "../config/config";
import AppBar from "@/component/appBar";

interface Message {
  from: "host" | "remote";
  message: string;
}

export default function Page() {
  /* ================= STATE ================= */
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [userCount, setUserCount] = useState("🔃");
  const [mediaReady, setMediaReady] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  /* ================= REFS ================= */
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidate[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  /* ================= INIT LOCAL MEDIA (ONCE) ================= */
  useEffect(() => {
    const initLocalMedia = async () => {
      if (localStreamRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaReady(true);
    };

    initLocalMedia();
  }, []);

  /* ================= CREATE PC WHEN READY ================= */
  useEffect(() => {
    if (roomId && mediaReady && !pcRef.current) {
      createPeerConnection();
    }
  }, [roomId, mediaReady]);

  /* ================= CREATE PEER CONNECTION ================= */
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // ICE
    pc.onicecandidate = (e) => {
      if (e.candidate && roomIdRef.current) {
        socketRef.current?.emit("ice-candidates", {
          roomId: roomIdRef.current,
          candidate: e.candidate,
        });
      }
    };

    // Remote tracks
    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
      }
      remoteStreamRef.current.addTrack(e.track);
    };

    return pc;
  };

  /* ================= SOCKET + SIGNALING ================= */
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.emit("join");

    socket.on("joined", ({ roomId }) => {
      setRoomId(roomId);
      roomIdRef.current = roomId;
    });

    socket.on("send-offer", async () => {
      if (!pcRef.current) return;
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("offer", { roomId: roomIdRef.current, offer });
    });

    socket.on("offer", async ({ offer }) => {
      if (!pcRef.current) createPeerConnection();

      console.log("Received offer:", offer); // debug

      // Make sure the offer has type and sdp
      if (!offer.type || !offer.sdp) {
        console.error("Invalid offer received:", offer);
        return;
      }

      // Set remote description
      await pcRef.current!.setRemoteDescription(offer);

      // Create answer
      const answer = await pcRef.current!.createAnswer();
      await pcRef.current!.setLocalDescription(answer);

      // Emit the full localDescription, not just the answer object
      socket.emit("answer", {
        roomId: roomIdRef.current,
        answer: pcRef.current!.localDescription, // <- this is correct
      });

      // Add any pending ICE candidates
      pendingIceRef.current.forEach((c) => pcRef.current?.addIceCandidate(c));
      pendingIceRef.current = [];
    });

    socket.on("answer", async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(answer);

      pendingIceRef.current.forEach((c) => pcRef.current?.addIceCandidate(c));
      pendingIceRef.current = [];
    });

    socket.on("ice-candidates", ({ candidate }) => {
      if (pcRef.current?.remoteDescription) {
        pcRef.current.addIceCandidate(candidate);
      } else {
        pendingIceRef.current.push(candidate);
      }
    });

    socket.on("message", ({ message }) => {
      setMessages((prev) => [...prev, { from: "remote", message }]);
    });

    socket.on("user-count", (count: string) => {
      setUserCount(count);
    });
    socket.on("leaveRoom", cleanupRoom);

    return () => {
      socket.disconnect();
      cleanupRoom();
    };
  }, []);

  /* ================= CLEANUP ROOM ================= */
  const cleanupRoom = () => {
    setRoomId(null);
    roomIdRef.current = null;

    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (pcRef.current && pcRef.current.signalingState !== "closed") {
      pcRef.current.close();
    }
    pcRef.current = null;

    setMessages([]);
  };

  /* ================= CHAT ================= */

  const handleSkip = () => {
    socketRef.current?.emit("leaveRoom");
    cleanupRoom();
    // Rejoin to find a new user
    socketRef.current?.emit("join");
  };
  const handleSend = (e?: React.SyntheticEvent) => {
    e?.preventDefault(); // Prevent default form submission behavior
    e?.stopPropagation(); //
    if (!roomIdRef.current) return;
    socketRef.current?.emit("message", {
      roomId: roomIdRef.current,
      message: messageText,
    });
    setMessages((prev) => [{ from: "host", message: messageText }, ...prev]);
    setMessageText("");
  };

  const inputRef = useRef<HTMLInputElement | null>(null);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  /* ================= UI ================= */
  return (
    <>
      <div className="bg-zinc-900 min-h-screen flex flex-col ">
        <AppBar online={userCount} />

        <div className="flex-grow mt-2 mx-4 md:mx-20 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="col-span-1 md:col-span-5 flex flex-col gap-4">
            <div className="h-[100%] sm:h-[45%] bg-slate-700 rounded-3xl flex items-center justify-center overflow-hidden">
              <video
                id="remoteVideo"
                ref={remoteVideoRef}
                className="rounded-3xl w-full h-full object-cover"
                autoPlay
              />
            </div>
            <div className="h-[100%] sm:h-[45%] bg-slate-700 rounded-3xl flex items-center justify-center overflow-hidden">
              <video
                id="localVideo"
                ref={localVideoRef}
                className="rounded-3xl w-full h-full object-cover"
                autoPlay
                muted
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-7 flex flex-col max-h-[90vh]">
            <div className="bg-zinc-800 h-full w-full rounded-3xl p-5 flex flex-col">
              <div
                className="flex-grow hide-scrollbar"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex my-2 ${
                      msg.from === "host" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`chat-message p-3 rounded-3xl ${
                        msg.from === "host"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      <p className={`text-sm`}>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center mt-4">
                <div
                  className="bg-green-500 px-4 py-2 rounded-lg cursor-pointer text-white"
                  onClick={handleSkip}
                  onTouchEnd={handleSkip}
                >
                  {/* Use onTouchEnd instead of onTouchStart */}
                  <h1 className="sm:text-xl text-xs">SKIP</h1>
                </div>

                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-grow ml-4 py-2 px-4 text-sm sm:text-base bg-zinc-700 text-white rounded-lg focus:outline-none"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend(e);
                  }}
                  onTouchStart={focusInput}
                  ref={inputRef}
                />
                <button
                  className="ml-4 p-2 bg-blue-500 rounded-lg text-white flex items-center justify-center"
                  onClick={handleSend}
                  onTouchEnd={handleSend}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6"
                  >
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
