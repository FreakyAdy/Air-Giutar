import { useRef, useCallback } from 'react';
import { FINGERS } from '../utils/landmarkHelpers';

const STRUM_THRESHOLD = 0.1;
const COOLDOWN_MS = 550;
const VELOCITY_FRAMES = 4;
const MIN_STRUM_VELOCITY = 0.22;

export function useStrumDetection() {
  const yHistoryRef = useRef([]);
  const lastStrumRef = useRef(0);
  const onStrumRef = useRef(null);
  const canPlayRef = useRef(false);

  const setOnStrum = useCallback((cb) => {
    onStrumRef.current = cb;
  }, []);

  const setCanPlay = useCallback((allowed) => {
    canPlayRef.current = allowed;
    if (!allowed) yHistoryRef.current = [];
  }, []);

  const isStrummingHandPose = (landmarks) => {
    const indexExt =
      landmarks[FINGERS.index.tip].y < landmarks[FINGERS.index.pip].y - 0.015;
    const middleExt =
      landmarks[FINGERS.middle.tip].y < landmarks[FINGERS.middle.pip].y - 0.015;
    const ringCurled =
      landmarks[FINGERS.ring.tip].y > landmarks[FINGERS.ring.pip].y;
    return indexExt && middleExt && ringCurled;
  };

  const isInStrumZone = (rightLandmarks, neckY) => {
    if (neckY == null) return false;
    const strumY =
      (rightLandmarks[FINGERS.index.tip].y + rightLandmarks[FINGERS.middle.tip].y) / 2;
    return strumY > neckY + 0.06;
  };

  const processRightHand = useCallback(
    (rightLandmarks, { neckY, isHolding } = {}, now = Date.now()) => {
      if (!canPlayRef.current || !isHolding || !rightLandmarks) {
        yHistoryRef.current = [];
        return null;
      }

      if (!isStrummingHandPose(rightLandmarks) || !isInStrumZone(rightLandmarks, neckY)) {
        yHistoryRef.current = [];
        return null;
      }

      const avgY =
        (rightLandmarks[FINGERS.index.tip].y + rightLandmarks[FINGERS.middle.tip].y) / 2;

      const history = yHistoryRef.current;
      history.push(avgY);
      if (history.length > VELOCITY_FRAMES) history.shift();

      if (history.length < VELOCITY_FRAMES) return null;
      if (now - lastStrumRef.current < COOLDOWN_MS) return null;

      const deltaY = history[history.length - 1] - history[0];
      const velocity = Math.abs(deltaY) / (VELOCITY_FRAMES - 1);

      if (velocity < MIN_STRUM_VELOCITY) return null;

      let direction = null;
      if (deltaY > STRUM_THRESHOLD) direction = 'down';
      else if (deltaY < -STRUM_THRESHOLD) direction = 'up';

      if (direction) {
        lastStrumRef.current = now;
        yHistoryRef.current = [];
        const event = { direction, timestamp: now };
        onStrumRef.current?.(event);
        return event;
      }

      return null;
    },
    []
  );

  return { processRightHand, setOnStrum, setCanPlay };
}
