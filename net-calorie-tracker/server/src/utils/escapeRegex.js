export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Anchored at the start so search is a prefix match, not "contains anywhere"
// — also lets Mongo use the field's existing ascending index instead of a
// full collection scan, which an unanchored regex can't do.
export function prefixRegex(value) {
  return new RegExp(`^${escapeRegex(value)}`, 'i');
}
