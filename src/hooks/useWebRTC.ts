import { useState, useEffect, useRef } from 'react';
import { joinRoom, Room, selfId, getRelaySockets } from 'trystero/nostr';

interface WebRTCState {
  room: Room | null;
  peers: string[];
  isConnected: boolean;
  error: string | null;
  rebroadcastRoom: Room | null;
  rebroadcastPeers: string[];
  isRebroadcasting: boolean;
}

export function useWebRTC(roomName?: string) {
  const [state, setState] = useState<WebRTCState>({
    room: null,
    peers: [],
    isConnected: false,
    error: null,
    rebroadcastRoom: null,
    rebroadcastPeers: [],
    isRebroadcasting: false
  });

  const roomRef = useRef<Room | null>(null);
  const rebroadcastRoomRef = useRef<Room | null>(null);
  const incomingStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const joinWebRTCRoom = (name: string) => {
    try {
      console.log('🔵 Attempting to join room:', name);
      console.log('🔍 Current browser info:', {
        userAgent: navigator.userAgent.substring(0, 50),
        webrtc: !!window.RTCPeerConnection,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia
      });
      
      // Leave existing room if any
      if (roomRef.current) {
        console.log('🔴 Leaving existing room');
        roomRef.current.leave();
      }

      // Join new room using correct Trystero API with local test relay
      console.log('🔵 Creating room with appId: pyramid_stream, using LOCAL test relay');
      const config = { 
        appId: 'pyramid_stream',
        relayUrls: ['ws://localhost:10547']
      };
      
      console.log('🔧 Config:', config);
      const room = joinRoom(config, name);
      roomRef.current = room;
      console.log('✅ Room created successfully');

      setState(prev => ({ ...prev, error: null }));

      // Handle peer connections
      room.onPeerJoin(peerId => {
        console.log('🟢 Peer joined:', peerId);
        console.log('📊 Total peers after join:', peerId);
        setState(prev => {
          const newPeers = [...prev.peers, peerId];
          console.log('📊 Updated peer list:', newPeers);
          return {
            ...prev,
            peers: newPeers,
            isConnected: true
          };
        });
      });

      // Add more detailed connection debugging
      room.onPeerConnect?.(peerId => {
        console.log('🔗 Peer connected:', peerId);
      });

      room.onPeerDisconnect?.(peerId => {
        console.log('💔 Peer disconnected:', peerId);
      });

      room.onPeerLeave(peerId => {
        console.log('🔴 Peer left:', peerId);
        setState(prev => {
          const newPeers = prev.peers.filter(id => id !== peerId);
          console.log('📊 Updated peer list after leave:', newPeers);
          return {
            ...prev,
            peers: newPeers
          };
        });
      });

      setState(prev => ({
        ...prev,
        room,
        isConnected: true
      }));

      console.log('✅ Room setup complete for:', name);
      
      // Add timeouts to check if peers connect
      setTimeout(() => {
        console.log('⏰ 10s timeout check - Current peers:', roomRef.current ? state.peers.length : 'no room');
      }, 10000);
      setTimeout(() => {
        console.log('⏰ 30s timeout check - Current peers:', roomRef.current ? state.peers.length : 'no room');
      }, 30000);
      
      return room;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
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
    
    // Also stop any rebroadcast
    stopRebroadcast();
    
    // Clear incoming streams
    incomingStreamsRef.current.clear();
    
    setState({
      room: null,
      peers: [],
      isConnected: false,
      error: null,
      rebroadcastRoom: null,
      rebroadcastPeers: [],
      isRebroadcasting: false
    });
  };

  const shareStream = (stream: MediaStream) => {
    if (roomRef.current) {
      console.log('📺 Sharing stream with', state.peers.length, 'peers');
      console.log('📺 Stream tracks:', stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
      // Share stream with all peers in the room
      roomRef.current.addStream(stream);
      console.log('✅ Stream shared successfully');
    } else {
      console.log('⚠️ No room available to share stream');
    }
  };

  const onPeerStream = (callback: (stream: MediaStream, peerId: string) => void) => {
    if (roomRef.current) {
      console.log('📺 Setting up peer stream listener');
      roomRef.current.onPeerStream((stream, peerId) => {
        console.log('🎥 Received stream from peer:', peerId);
        console.log('🎥 Stream tracks:', stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
        
        // Store incoming stream for potential rebroadcast
        incomingStreamsRef.current.set(peerId, stream);
        
        callback(stream, peerId);
      });
    }
  };

  const startRebroadcast = () => {
    try {
      if (incomingStreamsRef.current.size === 0) {
        console.log('⚠️ No incoming streams to rebroadcast');
        return null;
      }

      // Create a new room for rebroadcasting with a unique name
      const rebroadcastRoomName = `restream-${Date.now()}`;
      console.log('📡 Starting rebroadcast in room:', rebroadcastRoomName);

      const config = { 
        appId: 'pyramid_stream',
        relayUrls: ['ws://localhost:10547']
      };

      const rebroadcastRoom = joinRoom(config, rebroadcastRoomName);
      rebroadcastRoomRef.current = rebroadcastRoom;

      // Handle rebroadcast peers
      rebroadcastRoom.onPeerJoin(peerId => {
        console.log('🔄 Rebroadcast peer joined:', peerId);
        setState(prev => ({
          ...prev,
          rebroadcastPeers: [...prev.rebroadcastPeers, peerId]
        }));

        // Share all incoming streams with new rebroadcast peer
        incomingStreamsRef.current.forEach((stream, originalPeerId) => {
          console.log(`📡 Forwarding stream from ${originalPeerId} to rebroadcast peer ${peerId}`);
          rebroadcastRoom.addStream(stream, peerId);
        });
      });

      rebroadcastRoom.onPeerLeave(peerId => {
        console.log('🔄 Rebroadcast peer left:', peerId);
        setState(prev => ({
          ...prev,
          rebroadcastPeers: prev.rebroadcastPeers.filter(id => id !== peerId)
        }));
      });

      setState(prev => ({
        ...prev,
        rebroadcastRoom,
        isRebroadcasting: true
      }));

      return { roomName: rebroadcastRoomName, room: rebroadcastRoom };
    } catch (error) {
      console.error('❌ Failed to start rebroadcast:', error);
      return null;
    }
  };

  const stopRebroadcast = () => {
    if (rebroadcastRoomRef.current) {
      console.log('🛑 Stopping rebroadcast');
      rebroadcastRoomRef.current.leave();
      rebroadcastRoomRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      rebroadcastRoom: null,
      rebroadcastPeers: [],
      isRebroadcasting: false
    }));
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

  const getDebugInfo = () => {
    const room = roomRef.current;
    const relaySockets = getRelaySockets();
    
    return {
      selfId: selfId,
      roomExists: !!room,
      actualPeers: state.peers,
      isConnected: state.isConnected,
      error: state.error,
      // Real relay socket connections from Trystero
      relaySocketStatus: relaySockets,
      relayKeys: Object.keys(relaySockets),
      connectedRelays: Object.keys(relaySockets).filter(url => {
        const socket = relaySockets[url];
        return socket && socket.readyState === WebSocket.OPEN;
      }),
      // Room internal state
      roomInternal: room ? {
        keys: Object.keys(room),
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(room))
      } : null
    };
  };

  return {
    ...state,
    joinRoom: joinWebRTCRoom,
    leaveRoom,
    shareStream,
    onPeerStream,
    startRebroadcast,
    stopRebroadcast,
    getDebugInfo
  };
}