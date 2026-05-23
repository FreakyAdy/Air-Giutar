import * as THREE from 'three';

/** MediaPipe finger indices */
export const FINGERS = {
  index: { tip: 8, pip: 6, mcp: 5 },
  middle: { tip: 12, pip: 10, mcp: 9 },
  ring: { tip: 16, pip: 14, mcp: 13 },
  pinky: { tip: 20, pip: 18, mcp: 17 },
  thumb: { tip: 4, pip: 3, mcp: 2 },
};

export const WRIST = 0;

/**
 * Convert normalized MediaPipe landmark to Three.js world position.
 */
export function landmarkToWorld(landmark, videoWidth, videoHeight, camera, zPlane = 0.5) {
  const x = (landmark.x - 0.5) * 2;
  const y = -(landmark.y - 0.5) * 2;
  const vec = new THREE.Vector3(x, y, zPlane).unproject(camera);
  return vec;
}

/**
 * Angle from wrist to middle MCP (radians) for guitar rotation.
 */
export function wristToNeckAngle(landmarks) {
  const wrist = landmarks[WRIST];
  const midMCP = landmarks[FINGERS.middle.mcp];
  return Math.atan2(midMCP.y - wrist.y, midMCP.x - wrist.x);
}

/**
 * Bounding box span of hand landmarks (for scale).
 */
export function handBoundingSpan(landmarks) {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (const lm of landmarks) {
    minX = Math.min(minX, lm.x);
    maxX = Math.max(maxX, lm.x);
    minY = Math.min(minY, lm.y);
    maxY = Math.max(maxY, lm.y);
  }
  return Math.hypot(maxX - minX, maxY - minY);
}

/**
 * Mirror X for mirrored camera feed.
 */
export function mirrorLandmark(landmark, mirror) {
  if (!mirror) return landmark;
  return { ...landmark, x: 1 - landmark.x };
}

/**
 * Distance between two landmarks in normalized space.
 */
export function landmarkDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Map normalized landmark to canvas pixel coords.
 */
export function landmarkToCanvas(landmark, width, height, mirror = false) {
  const x = mirror ? (1 - landmark.x) * width : landmark.x * width;
  const y = landmark.y * height;
  return { x, y };
}
