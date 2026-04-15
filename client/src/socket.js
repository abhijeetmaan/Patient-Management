import { io } from "socket.io-client";
import BASE_URL from "./config/api";

export const socket = io(BASE_URL, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});
