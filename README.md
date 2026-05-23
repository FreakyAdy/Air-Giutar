# 🎸 AirGuitar AR

Web-based Augmented Reality guitar simulator. Uses your webcam and MediaPipe Hands to track both hands, overlays a procedural 3D guitar on your left hand, detects chords from finger curl, and plays Karplus-Strong plucked strings via Tone.js.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). Allow camera access when prompted.

## How to play

1. Show your **left hand** to anchor the 3D guitar on screen.
2. **Strum** with your right hand — quick up/down sweeps trigger strums.
3. **Curl fingers** on your left hand to change chords (open chord shapes).
4. Tap the **gear** icon for settings: landmarks, reverb, body style, mirror.

## Tech stack

- React + Vite
- MediaPipe Hands
- Three.js (procedural guitar)
- Tone.js (PluckSynth + reverb/chorus)
- Tailwind CSS

## Privacy

All processing runs locally in your browser. No video is sent to any server.

## Build

```bash
npm run build
npm run preview
```
