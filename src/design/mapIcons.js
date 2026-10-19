import L from "leaflet";

/*
  Custom map markers drawn in the same hand as Art.jsx — teal discs, white
  rings and hand-cut glyphs. Using divIcons (instead of Leaflet's default PNGs)
  keeps the line-art language and sidesteps the classic bundler icon path bug.
*/

const ring = (fill, glyph) => `
  <div class="h-pin">
    <span class="h-pin-disc" style="background:${fill}">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
    </span>
  </div>`;

const cross = '<path d="M12 6v12M6 12h12"/>';
const house = '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>';
const nav = '<path d="m3 11 19-9-9 19-2-8z"/>';

const icon = (html, size = 40, cls = "") => L.divIcon({
  className: `h-pinwrap ${cls}`,
  html,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
});

export const pharmacyIcon = () => icon(ring("var(--teal)", cross), 40, "is-pharmacy");
export const patientIcon = () => icon(ring("var(--ink)", house), 40, "is-patient");
export const riderIcon = () => icon(ring("var(--teal-deep)", nav), 40, "is-rider");
