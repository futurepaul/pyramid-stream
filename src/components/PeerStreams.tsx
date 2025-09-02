import { useRef, useEffect } from "react";

interface PeerStream {
  peerId: string;
  stream: MediaStream;
}

interface PeerStreamsProps {
  peerStreams: PeerStream[];
}

export function PeerStreams({ peerStreams }: PeerStreamsProps) {
  if (peerStreams.length === 0) {
    return (
      <div style={{
        margin: '2rem 0',
        padding: '1rem',
        background: '#fff',
        border: '2px inset #c0c0c0',
        fontFamily: 'Times New Roman, Times, serif',
        textAlign: 'center'
      }}>
        No peer streams available. Share this room name with others to start streaming!
      </div>
    );
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      <h3 style={{
        fontFamily: 'Times New Roman, Times, serif',
        textAlign: 'center',
        margin: '1rem 0'
      }}>
        Peer Streams ({peerStreams.length})
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1rem'
      }}>
        {peerStreams.map(({ peerId, stream }) => (
          <PeerVideoPlayer key={peerId} peerId={peerId} stream={stream} />
        ))}
      </div>
    </div>
  );
}

function PeerVideoPlayer({ peerId, stream }: { peerId: string; stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      border: '2px inset #c0c0c0',
      background: '#000'
    }}>
      <div style={{
        background: '#c0c0c0',
        padding: '0.25rem 0.5rem',
        fontFamily: 'Times New Roman, Times, serif',
        fontSize: '0.9rem',
        borderBottom: '1px solid #808080'
      }}>
        Peer: {peerId.substring(0, 8)}...
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: 'auto',
          display: 'block'
        }}
      />
    </div>
  );
}