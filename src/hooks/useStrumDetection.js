import { useRef, useCallback } from 'react';
import { FINGERS } from '../utils/landmarkHelpers';

const STRUM_THRESHOLD = 0.04;
const COOLDOWN_MS = 180;

export function useStrumDetection() {
  const prevYRef = useRef(null);
  const lastStrumRef = useRef(0);
  const onStrumRef = useRef(null);

  const setOnStrum = useCallback((cb) => {
    onStrumRef.current = cb;
  }, []);

  const processRightHand = useCallback((rightLandmarks, now = Date.now()) => {
    if (!rightLandmarks) {
      prevYRef.current = null;
      return null;
    }

    const tipY = rightLandmarks[FINGERS.index.tip].y;
    const midY = rightLandmarks[FINGERS.middle.tip].y;
    const avgY = (tipY + midY) / 2;

    if (prevYRef.current === null) {
      prevYRef.current = avgY;
      return null;
    }

    const deltaY = avgY - prevYRef.current;
    prevYRef.current = avgY;

    if (now - lastStrumRef.current < COOLDOWN_MS) return null;

    let direction = null;
    if (deltaY > STRUM_THRESHOLD) {
      direction = 'down';
    } else if (deltaY < -STRUM_THRESHOLD) {
      direction = 'up';
    }

    if (direction) {
      lastStrumRef.current = now;
      const event = { direction, timestamp: now };
      onStrumRef.current?.(event);
      return event;
    }

    return null;
  }, []);

  /** Pluck single string when index tip near string X position */
  const detectStringPluck = useCallback((rightLandmarks, stringPositions, threshold = 0.03) => {
    if (!rightLandmarks || !stringPositions?.length) return -1;

    const tipX = rightLandmarks[FINGERS.index.tip].x;
    let closest = -1;
    let minDist = Infinity;

    stringPositions.forEach((sx, i) => {
      const d = Math.abs(tipX - sx);
      if (d < minDist && d < threshold) {
        minDist = d;
        closest = i;
      }
    });

    return closest;
  }, []);

  return { processRightHand, detectStringPluck, setOnStrum };
}
