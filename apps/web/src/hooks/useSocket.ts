import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(namespace: string = '/queue') {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}${namespace}`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [namespace]);

  return socketRef;
}
