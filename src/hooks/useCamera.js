import { useEffect, useState, useRef } from 'react';

const CONSTRAINT_ATTEMPTS = [
  { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
  { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
  { video: true, audio: false },
];

async function acquireStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia not supported');
  }

  let lastError;
  for (const constraints of CONSTRAINT_ATTEMPTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw err;
      }
    }
  }
  throw lastError ?? new Error('No camera stream');
}

async function waitForVideoRef(videoRef, maxMs = 3000) {
  const start = Date.now();
  while (!videoRef.current && Date.now() - start < maxMs) {
    await new Promise((r) => requestAnimationFrame(r));
  }
  return videoRef.current;
}

async function attachAndPlay(video, stream) {
  video.srcObject = stream;
  video.muted = true;

  try {
    await video.play();
  } catch (err) {
    // Harmless when StrictMode remounts or tab is backgrounded briefly
    if (err.name === 'AbortError') {
      await new Promise((r) => setTimeout(r, 100));
      if (video.srcObject) await video.play();
      return;
    }
    throw err;
  }
}

/**
 * Binds webcam stream to videoRef. Survives React StrictMode double-mount.
 */
export function useCamera(videoRef, retryKey = 0) {
  const [cameraState, setCameraState] = useState('loading');
  const [errorDetail, setErrorDetail] = useState('');
  const streamRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setCameraState('loading');
      setErrorDetail('');

      try {
        const video = await waitForVideoRef(videoRef);
        if (!video) {
          if (!cancelled) {
            setCameraState('error');
            setErrorDetail('Video element not ready');
          }
          return;
        }

        const stream = await acquireStream();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        await attachAndPlay(video, stream);

        if (cancelled) return;

        const onLoaded = () => {
          if (!cancelled) setCameraState('ready');
        };

        if (video.readyState >= 1) {
          onLoaded();
        } else {
          video.addEventListener('loadedmetadata', onLoaded, { once: true });
        }
      } catch (err) {
        if (cancelled) return;

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraState('denied');
        } else {
          setCameraState('error');
          setErrorDetail(err.message || err.name || 'Unknown error');
        }
        console.error('[AirGuitar] Camera init failed:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef, retryKey]);

  return { cameraState, errorDetail };
}
