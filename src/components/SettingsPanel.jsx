export default function SettingsPanel({
  open,
  onClose,
  settings,
  onChange,
}) {
  const {
    showLandmarks,
    showFretLabels,
    reverbAmount,
    bodyStyle,
    mirrorCamera,
  } = settings;

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
          aria-label="Close settings"
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] transform border-l border-white/10 bg-rock-panel shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="font-display text-2xl text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-4">
          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-white/80">Show hand landmarks</span>
            <input
              type="checkbox"
              checked={showLandmarks}
              onChange={(e) => onChange({ showLandmarks: e.target.checked })}
              className="h-5 w-5 accent-rock-accent"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-white/80">Show fret labels</span>
            <input
              type="checkbox"
              checked={showFretLabels}
              onChange={(e) => onChange({ showFretLabels: e.target.checked })}
              className="h-5 w-5 accent-rock-accent"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between">
            <span className="text-sm text-white/80">Mirror camera</span>
            <input
              type="checkbox"
              checked={mirrorCamera}
              onChange={(e) => onChange({ mirrorCamera: e.target.checked })}
              className="h-5 w-5 accent-rock-accent"
            />
          </label>

          <div>
            <label className="mb-2 block text-sm text-white/80">
              Reverb — {Math.round(reverbAmount * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={reverbAmount}
              onChange={(e) => onChange({ reverbAmount: parseFloat(e.target.value) })}
              className="w-full accent-rock-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/80">Guitar body style</label>
            <select
              value={bodyStyle}
              onChange={(e) => onChange({ bodyStyle: e.target.value })}
              className="w-full rounded-lg border border-white/20 bg-rock-dark px-3 py-2 text-white"
            >
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              <option value="bass">Bass</option>
            </select>
          </div>
        </div>
      </aside>
    </>
  );
}
