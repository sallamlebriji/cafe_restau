import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL
  || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "")
  || "http://localhost:5001";

export const socket = io(socketUrl, {
  autoConnect: false
});

export const connectEstablishmentSocket = (establishmentId) => {
  if (!socket.connected) socket.connect();
  if (establishmentId) socket.emit("join:establishment", establishmentId);
  return socket;
};
