interface RebroadcastButtonProps {
  onRebroadcast: () => void;
  isRebroadcasting: boolean;
  disabled?: boolean;
  hasIncomingStreams: boolean;
}

export function RebroadcastButton({ 
  onRebroadcast, 
  isRebroadcasting, 
  disabled, 
  hasIncomingStreams 
}: RebroadcastButtonProps) {
  if (!hasIncomingStreams && !isRebroadcasting) {
    return null; // Only show button when there are streams to rebroadcast
  }

  return (
    <button
      onClick={onRebroadcast}
      disabled={disabled}
      style={{
        fontFamily: 'Times New Roman, Times, serif',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        padding: '8px 16px',
        background: isRebroadcasting ? '#ff6b6b' : '#4CAF50',
        border: `2px ${isRebroadcasting ? 'inset' : 'outset'} ${isRebroadcasting ? '#ff6b6b' : '#4CAF50'}`,
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        margin: '1rem auto',
        display: 'block',
        minWidth: '200px'
      }}
    >
      {isRebroadcasting ? 'STOP REBROADCAST' : 'REBROADCAST STREAM'}
    </button>
  );
}