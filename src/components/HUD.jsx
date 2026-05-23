export default function HUD({
  fps,
  isTracking,
  isHolding,
  chordDisplay,
  chordFlash,
  activeStrings,
  stringFlash,
}) {
  return (
    <>
      {/* Logo */}
      <header className="absolute left-4 top-4 z-30">
        <h1 className="font-display text-4xl tracking-wider text-white drop-shadow-lg md:text-5xl">
          🎸 AirGuitar AR
        </h1>
      </header>

      {/* FPS + status */}
      <div className="absolute right-4 top-4 z-30 flex items-center gap-3">
        <span className="rounded bg-rock-panel/80 px-2 py-1 font-mono text-xs text-white/80 backdrop-blur">
          {fps} FPS
        </span>
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${
            isTracking
              ? 'bg-green-900/60 text-green-300'
              : 'bg-red-900/60 text-red-300'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
          />
          {isTracking ? 'Tracking' : 'No hands'}
        </span>
        {isTracking && (
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${
              isHolding
                ? 'bg-rock-accent/30 text-rock-glow'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {isHolding ? '🎸 Grip locked' : 'Grip the neck'}
          </span>
        )}
      </div>

      {!isHolding && isTracking && (
        <p className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/50 px-6 py-3 text-center text-sm text-white/80 backdrop-blur">
          Wrap your left hand around an imaginary neck
          <br />
          <span className="text-xs text-white/50">(wrist low, fingers curled on the fretboard)</span>
        </p>
      )}

      {/* Chord display */}
      <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 text-center">
        <p
          className={`font-display text-6xl text-white drop-shadow-[0_0_20px_rgba(230,57,70,0.6)] md:text-8xl ${
            chordFlash ? 'animate-chord-flash' : ''
          }`}
          key={chordDisplay}
        >
          {chordDisplay}
        </p>
      </div>

      {/* String indicators */}
      <div className="absolute bottom-6 left-4 z-30 rounded-lg bg-rock-panel/80 p-3 backdrop-blur">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-white/50">Strings</p>
        <div className="flex h-16 items-end gap-1.5">
          {['E', 'A', 'D', 'G', 'B', 'e'].map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`w-2 rounded-sm transition-all duration-150 ${
                  stringFlash === i || activeStrings?.[i]
                    ? 'h-full bg-rock-glow shadow-[0_0_8px_#ff6b6b]'
                    : 'h-3 bg-white/20'
                }`}
                style={{
                  height: stringFlash === i ? '100%' : activeStrings?.[i] ? '70%' : '12px',
                }}
              />
              <span className="text-[9px] text-white/40">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
