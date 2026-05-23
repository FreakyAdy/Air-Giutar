export default function OnboardingOverlay({ visible, onDismiss }) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-6 max-w-md rounded-2xl border border-white/10 bg-rock-panel p-8 text-center shadow-2xl">
        <p className="mb-2 text-5xl">🎸</p>
        <h2 className="font-display mb-6 text-3xl tracking-wide text-white">Welcome to AirGuitar AR</h2>
        <ul className="mb-8 space-y-4 text-left text-white/80">
          <li className="flex gap-3">
            <span className="text-rock-accent">①</span>
            <span>Show your <strong className="text-white">LEFT hand</strong> to the camera to place the guitar</span>
          </li>
          <li className="flex gap-3">
            <span className="text-rock-accent">②</span>
            <span><strong className="text-white">Strum</strong> with your RIGHT hand — sweep up or down</span>
          </li>
          <li className="flex gap-3">
            <span className="text-rock-accent">③</span>
            <span>Curl fingers on your left hand to change <strong className="text-white">chords</strong></span>
          </li>
        </ul>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg bg-rock-accent px-6 py-2 font-semibold text-white transition hover:bg-rock-glow"
        >
          Got it — let&apos;s rock
        </button>
        <p className="mt-4 text-xs text-white/40">Overlay dismisses automatically when hands are detected</p>
      </div>
    </div>
  );
}
