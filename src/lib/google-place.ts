/**
 * Normalise a Google Place ID from admin input. Accepts either a bare Place ID
 * (e.g. "ChIJ...") or a Google Maps / embed URL that contains a
 * `place_id=` / `place_id:` / `placeid=` value, and returns the clean ID.
 *
 * Returns null when it can't find a Place ID — e.g. a plain business name, a
 * `?cid=` link, a short `maps.app.goo.gl` link, or a `/data=...!1s0x...:0x...`
 * URL (those carry a CID/feature id, not a Place ID, and can't be converted
 * without the Places API). The caller should reject those with a hint.
 */
export function parseGooglePlaceId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;

  // A URL (or any text) carrying place_id=... / place_id:... / placeid=...
  const fromUrl = s.match(/place[_ ]?id[:=]\s*([A-Za-z0-9_-]{10,})/i);
  if (fromUrl) return fromUrl[1];

  // A bare Place ID token: no spaces/slashes, reasonable charset and length.
  if (/^[A-Za-z0-9_-]{15,256}$/.test(s)) return s;

  return null;
}

export function isValidGooglePlaceInput(input: string): boolean {
  return parseGooglePlaceId(input) !== null;
}
