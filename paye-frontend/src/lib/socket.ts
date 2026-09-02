import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export function createSocket(token: string): Socket {
  return io(SOCKET_URL, {
    transports: ["websocket"],
    auth: { token },
  });
}
