import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export function createSocket(token) {
  return io(BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}
