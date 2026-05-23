import { useRef, useState, useCallback } from 'react';

const CONFIRM_FRAMES = 15;
const LOSE_FRAMES = 10;

function checkPose(lm) {
  if (!lm || lm.length < 21) return false;

  const tips = [8, 12, 16, 20];
  const mcps = [5, 9, 13, 17];
  let curlCount = 0;
  for (let i = 0; i < 4; i++) {
    if (lm[tips[i]].y > lm[mcps[i]].y + 0.01) curlCount++;
  }
  if (curlCount < 3) return false;

  if (lm[0].y > 0.85) return false;

  const dx = lm[9].x - lm[0].x;
  const dy = lm[9].y - lm[0].y;
  const angle = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
  if (angle < 20 || angle > 160) return false;

  return true;
}

export function usePoseValidator() {
  const confirmCount = useRef(0);
  const loseCount = useRef(0);
  const [poseActive, setPoseActive] = useState(false);
  const activeRef = useRef(false);

  const validate = useCallback((leftLandmarks) => {
    const valid = checkPose(leftLandmarks);

    if (valid) {
      loseCount.current = 0;
      if (!activeRef.current) {
        confirmCount.current += 1;
        if (confirmCount.current >= CONFIRM_FRAMES) {
          activeRef.current = true;
          setPoseActive(true);
        }
      }
    } else {
      confirmCount.current = 0;
      if (activeRef.current) {
        loseCount.current += 1;
        if (loseCount.current >= LOSE_FRAMES) {
          activeRef.current = false;
          loseCount.current = 0;
          setPoseActive(false);
        }
      }
    }

    return activeRef.current;
  }, []);

  return { poseActive, validate, poseActiveRef: activeRef };
}
