import * as THREE from 'three';

const BODY_COLORS = {
  classic: { body: 0x8b4513, pickguard: 0xf5f5dc, neck: 0x2a1810 },
  modern: { body: 0x1a1a2e, pickguard: 0xe63946, neck: 0x111122 },
  bass: { body: 0x2d3436, pickguard: 0x636e72, neck: 0x1e272e },
};

/**
 * Build procedural guitar group (body, neck, strings, frets).
 */
export function buildGuitarGroup(style = 'classic') {
  const colors = BODY_COLORS[style] ?? BODY_COLORS.classic;
  const isBass = style === 'bass';
  const stringCount = isBass ? 4 : 6;
  const group = new THREE.Group();
  group.name = 'guitar';

  // Body
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.35, 0);
  bodyShape.bezierCurveTo(-0.5, 0.15, -0.45, 0.55, -0.2, 0.65);
  bodyShape.lineTo(0.2, 0.65);
  bodyShape.bezierCurveTo(0.45, 0.55, 0.5, 0.15, 0.35, 0);
  bodyShape.lineTo(-0.35, 0);

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.6,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = -Math.PI / 2;
  body.position.set(0, 0, -0.06);
  group.add(body);

  // Pickguard
  const pgGeo = new THREE.BoxGeometry(0.35, 0.45, 0.02);
  const pg = new THREE.Mesh(
    pgGeo,
    new THREE.MeshStandardMaterial({ color: colors.pickguard, roughness: 0.4 })
  );
  pg.position.set(0, 0.08, 0.02);
  group.add(pg);

  // Neck
  const neckLen = isBass ? 1.4 : 1.2;
  const neckGeo = new THREE.BoxGeometry(0.14, neckLen, 0.06);
  const neck = new THREE.Mesh(
    neckGeo,
    new THREE.MeshStandardMaterial({ color: colors.neck, roughness: 0.5 })
  );
  neck.position.set(0, neckLen / 2 + 0.35, 0.04);
  group.add(neck);

  // Fretboard (darker strip)
  const fbGeo = new THREE.BoxGeometry(0.12, neckLen - 0.05, 0.02);
  const fretboard = new THREE.Mesh(
    fbGeo,
    new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 0.7 })
  );
  fretboard.position.set(0, neckLen / 2 + 0.35, 0.08);
  group.add(fretboard);

  // Fret markers
  const fretPositions = isBass ? [0.25, 0.5, 0.75] : [0.2, 0.4, 0.55, 0.7, 0.85];
  const fretMarkers = new THREE.Group();
  fretMarkers.name = 'fretMarkers';
  fretPositions.forEach((t) => {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.01, 12),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x222222 })
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, 0.35 + t * neckLen, 0.1);
    fretMarkers.add(disc);
  });
  group.add(fretMarkers);

  // Strings
  const stringsGroup = new THREE.Group();
  stringsGroup.name = 'strings';
  const spread = isBass ? 0.04 : 0.05;
  const startY = 0.38;
  const endY = startY + neckLen + 0.15;

  for (let i = 0; i < stringCount; i++) {
    const x = (i - (stringCount - 1) / 2) * (spread / Math.max(1, stringCount - 1));
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, startY, 0.11),
      new THREE.Vector3(x, startY + neckLen * 0.5, 0.12),
      new THREE.Vector3(x, endY, 0.11),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.003 + i * 0.0005, 6, false);
    const stringMesh = new THREE.Mesh(
      tubeGeo,
      new THREE.MeshStandardMaterial({
        color: 0xc0c0c0,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x111111,
      })
    );
    stringMesh.userData.stringIndex = i;
    stringsGroup.add(stringMesh);
  }
  group.add(stringsGroup);

  // Headstock
  const headGeo = new THREE.BoxGeometry(0.16, 0.2, 0.05);
  const headstock = new THREE.Mesh(
    headGeo,
    new THREE.MeshStandardMaterial({ color: colors.neck })
  );
  headstock.position.set(0, endY + 0.12, 0.06);
  group.add(headstock);

  group.userData.stringCount = stringCount;
  return group;
}

export function updateFretLabelVisibility(guitarGroup, showLabels) {
  const markers = guitarGroup.getObjectByName('fretMarkers');
  if (markers) markers.visible = showLabels;
}
