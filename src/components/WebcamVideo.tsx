import { useRef, useEffect } from "react";

interface WebcamVideoProps {
  stream: MediaStream | null;
}

export function WebcamVideo({ stream }: WebcamVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className="video-container">
        <div className="webcam-video" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '360px',
          color: '#808080'
        }}>
          No camera active
        </div>
      </div>
    );
  }

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="webcam-video"
        autoPlay
        muted
        playsInline
      />
    </div>
  );
}