import { useState, useEffect } from "react";
import { RetroHeader } from "./components/RetroHeader";
import { GoLiveButton } from "./components/GoLiveButton";
import { RoomStatus } from "./components/RoomStatus";
import { WebcamVideo } from "./components/WebcamVideo";
import { RoomInput } from "./components/RoomInput";
import { PeerStreams } from "./components/PeerStreams";
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
          webrtc.shareStream(stream);
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
      const room = webrtc.joinRoom(roomName.trim());
      if (room) {
        setCurrentRoom(roomName.trim());
        
        // Share stream if we're already live
        if (webcamStream) {
          webrtc.shareStream(webcamStream);
        }
      }
    }
  };

  // Set up peer stream handling
  useEffect(() => {
    webrtc.onPeerStream((stream, peerId) => {
      console.log('Received stream from peer:', peerId);
      setPeerStreams(prev => {
        // Remove existing stream from this peer if any
        const filtered = prev.filter(ps => ps.peerId !== peerId);
        return [...filtered, { peerId, stream }];
      });
    });
  }, [webrtc.room]);

  // Clean up peer streams when peers leave
  useEffect(() => {
    setPeerStreams(prev => 
      prev.filter(ps => webrtc.peers.includes(ps.peerId))
    );
  }, [webrtc.peers]);

  // Debug data for development
  const debugData = {
    availableRooms: currentRoom ? [currentRoom] : [],
    originalEventId: isLive ? `event-${Date.now()}` : undefined,
    availableRestreams: [],
    webrtcState: {
      connected: webrtc.isConnected,
      peers: webrtc.peers.length,
      currentRoom,
      error: webrtc.error
    },
    nostrRelayStatus: {
      connected: false,
      relays: []
    },
    peerConnections: webrtc.peers.map(peerId => ({ peerId, status: 'connected' }))
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
      
      <DebugPanel data={debugData} />
    </div>
  );
}

export default App;