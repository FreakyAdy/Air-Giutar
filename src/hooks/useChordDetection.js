import { useRef, useCallback } from 'react';
import { FINGERS } from '../utils/landmarkHelpers';
import { chordMap } from '../utils/chordMaps';

function isFingerCurled(landmarks, tipIdx, pipIdx) {
  return landmarks[tipIdx].y > landmarks[pipIdx].y + 0.012;
}

function getFingerKey(landmarks) {
  if (!landmarks) return null;
  const index = isFingerCurled(landmarks, FINGERS.index.tip, FINGERS.index.pip) ? '1' : '0';
  const middle = isFingerCurled(landmarks, FINGERS.middle.tip, FINGERS.middle.pip) ? '1' : '0';
  const ring = isFingerCurled(landmarks, FINGERS.ring.tip, FINGERS.ring.pip) ? '1' : '0';
  const pinky = isFingerCurled(landmarks, FINGERS.pinky.tip, FINGERS.pinky.pip) ? '1' : '0';
  const thumb = isFingerCurled(landmarks, FINGERS.thumb.tip, FINGERS.thumb.pip) ? '1' : '0';
  // 6-char key: Index, Middle, Ring, Pinky, Thumb, pad (matches chordMap)
  return `${index}${middle}${ring}${pinky}${thumb}0`;
}

const DEBOUNCE_FRAMES = 3;

export function useChordDetection() {
  const chordRef = useRef('Unknown');
  const frameSkipRef = useRef(0);
  const stableCountRef = useRef(0);
  const pendingChordRef = useRef('Unknown');

  const detectChord = useCallback((leftLandmarks) => {
    frameSkipRef.current += 1;
    if (frameSkipRef.current % DEBOUNCE_FRAMES !== 0) {
      return chordRef.current;
    }

    if (!leftLandmarks) {
      return chordRef.current;
    }

    const key = getFingerKey(leftLandmarks);
    const detected = chordMap[key] ?? 'Unknown';

    if (detected === pendingChordRef.current) {
      stableCountRef.current += 1;
      if (stableCountRef.current >= 2) {
        chordRef.current = detected;
      }
    } else {
      pendingChordRef.current = detected;
      stableCountRef.current = 0;
    }

    return chordRef.current;
  }, []);

  const getChord = useCallback(() => chordRef.current, []);

  return { detectChord, getChord, chordRef };
}
