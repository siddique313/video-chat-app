"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export function useUserCount(socket: Socket | null) {
  const [userCount, setUserCount] = useState<string>("🔃");

  useEffect(() => {
    if (!socket) return;

    const handler = (count: number) => setUserCount(String(count));
    socket.on("user-count", handler);

    return () => {
      socket.off("user-count", handler);
    };
  }, [socket]);

  return userCount;
}
