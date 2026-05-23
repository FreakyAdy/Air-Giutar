import { useEffect, useRef } from 'react';
import { GuitarRenderer } from '../utils/guitarRenderer';

export default function GuitarOverlay({
  landmarks,
  activeStrings,
  poseActive,
  videoRef,
  mirror = true,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    rendererRef.current = new GuitarRenderer(canvas);

    const resize = () => {
      const w = videoRef.current?.videoWidth || window.innerWidth;
      const h = videoRef.current?.videoHeight || window.innerHeight;
      rendererRef.current?.resize(w, h);
    };

    resize();
    window.addEventListener('resize', resize);
    const video = videoRef.current;
    video?.addEventListener('loadedmetadata', resize);

    return () => {
      window.removeEventListener('resize', resize);
      video?.removeEventListener('loadedmetadata', resize);
    };
  }, [videoRef]);

  useEffect(() => {
    const draw = () => {
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.clear();
        if (poseActive && landmarks) {
          renderer.render(landmarks, activeStrings);
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [landmarks, activeStrings, poseActive, mirror]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-10 h-full w-full object-cover ${mirror ? '-scale-x-100' : ''}`}
      aria-hidden
    />
  );
}
