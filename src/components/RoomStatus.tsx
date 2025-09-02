interface RoomStatusProps {
  roomId?: string;
  status?: string;
}

export function RoomStatus({ roomId, status }: RoomStatusProps) {
  if (!roomId) return null;
  
  return (
    <div className="room-status">
      <strong>Current Room:</strong> {roomId}<br />
      {status && <><strong>Status:</strong> {status}</>}
    </div>
  );
}