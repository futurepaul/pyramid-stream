import { useState } from "react";
import { RetroHeader } from "../components/RetroHeader";
import { NsecInput } from "../components/NsecInput";
import { GoLiveButton } from "../components/GoLiveButton";
import { RoomStatus } from "../components/RoomStatus";
import { WebcamVideo } from "../components/WebcamVideo";
import { DebugPanel } from "../components/DebugPanel";
import { useNostr } from "../hooks/useNostr";
import { useWebRTC } from "../hooks/useWebRTC";

export function GoLivePage() {
  const [isLive, setIsLive] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamEventId, setStreamEventId] = useState<string>();
  const [streamUrl, setStreamUrl] = useState<string>();
  const [actualRoomName, setActualRoomName] = useState<string>();

  const nostr = useNostr();
  const webrtc = useWebRTC();

  const handleNsecSubmit = async (nsec: string) => {
    setIsLoading(true);
    const client = await nostr.connectWithNsec(nsec);
    setIsLoading(false);
  };


  const handleGoLive = async () => {
    if (isLive) {
      // Stop streaming
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
      }
      webrtc.leaveRoom();
      setIsLive(false);
      setStreamEventId(undefined);
      setStreamUrl(undefined);
    } else {
      // Start streaming
      setIsLoading(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setWebcamStream(stream);
        
        // FIRST: Publish stream event to Nostr (REQUIRED) 
        console.log('📡 Publishing stream event to Nostr...');
        const streamEvent = await nostr.publishStreamEvent('Live Stream');
        if (!streamEvent?.id) {
          throw new Error('Failed to publish stream event - no event ID returned');
        }
        console.log('✅ Stream event published with real ID:', streamEvent.id);
        
        // Use the REAL event ID as the Trystero room name
        const eventId = streamEvent.id;
        console.log('🏠 Using real event ID as room name:', eventId);
        
        // Join WebRTC room with the event ID
        const room = webrtc.joinRoom(eventId);
        if (room) {
          webrtc.shareStream(stream);
          console.log('✅ WebRTC room joined with event ID and stream shared');
        }
        
        setStreamEventId(eventId);
        setActualRoomName(eventId); // Track the ACTUAL room name used
        
        // Generate shareable URL with the real event ID
        const url = `${window.location.origin}/stream/${eventId}`;
        setStreamUrl(url);
        
        setIsLive(true);
        console.log('🎉 Stream published with event ID:', eventId);
        console.log('🔗 Shareable URL:', url);
        
      } catch (error) {
        console.error('Error going live:', error);
        alert('Could not start stream. Check webcam permissions and Nostr connection.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Debug data (match working version structure) - use ACTUAL room name
  const debugData = {
    availableRooms: actualRoomName ? [actualRoomName] : [], // Use actual Trystero room name
    originalEventId: streamEventId,
    availableRestreams: [],
    webrtcState: webrtc.getDebugInfo(),
    nostrRelayStatus: {
      connected: webrtc.isConnected,
      relays: webrtc.room ? ['ws://localhost:10547'] : [],
      roomExists: !!webrtc.room,
      roomError: webrtc.error
    },
    peerConnections: webrtc.peers.map(peerId => ({ peerId, status: 'streamer', fullId: peerId })),
    // Additional go live data
    streamEvent: streamEventId ? {
      eventId: streamEventId,
      shareableUrl: streamUrl,
      trysteroRoom: streamEventId
    } : null,
    nostrState: nostr.getDebugInfo()
  };

  // Show nsec input if not connected
  if (!nostr.isConnected) {
    return (
      <div className="container">
        <RetroHeader />
        <NsecInput onNsecSubmit={handleNsecSubmit} isConnecting={isLoading} />
        
        {nostr.error && (
          <div style={{
            margin: '1rem 0',
            padding: '0.5rem',
            background: '#ffcccc',
            border: '2px inset #ff6666',
            fontFamily: 'Times New Roman, Times, serif',
            color: '#cc0000'
          }}>
            Error: {nostr.error}
          </div>
        )}
        
        <DebugPanel data={debugData} />
      </div>
    );
  }

  return (
    <div className="container">
      <RetroHeader />
      
      <div style={{
        margin: '1rem 0',
        padding: '0.5rem',
        background: '#ccffcc',
        border: '2px inset #66cc66',
        fontFamily: 'Times New Roman, Times, serif'
      }}>
        ✅ Connected to Nostr as: {nostr.npub.substring(0, 20)}...
      </div>
      
      <RoomStatus 
        roomId={streamEventId} 
        status={`${isLive ? "LIVE" : "OFFLINE"} ${webrtc.peers.length > 0 ? `(${webrtc.peers.length} viewers)` : ""}`} 
      />
      
      {streamUrl && (
        <div style={{
          margin: '1rem 0',
          padding: '0.5rem',
          background: '#fff',
          border: '2px inset #c0c0c0',
          fontFamily: 'Times New Roman, Times, serif'
        }}>
          <strong>Share URL:</strong><br />
          <input 
            type="text" 
            value={streamUrl} 
            readOnly 
            onClick={(e) => e.currentTarget.select()}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              padding: '4px',
              border: '1px solid #ccc'
            }}
          />
        </div>
      )}
      
      
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