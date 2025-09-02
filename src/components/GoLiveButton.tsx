interface GoLiveButtonProps {
  onClick: () => void;
  isLive: boolean;
  disabled?: boolean;
}

export function GoLiveButton({ onClick, isLive, disabled }: GoLiveButtonProps) {
  return (
    <button
      className="go-live-button"
      onClick={onClick}
      disabled={disabled}
    >
      {isLive ? "STOP STREAM" : "GO LIVE"}
    </button>
  );
}