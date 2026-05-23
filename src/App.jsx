import { useRef, useState, useEffect, useCallback } from 'react';
import CameraFeed from './components/CameraFeed';
import ThreeOverlay from './components/ThreeOverlay';
import HUD from './components/HUD';
import OnboardingOverlay from './components/OnboardingOverlay';
import SettingsPanel from './components/SettingsPanel';
import HandSkeletonOverlay from './components/HandSkeletonOverlay';
import { useHandTracking } from './hooks/useHandTracking';
import { useChordDetection } from './hooks/useChordDetection';
import { useStrumDetection } from './hooks/useStrumDetection';
import { useAudioEngine } from './hooks/useAudioEngine';
import { getDisplayName, getActiveStrings } from './utils/chordMaps';

const DEFAULT_SETTINGS = {
  showLandmarks: false,
  showFretLabels: true,
  reverbAmount: 0.35,
  bodyStyle: 'classic',
  mirrorCamera: true,
};

export default function App() {
  const videoRef = useRef(null);
  const threeRef = useRef(null);
  const skeletonCanvasRef = useRef(null);
  const containerRef = useRef(null);

  const [cameraState, setCameraState] = useState('loading'); // loading | ready | denied | error
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

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const prevChordRef = useRef('—');
  const stringPositionsRef = useRef([]);
  const pluckCooldownRef = useRef(0);

  const { detectChord } = useChordDetection();
  const { processRightHand, detectStringPluck, setOnStrum } = useStrumDetection();
  const { strum, pluckString, setReverbWet, ensureStarted } = useAudioEngine();

  const updateSettings = useCallback((partial) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  useEffect(() => {
    setReverbWet(settings.reverbAmount);
  }, [settings.reverbAmount, setReverbWet]);

  // Camera init
  useEffect(() => {
    let stream = null;

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        setDimensions({ width: video.videoWidth || 1280, height: video.videoHeight || 720 });
        setCameraState('ready');
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraState('denied');
        } else {
          setCameraState('error');
        }
      }
    }

    initCamera();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleStrum = useCallback(
    (event) => {
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

  const { setOnResults } = useHandTracking(videoRef, {
    mirror: settings.mirrorCamera,
    enabled: cameraState === 'ready',
  });

  // Main processing loop via hand tracking callback
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

      const video = videoRef.current;
      const w = video?.videoWidth || dimensions.width;
      const h = video?.videoHeight || dimensions.height;

      if (left) {
        const result = threeRef.current?.updateGuitarFromHand(left, w, h);
        if (result?.stringPositions) {
          stringPositionsRef.current = result.stringPositions;
        }

        const chord = detectChord(left);
        const display = getDisplayName(chord);
        if (display !== prevChordRef.current) {
          prevChordRef.current = display;
          setChordDisplay(display);
          setChordFlash(true);
          setTimeout(() => setChordFlash(false), 400);
        }
        setActiveStrings(getActiveStrings(chord));
      }

      if (right) {
        processRightHand(right);

        const now = Date.now();
        if (now - pluckCooldownRef.current > 150) {
          const stringIdx = detectStringPluck(right, stringPositionsRef.current);
          if (stringIdx >= 0) {
            pluckCooldownRef.current = now;
            const chord = detectChord(leftRef.current) || 'Unknown';
            const active = getActiveStrings(chord);
            if (active[stringIdx] !== false) {
              ensureStarted().then(() => {
                pluckString(stringIdx);
                setStringFlash(stringIdx);
                setTimeout(() => setStringFlash(-1), 120);
              });
            }
          }
        }
      }

      frames += 1;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
    });
  }, [
    setOnResults,
    detectChord,
    processRightHand,
    detectStringPluck,
    pluckString,
    ensureStarted,
    showOnboarding,
    dimensions,
  ]);

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

  if (cameraState === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rock-dark p-8 text-center text-white">
        <div className="max-w-md">
          <p className="mb-4 text-5xl">⚠️</p>
          <h1 className="font-display mb-4 text-3xl">Camera unavailable</h1>
          <p className="text-white/70">
            Could not access a camera device. Connect a webcam and reload the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-rock-dark">
      <CameraFeed ref={videoRef} mirror={settings.mirrorCamera} />

      <ThreeOverlay
        ref={threeRef}
        bodyStyle={settings.bodyStyle}
        showFretLabels={settings.showFretLabels}
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
        chordDisplay={chordDisplay}
        chordFlash={chordFlash}
        activeStrings={activeStrings}
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-rock-dark">
          <p className="font-display animate-pulse text-2xl text-white">Loading camera…</p>
        </div>
      )}
    </div>
  );
}
