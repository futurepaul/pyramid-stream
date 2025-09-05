import { useState, useEffect } from "react";
import { RetroHeader } from "./components/RetroHeader";
import { GoLiveButton } from "./components/GoLiveButton";
import { RoomStatus } from "./components/RoomStatus";
import { WebcamVideo } from "./components/WebcamVideo";
import { RoomInput } from "./components/RoomInput";
import { PeerStreams } from "./components/PeerStreams";
import { RebroadcastButton } from "./components/RebroadcastButton";
import { DebugPanel } from "./components/DebugPanel";
import { useWebRTC } from "./hooks/useWebRTC";
import "./index.css";

interface PeerStream {
  peerId: string;
  stream: MediaStream;
}

export function App() {
  const [isLive, setIsLive] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [currentRoom, setCurrentRoom] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [peerStreams, setPeerStreams] = useState<PeerStream[]>([]);
  const [rebroadcastRoomName, setRebroadcastRoomName] = useState<string>();

  const webrtc = useWebRTC();

  const handleGoLive = async () => {
    if (isLive) {
      // Stop streaming
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
      }
      webrtc.leaveRoom();
      setIsLive(false);
      setCurrentRoom(undefined);
      setPeerStreams([]);
    } else {
      // Start streaming
      setIsLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setWebcamStream(stream);
        setIsLive(true);
        
        // If we're in a room, share the stream
        if (currentRoom && webrtc.room) {
          console.log('📺 Going live in room:', currentRoom);
          webrtc.shareStream(stream);
        } else {
          console.log('📺 Going live but not in a room yet');
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Could not access webcam. Please check permissions.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleJoinRoom = () => {
    if (roomName.trim()) {
      console.log('🏠 Joining room:', roomName.trim());
      const room = webrtc.joinRoom(roomName.trim());
      if (room) {
        setCurrentRoom(roomName.trim());
        console.log('🏠 Room joined successfully:', roomName.trim());
        
        // Share stream if we're already live
        if (webcamStream) {
          console.log('📺 Already live, sharing existing stream');
          webrtc.shareStream(webcamStream);
        } else {
          console.log('📺 Not live yet, stream will be shared when going live');
        }
      }
    }
  };

  // Set up peer stream handling
  useEffect(() => {
    console.log('🔧 Setting up peer stream handling, room:', !!webrtc.room);
    webrtc.onPeerStream((stream, peerId) => {
      console.log('🎥 App received stream from peer:', peerId);
      setPeerStreams(prev => {
        console.log('📊 Current peer streams:', prev.length);
        // Remove existing stream from this peer if any
        const filtered = prev.filter(ps => ps.peerId !== peerId);
        const newStreams = [...filtered, { peerId, stream }];
        console.log('📊 Updated peer streams:', newStreams.length);
        return newStreams;
      });
    });
  }, [webrtc.room]);

  // Clean up peer streams when peers leave
  useEffect(() => {
    setPeerStreams(prev => 
      prev.filter(ps => webrtc.peers.includes(ps.peerId))
    );
  }, [webrtc.peers]);

  const handleRebroadcast = () => {
    if (webrtc.isRebroadcasting) {
      // Stop rebroadcasting
      webrtc.stopRebroadcast();
      setRebroadcastRoomName(undefined);
    } else {
      // Start rebroadcasting
      const result = webrtc.startRebroadcast();
      if (result) {
        setRebroadcastRoomName(result.roomName);
        console.log('🎉 Started rebroadcast in room:', result.roomName);
      }
    }
  };

  // Debug data from real Trystero state
  const debugData = {
    availableRooms: currentRoom ? [currentRoom] : [],
    rebroadcastHierarchy: {
      originalRoom: currentRoom,
      rebroadcastRoom: rebroadcastRoomName,
      isRebroadcasting: webrtc.isRebroadcasting,
      rebroadcastPeers: webrtc.rebroadcastPeers.length,
      incomingStreams: peerStreams.length
    },
    originalEventId: isLive ? `event-${Date.now()}` : undefined,
    availableRestreams: webrtc.isRebroadcasting ? [rebroadcastRoomName] : [],
    webrtcState: webrtc.getDebugInfo(),
    nostrRelayStatus: {
      connected: webrtc.isConnected,
      relays: webrtc.room ? ['ws://localhost:10547'] : [],
      roomExists: !!webrtc.room,
      roomError: webrtc.error
    },
    peerConnections: [
      ...webrtc.peers.map(peerId => ({ peerId, status: 'viewer', fullId: peerId })),
      ...webrtc.rebroadcastPeers.map(peerId => ({ peerId, status: 'rebroadcast-viewer', fullId: peerId }))
    ]
  };

  return (
    <div className="container">
      <RetroHeader />
      
      <RoomInput 
        roomName={roomName}
        onRoomNameChange={setRoomName}
        onJoinRoom={handleJoinRoom}
        disabled={isLoading}
      />
      
      <RoomStatus 
        roomId={currentRoom} 
        status={`${isLive ? "LIVE" : "OFFLINE"} ${webrtc.peers.length > 0 ? `(${webrtc.peers.length} peers)` : ""}`} 
      />
      
      <GoLiveButton 
        onClick={handleGoLive} 
        isLive={isLive}
        disabled={isLoading}
      />
      
      <WebcamVideo stream={webcamStream} />
      
      <PeerStreams peerStreams={peerStreams} />
      
      <RebroadcastButton
        onRebroadcast={handleRebroadcast}
        isRebroadcasting={webrtc.isRebroadcasting}
        hasIncomingStreams={peerStreams.length > 0}
        disabled={isLoading}
      />
      
      {rebroadcastRoomName && (
        <div style={{
          margin: '1rem 0',
          padding: '0.5rem',
          background: '#fff',
          border: '2px inset #c0c0c0',
          fontFamily: 'Times New Roman, Times, serif'
        }}>
          <strong>Rebroadcast Room:</strong> {rebroadcastRoomName}<br />
          <strong>Rebroadcast Viewers:</strong> {webrtc.rebroadcastPeers.length}
        </div>
      )}
      
      <DebugPanel data={debugData} />
    </div>
  );
}

export default App;