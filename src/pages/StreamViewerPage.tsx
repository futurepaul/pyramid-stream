import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { RetroHeader } from "../components/RetroHeader";
import { NsecInput } from "../components/NsecInput";
import { RebroadcastButton } from "../components/RebroadcastButton";
import { PeerStreams } from "../components/PeerStreams";
import { DebugPanel } from "../components/DebugPanel";
import { useNostr } from "../hooks/useNostr";
import { useWebRTC } from "../hooks/useWebRTC";

interface PeerStream {
  peerId: string;
  stream: MediaStream;
}

export function StreamViewerPage() {
  const { nevent } = useParams<{ nevent: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [streamEvent, setStreamEvent] = useState<any>(null);
  const [streamHierarchy, setStreamHierarchy] = useState<any[]>([]);
  const [peerStreams, setPeerStreams] = useState<PeerStream[]>([]);
  const [rebroadcastEventId, setRebroadcastEventId] = useState<string>();

  const nostr = useNostr();
  const webrtc = useWebRTC();

  const handleNsecSubmit = async (nsec: string) => {
    setIsLoading(true);
    const client = await nostr.connectWithNsec(nsec);
    if (client && nevent) {
      await loadStreamAndConnect(nevent);
    }
    setIsLoading(false);
  };

  const loadStreamAndConnect = async (eventId: string) => {
    try {
      console.log('🔍 Loading stream event:', eventId);
      
      // Fetch the stream event
      const event = await nostr.fetchStreamEvent(eventId);
      if (!event) {
        throw new Error('Stream event not found');
      }
      
      setStreamEvent(event);
      
      // Build stream hierarchy
      const hierarchy = await nostr.getStreamHierarchy(eventId);
      setStreamHierarchy(hierarchy);
      
      // Use event ID as Trystero room name!
      console.log('🏠 Joining Trystero room with event ID:', eventId);
      webrtc.joinRoom(eventId);
      
    } catch (error) {
      console.error('❌ Failed to load stream:', error);
      alert(`Failed to load stream: ${error.message}`);
    }
  };

  // Auto-load stream when connected and nevent is available
  useEffect(() => {
    if (nostr.isConnected && nevent && !streamEvent) {
      loadStreamAndConnect(nevent);
    }
  }, [nostr.isConnected, nevent]);

  // Set up peer stream handling
  useEffect(() => {
    webrtc.onPeerStream((stream, peerId) => {
      console.log('🎥 StreamViewer received stream from peer:', peerId);
      setPeerStreams(prev => {
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

  const handleRebroadcast = async () => {
    if (!streamEvent || !nostr.isConnected) return;
    
    try {
      setIsLoading(true);
      
      // Generate new event ID for rebroadcast
      const rebroadcastRoomId = `restream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get stream depth from hierarchy
      const streamDepth = streamHierarchy.length;
      const originalEventId = streamHierarchy[0]?.id || streamEvent.id;
      
      // Publish rebroadcast event  
      const rebroadcastEvent = await nostr.publishRebroadcastEvent(
        rebroadcastRoomId,
        streamEvent.id, // parent
        originalEventId, // original
        streamDepth,
        `Rebroadcast: ${JSON.parse(streamEvent.content).title}`
      );
      
      setRebroadcastEventId(rebroadcastEvent.id);
      
      // Start rebroadcasting with event ID as room name
      const result = webrtc.startRebroadcast();
      if (result) {
        // Update the room name to use the event ID
        console.log('🔄 Rebroadcast event published:', rebroadcastEvent.id);
        console.log('🔗 New stream URL:', `${window.location.origin}/stream/${rebroadcastEvent.id}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to start rebroadcast:', error);
      alert(`Failed to start rebroadcast: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug data
  const debugData = {
    currentEvent: streamEvent,
    streamHierarchy: streamHierarchy,
    rebroadcastEvent: rebroadcastEventId,
    streamDepth: streamHierarchy.length,
    originalEvent: streamHierarchy[0]?.id,
    nostrState: nostr.getDebugInfo(),
    webrtcState: webrtc.getDebugInfo(),
    peerStreams: peerStreams.length,
    availableStreams: peerStreams.map(ps => ps.peerId)
  };

  // Show nsec input if not connected
  if (!nostr.isConnected) {
    return (
      <div className="container">
        <RetroHeader />
        <div style={{
          margin: '1rem 0',
          padding: '0.5rem',
          background: '#ffffcc',
          border: '2px inset #cccc66',
          fontFamily: 'Times New Roman, Times, serif'
        }}>
          Connect to Nostr to view stream: {nevent}
        </div>
        <NsecInput onNsecSubmit={handleNsecSubmit} isConnecting={isLoading} />
        <DebugPanel data={debugData} />
      </div>
    );
  }

  if (!streamEvent && !isLoading) {
    return (
      <div className="container">
        <RetroHeader />
        <div style={{
          margin: '1rem 0',
          padding: '0.5rem',
          background: '#ffcccc',
          border: '2px inset #cc6666',
          fontFamily: 'Times New Roman, Times, serif'
        }}>
          Stream not found: {nevent}
        </div>
        <DebugPanel data={debugData} />
      </div>
    );
  }

  const streamData = streamEvent ? JSON.parse(streamEvent.content) : null;

  return (
    <div className="container">
      <RetroHeader />
      
      {streamData && (
        <div style={{
          margin: '1rem 0',
          padding: '0.5rem',
          background: '#fff',
          border: '2px inset #c0c0c0',
          fontFamily: 'Times New Roman, Times, serif'
        }}>
          <strong>{streamData.title}</strong><br />
          <strong>Depth:</strong> Level {streamHierarchy.length} in pyramid<br />
          <strong>Status:</strong> {streamData.status}<br />
          <strong>Room:</strong> {streamData.trystero_room}
        </div>
      )}
      
      {streamHierarchy.length > 1 && (
        <div style={{
          margin: '1rem 0',
          padding: '0.5rem',
          background: '#e6f3ff',
          border: '2px inset #b3d9ff',
          fontFamily: 'Times New Roman, Times, serif'
        }}>
          <strong>Stream Chain:</strong><br />
          {streamHierarchy.map((event, index) => (
            <div key={event.id} style={{ marginLeft: `${index * 20}px` }}>
              {index === 0 ? '🎥' : '📡'} {JSON.parse(event.content).title}
              {index === streamHierarchy.length - 1 && ' ← YOU ARE HERE'}
            </div>
          ))}
        </div>
      )}
      
      <div style={{
        margin: '1rem 0',
        padding: '0.5rem',
        background: '#ccffcc',
        border: '2px inset #66cc66',
        fontFamily: 'Times New Roman, Times, serif'
      }}>
        Connected as: {nostr.npub.substring(0, 20)}...<br />
        Peers in room: {webrtc.peers.length}<br />
        Receiving streams: {peerStreams.length}
      </div>
      
      <PeerStreams peerStreams={peerStreams} />
      
      <RebroadcastButton
        onRebroadcast={handleRebroadcast}
        isRebroadcasting={webrtc.isRebroadcasting}
        hasIncomingStreams={peerStreams.length > 0}
        disabled={isLoading}
      />
      
      {rebroadcastEventId && (
        <div style={{
          margin: '1rem 0',
          padding: '0.5rem',
          background: '#fff',
          border: '2px inset #c0c0c0',
          fontFamily: 'Times New Roman, Times, serif'
        }}>
          <strong>Your Rebroadcast URL:</strong><br />
          <input 
            type="text" 
            value={`${window.location.origin}/stream/${rebroadcastEventId}`}
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
      
      <DebugPanel data={debugData} />
    </div>
  );
}