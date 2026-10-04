"use client";

import MonitorBox from "@/components/chat/MonitorBox";
import { useSocket } from "@/constants/SocketContext";

export default function ChatMonitorPage() {
  const { socket, connected } = useSocket();

  return <MonitorBox socket={socket} connected={connected} />;
}
