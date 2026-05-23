import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { STRING_NOTES, getActiveStrings } from '../utils/chordMaps';

const STRUM_DELAY_MS = 20;

export function useAudioEngine() {
  const stringsRef = useRef([]);
  const reverbRef = useRef(null);
  const chorusRef = useRef(null);
  const readyRef = useRef(false);
  const reverbWetRef = useRef(0.35);

  useEffect(() => {
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.35 }).toDestination();
    const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.4, wet: 0.2 });
    chorus.connect(reverb);

    reverbRef.current = reverb;
    chorusRef.current = chorus;

    stringsRef.current = STRING_NOTES.map(
      (note) =>
        new Tone.PluckSynth({
          attackNoise: 1.2,
          dampening: 2800,
          resonance: 0.92,
        }).connect(chorus)
    );

    return () => {
      stringsRef.current.forEach((s) => s.dispose());
      chorus.dispose();
      reverb.dispose();
    };
  }, []);

  const ensureStarted = useCallback(async () => {
    if (!readyRef.current) {
      await Tone.start();
      readyRef.current = true;
    }
  }, []);

  const setReverbWet = useCallback((wet) => {
    reverbWetRef.current = wet;
    if (reverbRef.current) reverbRef.current.wet.value = wet;
  }, []);

  const pluckString = useCallback(
    async (stringIndex, noteOverride) => {
      await ensureStarted();
      const synth = stringsRef.current[stringIndex];
      if (!synth) return;
      const note = noteOverride ?? STRING_NOTES[stringIndex];
      synth.triggerAttack(note);
    },
    [ensureStarted]
  );

  const strum = useCallback(
    async (chordName, direction = 'down', onStringHit) => {
      await ensureStarted();
      const active = getActiveStrings(chordName);
      const order = direction === 'down' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];

      order.forEach((i, idx) => {
        if (!active[i]) return;
        setTimeout(() => {
          stringsRef.current[i]?.triggerAttack(STRING_NOTES[i]);
          onStringHit?.(i);
        }, idx * STRUM_DELAY_MS);
      });
    },
    [ensureStarted]
  );

  return {
    strum,
    pluckString,
    setReverbWet,
    ensureStarted,
    stringsRef,
  };
}
