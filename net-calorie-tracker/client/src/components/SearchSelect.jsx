import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDebounce } from '../hooks/useDebounce.js';

const LISTBOX_MARGIN = 6;
const LISTBOX_MAX_HEIGHT = 260;

export function SearchSelect({
  label,
  placeholder,
  searchFn,
  renderOption,
  getOptionLabel,
  onSelect,
  onQueryChange,
  minChars = 1,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState(null);
  const debouncedQuery = useDebounce(query, 300);
  const listboxId = useId();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  // Populated/cleared entirely from the option `ref` callback below (never
  // mutated during render), so an index can't resolve to a stale element
  // left over from a previous result set — the inline callback identity is
  // new every render, so React detaches and reattaches every option's ref
  // on each render regardless of whether the DOM node itself was reused.
  const optionRefs = useRef(new Map());

  useEffect(() => {
    if (!open || debouncedQuery.trim().length < minChars) {
      return;
    }
    let cancelled = false;
    // Synchronising with an external system (the search API) is exactly what
    // effects are for; the flag has to flip as the request starts.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true);
    searchFn(debouncedQuery)
      .then((result) => {
        if (cancelled) return;
        setOptions(result.items ?? []);
        setActiveIndex(result.items?.length ? 0 : -1);
        setSearchError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        // Distinct from "no matches" — the request itself failed, so tell
        // the user rather than implying their food/activity doesn't exist.
        setOptions([]);
        setActiveIndex(-1);
        setSearchError(err.message || 'Search failed.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, minChars, searchFn, retryToken]);

  // Keyboard navigation moves activeIndex, but nothing else brings that
  // option into view on its own — the listbox scrolls independently of
  // which item is highlighted. `nearest` only scrolls when the option
  // isn't already fully visible, so this is a no-op for mouse-hover-driven
  // activeIndex changes (you can only hover what's already on screen).
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    optionRefs.current.get(activeIndex)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeIndex, open]);

  useEffect(() => {
    function handleClickOutside(e) {
      const insideInput = containerRef.current && containerRef.current.contains(e.target);
      const insideListbox = listboxRef.current && listboxRef.current.contains(e.target);
      if (!insideInput && !insideListbox) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const inputEl = inputRef.current;
      if (!inputEl) return;
      const rect = inputEl.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < LISTBOX_MAX_HEIGHT + LISTBOX_MARGIN && spaceAbove > spaceBelow;

      setPosition({
        left: rect.left,
        width: rect.width,
        top: openUpward ? undefined : rect.bottom + LISTBOX_MARGIN,
        bottom: openUpward ? window.innerHeight - rect.top + LISTBOX_MARGIN : undefined,
        maxHeight: Math.min(LISTBOX_MAX_HEIGHT, (openUpward ? spaceAbove : spaceBelow) - LISTBOX_MARGIN * 2),
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, options.length, loading]);

  function selectOption(option) {
    onSelect(option);
    setQuery('');
    setOptions([]);
    setSearchError(null);
    setOpen(false);
  }

  function retry() {
    setSearchError(null);
    setRetryToken((t) => t + 1);
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (searchError) {
        e.preventDefault();
        retry();
      } else if (activeIndex >= 0 && options[activeIndex]) {
        e.preventDefault();
        selectOption(options[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="search-select" ref={containerRef}>
      <label className="field" htmlFor={listboxId}>
        <span>{label}</span>
        <input
          id={listboxId}
          ref={inputRef}
          className="input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listboxId}-listbox`}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOptions([]);
            // Otherwise activeIndex (and aria-activedescendant) keeps
            // pointing at an option from the old result set until the
            // debounced search resolves and overwrites it.
            setActiveIndex(-1);
            setSearchError(null);
            setOpen(true);
            // A previously selected option no longer matches what's visibly
            // typed once the user edits the query again — the parent's
            // selection would otherwise silently go stale.
            onQueryChange?.();
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </label>
      {/* The listbox itself can't carry aria-live (its children must stay
          options), so result counts and failures are announced from here. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {open && !loading && debouncedQuery.trim().length >= minChars
          ? searchError
            ? 'Search failed. Press Enter to retry.'
            : options.length === 0
              ? 'No matches'
              : `${options.length} result${options.length === 1 ? '' : 's'} available`
          : ''}
      </span>
      {open &&
        position &&
        createPortal(
          <ul
            ref={listboxRef}
            className="search-select__listbox"
            id={`${listboxId}-listbox`}
            role="listbox"
            style={{
              left: position.left,
              width: position.width,
              top: position.top,
              bottom: position.bottom,
              maxHeight: position.maxHeight,
            }}
          >
            {loading && <li className="search-select__status">Searching…</li>}
            {!loading && searchError && (
              <li
                className="search-select__status search-select__status--error"
                role="button"
                tabIndex={0}
                onMouseDown={(e) => {
                  e.preventDefault();
                  retry();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    retry();
                  }
                }}
              >
                Unable to search right now. <span className="search-select__retry">Retry</span>
              </li>
            )}
            {!loading && !searchError && debouncedQuery.trim().length < minChars && (
              <li className="search-select__status">Type to search…</li>
            )}
            {!loading && !searchError && debouncedQuery.trim().length >= minChars && options.length === 0 && (
              <li className="search-select__status">No matches</li>
            )}
            {!loading &&
              !searchError &&
              debouncedQuery.trim().length >= minChars &&
              options.map((option, index) => (
                <li
                  key={option._id}
                  ref={(el) => {
                    if (el) optionRefs.current.set(index, el);
                    else optionRefs.current.delete(index);
                  }}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  tabIndex={-1}
                  className={`search-select__option${index === activeIndex ? ' is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(option);
                  }}
                >
                  {renderOption ? renderOption(option) : getOptionLabel(option)}
                </li>
              ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
