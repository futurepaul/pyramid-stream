import { useState, useEffect, useRef } from 'react';
import { joinRoom, Room } from 'trystero';

interface WebRTCState {
  room: Room | null;
  peers: string[];
  isConnected: boolean;
  error: string | null;
}

export function useWebRTC(roomName?: string) {
  const [state, setState] = useState<WebRTCState>({
    room: null,
    peers: [],
    isConnected: false,
    error: null
  });

  const roomRef = useRef<Room | null>(null);

  const joinWebRTCRoom = (name: string) => {
    try {
      // Leave existing room if any
      if (roomRef.current) {
        roomRef.current.leave();
      }

      // Join new room using BitTorrent strategy (no relay servers needed)
      const room = joinRoom({ appId: 'pyramid-stream' }, name);
      roomRef.current = room;

      setState(prev => ({ ...prev, error: null }));

      // Handle peer connections
      room.onPeerJoin(peerId => {
        console.log('Peer joined:', peerId);
        setState(prev => ({
          ...prev,
          peers: [...prev.peers, peerId],
          isConnected: true
        }));
      });

      room.onPeerLeave(peerId => {
        console.log('Peer left:', peerId);
        setState(prev => ({
          ...prev,
          peers: prev.peers.filter(id => id !== peerId)
        }));
      });

      setState(prev => ({
        ...prev,
        room,
        isConnected: true
      }));

      return room;
    } catch (error) {
      console.error('Failed to join room:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join room'
      }));
      return null;
    }
  };

  const leaveRoom = () => {
    if (roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
    }
    setState({
      room: null,
      peers: [],
      isConnected: false,
      error: null
    });
  };

  const shareStream = (stream: MediaStream) => {
    if (roomRef.current) {
      // Share stream with all peers in the room
      roomRef.current.addStream(stream);
    }
  };

  const onPeerStream = (callback: (stream: MediaStream, peerId: string) => void) => {
    if (roomRef.current) {
      roomRef.current.onPeerStream(callback);
    }
  };

  // Auto-join room if roomName is provided
  useEffect(() => {
    if (roomName && !roomRef.current) {
      joinWebRTCRoom(roomName);
    }
  }, [roomName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.leave();
      }
    };
  }, []);

  return {
    ...state,
    joinRoom: joinWebRTCRoom,
    leaveRoom,
    shareStream,
    onPeerStream
  };
}