import { useEffect, useRef } from 'react';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { landmarkToCanvas } from '../utils/landmarkHelpers';

export default function HandSkeletonOverlay({
  canvasRef,
  left,
  right,
  width,
  height,
  mirror,
  visible,
}) {
  const animRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const drawHand = (landmarks, color) => {
        if (!landmarks) return;
        const points = landmarks.map((lm) => {
          const p = landmarkToCanvas(lm, width, height, mirror);
          return { x: p.x, y: p.y, z: lm.z };
        });
        drawConnectors(ctx, points, HAND_CONNECTIONS, { color, lineWidth: 2 });
        drawLandmarks(ctx, points, { color: '#ffffff', lineWidth: 1, radius: 3 });
      };

      drawHand(left, '#00ff88');
      drawHand(right, '#ff6b6b');

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [canvasRef, left, right, width, height, mirror, visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full object-cover"
    />
  );
}
