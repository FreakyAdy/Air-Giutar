import { useRef, useState, useEffect, useCallback } from 'react';
import CameraFeed from './components/CameraFeed';
import GuitarOverlay from './components/GuitarOverlay';
import HUD from './components/HUD';
import OnboardingOverlay from './components/OnboardingOverlay';
import SettingsPanel from './components/SettingsPanel';
import HandSkeletonOverlay from './components/HandSkeletonOverlay';
import { useHandTracking } from './hooks/useHandTracking';
import { useChordDetection } from './hooks/useChordDetection';
import { useStrumDetection } from './hooks/useStrumDetection';
import { useAudioEngine } from './hooks/useAudioEngine';
import { usePoseValidator } from './hooks/usePoseValidator';
import { getDisplayName, getActiveStrings } from './utils/chordMaps';
import { useCamera } from './hooks/useCamera';

const DEFAULT_SETTINGS = {
  showLandmarks: false,
  showFretLabels: true,
  reverbAmount: 0.35,
  bodyStyle: 'strat',
  mirrorCamera: true,
};

export default function App() {
  const videoRef = useRef(null);
  const skeletonCanvasRef = useRef(null);
  const containerRef = useRef(null);

  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [fps, setFps] = useState(0);
  const [chordDisplay, setChordDisplay] = useState('—');
  const [chordFlash, setChordFlash] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [activeStrings, setActiveStrings] = useState([true, true, true, true, true, true]);
  const [stringFlash, setStringFlash] = useState(-1);
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });
  const [handLandmarks, setHandLandmarks] = useState({ left: null, right: null });
  const [guitarLandmarks, setGuitarLandmarks] = useState(null);

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const prevChordRef = useRef('—');
  const neckYRef = useRef(null);

  const { detectChord } = useChordDetection();
  const { poseActive, validate } = usePoseValidator();
  const { processRightHand, setOnStrum, setCanPlay } = useStrumDetection();
  const { strum, setReverbWet, ensureStarted } = useAudioEngine();

  const updateSettings = useCallback((partial) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const { cameraState, errorDetail } = useCamera(videoRef, cameraRetryKey);

  useEffect(() => {
    setReverbWet(settings.reverbAmount);
  }, [settings.reverbAmount, setReverbWet]);

  useEffect(() => {
    const video = videoRef.current;
    if (cameraState !== 'ready' || !video) return;

    const updateSize = () => {
      setDimensions({
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
      });
    };
    updateSize();
    video.addEventListener('loadedmetadata', updateSize);
    return () => video.removeEventListener('loadedmetadata', updateSize);
  }, [cameraState, cameraRetryKey]);

  const handleStrum = useCallback(
    (event) => {
      if (!leftRef.current) return;
      const chord = detectChord(leftRef.current) || 'Unknown';
      strum(chord, event.direction, (i) => {
        setStringFlash(i);
        setTimeout(() => setStringFlash(-1), 120);
      });
    },
    [detectChord, strum]
  );

  useEffect(() => {
    setOnStrum(handleStrum);
  }, [setOnStrum, handleStrum]);

  useEffect(() => {
    setCanPlay(true);
  }, [setCanPlay]);

  const { setOnResults } = useHandTracking(videoRef, {
    mirror: settings.mirrorCamera,
    enabled: cameraState === 'ready',
  });

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;

    setOnResults(({ left, right, isTracking: tracking }) => {
      leftRef.current = left;
      rightRef.current = right;
      setHandLandmarks({ left, right });
      setIsTracking(tracking);

      if (tracking && showOnboarding) {
        setShowOnboarding(false);
      }

      const holding = validate(left);

      if (holding && left) {
        setGuitarLandmarks(left);
        neckYRef.current = left[0].y;

        const chord = detectChord(left);
        const display = getDisplayName(chord);
        if (display !== prevChordRef.current) {
          prevChordRef.current = display;
          setChordDisplay(display);
          setChordFlash(true);
          setTimeout(() => setChordFlash(false), 400);
        }
        setActiveStrings(getActiveStrings(chord));
      } else {
        setGuitarLandmarks(null);
        setChordDisplay('—');
        prevChordRef.current = '—';
        setActiveStrings([false, false, false, false, false, false]);
      }

      if (right && holding) {
        processRightHand(right, { neckY: neckYRef.current, isHolding: holding });
      }

      frames += 1;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
    });
  }, [setOnResults, detectChord, processRightHand, validate, showOnboarding]);

  const resizeObserver = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      setDimensions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    resizeObserver();
    window.addEventListener('resize', resizeObserver);
    return () => window.removeEventListener('resize', resizeObserver);
  }, [resizeObserver]);

  const displayStrings =
    stringFlash >= 0
      ? activeStrings.map((on, i) => (i === stringFlash ? true : on))
      : activeStrings;

  if (cameraState === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rock-dark p-8 text-center text-white">
        <div className="max-w-md">
          <p className="mb-4 text-5xl">📷</p>
          <h1 className="font-display mb-4 text-3xl">Camera access required</h1>
          <p className="text-white/70">
            AirGuitar AR needs your webcam to track your hands. Please allow camera access in your
            browser settings and refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-rock-dark">
      <CameraFeed ref={videoRef} mirror={settings.mirrorCamera} />

      <GuitarOverlay
        landmarks={guitarLandmarks}
        activeStrings={displayStrings}
        poseActive={poseActive}
        videoRef={videoRef}
        mirror={settings.mirrorCamera}
      />

      <HandSkeletonOverlay
        canvasRef={skeletonCanvasRef}
        left={handLandmarks.left}
        right={handLandmarks.right}
        width={dimensions.width}
        height={dimensions.height}
        mirror={settings.mirrorCamera}
        visible={settings.showLandmarks}
      />

      <HUD
        fps={fps}
        isTracking={isTracking}
        isHolding={poseActive}
        chordDisplay={chordDisplay}
        chordFlash={chordFlash}
        activeStrings={displayStrings}
        stringFlash={stringFlash}
      />

      <OnboardingOverlay
        visible={showOnboarding && cameraState === 'ready'}
        onDismiss={() => {
          ensureStarted();
          setShowOnboarding(false);
        }}
      />

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="absolute bottom-6 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-rock-panel/90 text-xl text-white shadow-lg backdrop-blur transition hover:bg-rock-accent"
        aria-label="Settings"
      >
        ⚙
      </button>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={updateSettings}
      />

      {cameraState === 'loading' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-rock-dark/90">
          <p className="font-display animate-pulse text-2xl text-white">Loading camera…</p>
        </div>
      )}

      {cameraState === 'error' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-rock-dark/95 p-8">
          <div className="max-w-md text-center text-white">
            <p className="mb-4 text-5xl">⚠️</p>
            <h2 className="font-display mb-3 text-3xl">Camera unavailable</h2>
            <p className="mb-2 text-white/70">
              Could not start the webcam. Close other apps using the camera, then try again.
            </p>
            {errorDetail && (
              <p className="mb-4 font-mono text-xs text-white/40">{errorDetail}</p>
            )}
            <button
              type="button"
              onClick={() => setCameraRetryKey((k) => k + 1)}
              className="rounded-lg bg-rock-accent px-6 py-2 font-semibold hover:bg-rock-glow"
            >
              Retry camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
