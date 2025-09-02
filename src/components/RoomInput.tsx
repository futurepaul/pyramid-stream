interface RoomInputProps {
  roomName: string;
  onRoomNameChange: (name: string) => void;
  onJoinRoom: () => void;
  disabled?: boolean;
}

export function RoomInput({ roomName, onRoomNameChange, onJoinRoom, disabled }: RoomInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      onJoinRoom();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      margin: '1rem 0',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <label style={{ 
        fontFamily: 'Times New Roman, Times, serif',
        fontWeight: 'bold'
      }}>
        Room Name:
      </label>
      <input
        type="text"
        value={roomName}
        onChange={(e) => onRoomNameChange(e.target.value)}
        placeholder="Enter room name"
        disabled={disabled}
        style={{
          fontFamily: 'Times New Roman, Times, serif',
          padding: '4px 8px',
          border: '2px inset #c0c0c0',
          background: '#fff',
          fontSize: '1rem'
        }}
      />
      <button
        type="submit"
        disabled={disabled || !roomName.trim()}
        style={{
          fontFamily: 'Times New Roman, Times, serif',
          padding: '4px 12px',
          background: '#c0c0c0',
          border: '2px outset #c0c0c0',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '1rem'
        }}
      >
        JOIN
      </button>
    </form>
  );
}