import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Creates and manages a Socket.IO connection.
 * @param namespace - Socket namespace to connect to (default: '/queue')
 * @param enabled   - Set to false to skip connecting (e.g. when API is known to be offline)
 */
export function useSocket(namespace: string = '/queue', enabled: boolean = true) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect when explicitly enabled — prevents connection storm when API is down
    if (!enabled) return;

    socketRef.current = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}${namespace}`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null; // Clear ref so stale socket isn't accidentally reused
    };
  }, [namespace, enabled]);

  return socketRef;
}
