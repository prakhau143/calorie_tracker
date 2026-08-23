export function StatusPanel({ kind = 'loading', message }) {
  const defaults = {
    loading: 'Loading…',
    error: 'Something went wrong.',
    empty: 'Nothing here yet.',
  };
  return (
    <div className={`status-panel status-panel--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {message ?? defaults[kind]}
    </div>
  );
}
