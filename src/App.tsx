import { useState } from "react";
import { RetroHeader } from "./components/RetroHeader";
import { GoLiveButton } from "./components/GoLiveButton";
import { RoomStatus } from "./components/RoomStatus";
import { WebcamVideo } from "./components/WebcamVideo";
import { DebugPanel } from "./components/DebugPanel";
import "./index.css";

export function App() {
  const [isLive, setIsLive] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoLive = async () => {
    if (isLive) {
      // Stop streaming
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
      }
      setIsLive(false);
      setRoomId(undefined);
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
        // Generate a simple room ID for now
        setRoomId(`room-${Date.now()}`);
      } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Could not access webcam. Please check permissions.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Debug data for development
  const debugData = {
    availableRooms: roomId ? [roomId] : [],
    originalEventId: isLive ? `event-${Date.now()}` : undefined,
    availableRestreams: [],
    webrtcState: {
      connected: false,
      peers: 0
    },
    nostrRelayStatus: {
      connected: false,
      relays: []
    },
    peerConnections: []
  };

  return (
    <div className="container">
      <RetroHeader />
      
      <RoomStatus roomId={roomId} status={isLive ? "LIVE" : "OFFLINE"} />
      
      <GoLiveButton 
        onClick={handleGoLive} 
        isLive={isLive}
        disabled={isLoading}
      />
      
      <WebcamVideo stream={webcamStream} />
      
      <DebugPanel data={debugData} />
    </div>
  );
}

export default App;