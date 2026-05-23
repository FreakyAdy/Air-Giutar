import { forwardRef } from 'react';

const CameraFeed = forwardRef(function CameraFeed(
  { mirror = true, onStreamReady, onError, className = '' },
  ref
) {
  return (
    <video
      ref={ref}
      className={`absolute inset-0 h-full w-full object-cover ${mirror ? '-scale-x-100' : ''} ${className}`}
      playsInline
      muted
      autoPlay
    />
  );
});

export default CameraFeed;
