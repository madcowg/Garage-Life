// The tube: three fixed passes mounted ONCE above the router — 2px multiply
// scanlines, a 3px RGB aperture grille on screen blend, and a corner
// vignette. Nothing else in the game draws scanlines — this replaces every
// per-screen SCANLINE_OVERLAY that used to be layered ad hoc.
export function CrtOverlay({ enabled = true }) {
  if (!enabled) return null;
  return (
    <>
      <div className="gl-crt gl-crt-scanlines" />
      <div className="gl-crt gl-crt-grille" />
      <div className="gl-crt gl-crt-vignette" />
    </>
  );
}
