/** Small PDF checks that work the same in the browser and on the server. */

export function looksLikePdf(bytes: Uint8Array) {
  // Every PDF starts with "%PDF-".
  return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

/** Rough page count from the raw bytes. Good enough for a hint, not exact. */
export function estimatePdfPages(bytes: Uint8Array) {
  const text = new TextDecoder("latin1").decode(bytes);
  const matches = text.match(/\/Type\s*\/Page(?!s)/g);
  return matches?.length || undefined;
}
