import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGuitarModel } from '../hooks/useGuitarModel';

const ThreeOverlay = forwardRef(function ThreeOverlay(
  { bodyStyle, showFretLabels, mirror },
  ref
) {
  const containerRef = useRef(null);
  const { updateGuitarFromHand, rebuildGuitar, setFretLabelsVisible } = useGuitarModel(
    containerRef,
    { bodyStyle, showFretLabels }
  );

  useEffect(() => {
    rebuildGuitar(bodyStyle);
  }, [bodyStyle, rebuildGuitar]);

  useEffect(() => {
    setFretLabelsVisible(showFretLabels);
  }, [showFretLabels, setFretLabelsVisible]);

  useImperativeHandle(ref, () => ({
    updateGuitarFromHand: (landmarks, w, h) =>
      updateGuitarFromHand(landmarks, w, h, mirror),
  }));

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden
    />
  );
});

export default ThreeOverlay;
