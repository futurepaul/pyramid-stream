import { useState, useEffect } from 'react';

interface NsecInputProps {
  onNsecSubmit: (nsec: string) => void;
  isConnecting?: boolean;
}

export function NsecInput({ onNsecSubmit, isConnecting }: NsecInputProps) {
  const [nsec, setNsec] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pyramid-stream-nsec');
    if (saved) {
      setNsec(saved);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nsec.trim().startsWith('nsec') && nsec.length > 10) {
      localStorage.setItem('pyramid-stream-nsec', nsec.trim());
      onNsecSubmit(nsec.trim());
    } else {
      alert('Please enter a valid nsec key (starts with "nsec")');
    }
  };

  return (
    <div style={{
      margin: '2rem 0',
      padding: '1rem',
      background: '#fff',
      border: '2px inset #c0c0c0'
    }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        alignItems: 'center'
      }}>
        <label style={{
          fontFamily: 'Times New Roman, Times, serif',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>
          Enter Your Nostr Private Key (nsec):
        </label>
        
        <input
          type="password"
          value={nsec}
          onChange={(e) => setNsec(e.target.value)}
          placeholder="nsec1..."
          disabled={isConnecting}
          style={{
            fontFamily: 'Times New Roman, Times, serif',
            padding: '8px 12px',
            border: '2px inset #c0c0c0',
            background: '#fff',
            fontSize: '1rem',
            width: '400px',
            maxWidth: '100%'
          }}
        />
        
        <button
          type="submit"
          disabled={isConnecting || !nsec.trim()}
          style={{
            fontFamily: 'Times New Roman, Times, serif',
            fontSize: '1rem',
            fontWeight: 'bold',
            padding: '8px 16px',
            background: isConnecting ? '#a0a0a0' : '#c0c0c0',
            border: '2px outset #c0c0c0',
            cursor: isConnecting ? 'wait' : 'pointer',
            color: isConnecting ? '#808080' : '#000'
          }}
        >
          {isConnecting ? 'CONNECTING...' : 'CONNECT TO NOSTR'}
        </button>
        
        <small style={{
          fontFamily: 'Times New Roman, Times, serif',
          color: '#666',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          Your nsec is stored locally and used to publish stream events to the Nostr network.
        </small>
      </form>
    </div>
  );
}