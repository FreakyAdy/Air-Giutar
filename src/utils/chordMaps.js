/**
 * Finger curl key: Index, Middle, Ring, Pinky, Thumb (1 = curled)
 * Order matches detection in useChordDetection
 */
export const chordMap = {
  '000000': 'Open E',
  '111100': 'Open A',
  '010100': 'Open D',
  '110100': 'Open G',
  '001100': 'Open C',
  '000100': 'Open Em',
  '111110': 'Open Am',
  '011100': 'Open Dm',
  '111000': 'F Major',
  '101100': 'G7',
  '110000': 'E7',
  '011000': 'A Minor 7',
  '111111': 'Muted',
};

/** Which strings ring for each chord (low E → high E) */
export const chordToStrings = {
  'Open E': [true, true, true, true, true, true],
  'Open A': [false, true, true, true, true, true],
  'Open D': [false, false, true, true, true, true],
  'Open G': [true, true, true, true, false, true],
  'Open C': [false, true, true, true, true, false],
  'Open Em': [true, true, true, true, true, false],
  'Open Am': [false, true, true, true, true, false],
  'Open Dm': [false, false, true, true, true, false],
  'F Major': [true, true, true, true, false, false],
  'G7': [true, true, true, true, true, false],
  'E7': [true, true, true, true, false, false],
  'A Minor 7': [false, true, true, true, true, false],
  'Muted': [false, false, false, false, false, false],
  Unknown: [true, true, true, true, true, true],
};

export const STRING_NOTES = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

export function getActiveStrings(chordName) {
  return chordToStrings[chordName] ?? chordToStrings.Unknown;
}

export function getDisplayName(chordName) {
  const names = {
    'Open E': 'E Major',
    'Open A': 'A Major',
    'Open D': 'D Major',
    'Open G': 'G Major',
    'Open C': 'C Major',
    'Open Em': 'E Minor',
    'Open Am': 'A Minor',
    'Open Dm': 'D Minor',
    'F Major': 'F Major',
    'G7': 'G7',
    'E7': 'E7',
    'A Minor 7': 'Am7',
    Muted: '—',
    Unknown: '—',
  };
  return names[chordName] ?? chordName;
}
