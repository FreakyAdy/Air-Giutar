import { useEffect, useRef, useCallback, useState } from 'react';
import { Hands } from '@mediapipe/hands';

const MEDIAPIPE_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240';

export function useHandTracking(videoRef, { mirror = true, enabled = true } = {}) {
  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const [tracking, setTracking] = useState({
    left: null,
    right: null,
    isTracking: false,
  });
  const onResultsRef = useRef(null);
  const frameCountRef = useRef(0);

  const setOnResults = useCallback((cb) => {
    onResultsRef.current = cb;
  }, []);

  useEffect(() => {
    if (!enabled || !videoRef?.current) return;

    const video = videoRef.current;
    let cancelled = false;

    const hands = new Hands({
      locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.6,
    });

    hands.onResults((results) => {
      if (cancelled) return;

      let left = null;
      let right = null;

      if (results.multiHandLandmarks?.length) {
        results.multiHandedness?.forEach((handedness, i) => {
          const landmarks = results.multiHandLandmarks[i];
          const label = handedness.label; // "Left" or "Right" in camera view
          // Camera mirrors: user's left hand often labeled "Right" in MediaPipe
          const isUserLeft = mirror
            ? label === 'Right'
            : label === 'Left';

          if (isUserLeft) left = landmarks;
          else right = landmarks;
        });

        // Fallback if only one hand
        if (!left && !right && results.multiHandLandmarks[0]) {
          right = results.multiHandLandmarks[0];
        }
      }

      const isTracking = !!(left || right);
      setTracking({ left, right, isTracking });

      frameCountRef.current += 1;
      onResultsRef.current?.({
        left,
        right,
        isTracking,
        frameCount: frameCountRef.current,
      });
    });

    handsRef.current = hands;

    const processFrame = async () => {
      if (!cancelled && video.readyState >= 2) {
        await hands.send({ image: video });
      }
      if (!cancelled) {
        rafRef.current = requestAnimationFrame(processFrame);
      }
    };
    rafRef.current = requestAnimationFrame(processFrame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      hands.close?.();
    };
  }, [videoRef, mirror, enabled]);

  return { tracking, setOnResults, handsRef };
}
