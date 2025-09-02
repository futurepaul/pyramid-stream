interface DebugData {
  availableRooms?: string[];
  originalEventId?: string;
  availableRestreams?: any[];
  webrtcState?: any;
  nostrRelayStatus?: any;
  peerConnections?: any[];
}

interface DebugPanelProps {
  data: DebugData;
}

export function DebugPanel({ data }: DebugPanelProps) {
  return (
    <div className="debug-section">
      <details className="debug-details">
        <summary>Available Rooms</summary>
        <pre>{JSON.stringify(data.availableRooms || [], null, 2)}</pre>
      </details>

      {data.originalEventId && (
        <details className="debug-details">
          <summary>Original Event ID</summary>
          <pre>{data.originalEventId}</pre>
        </details>
      )}

      <details className="debug-details">
        <summary>Available Restreams</summary>
        <pre>{JSON.stringify(data.availableRestreams || [], null, 2)}</pre>
      </details>

      <details className="debug-details">
        <summary>WebRTC State</summary>
        <pre>{JSON.stringify(data.webrtcState || {}, null, 2)}</pre>
      </details>

      <details className="debug-details">
        <summary>Nostr Relay Status</summary>
        <pre>{JSON.stringify(data.nostrRelayStatus || {}, null, 2)}</pre>
      </details>

      <details className="debug-details">
        <summary>Peer Connections</summary>
        <pre>{JSON.stringify(data.peerConnections || [], null, 2)}</pre>
      </details>
    </div>
  );
}