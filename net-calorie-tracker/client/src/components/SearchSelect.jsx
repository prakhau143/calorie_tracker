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
  minChars = 1,
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState(null);
  const debouncedQuery = useDebounce(query, 300);
  const listboxId = useId();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxRef = useRef(null);

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
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, minChars, searchFn]);

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
    setOpen(false);
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
      if (activeIndex >= 0 && options[activeIndex]) {
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
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </label>
      {/* The listbox itself can't carry aria-live (its children must stay
          options), so result counts are announced from here instead. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {open && debouncedQuery.trim().length >= minChars && !loading
          ? options.length === 0
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
            {!loading && debouncedQuery.trim().length < minChars && (
              <li className="search-select__status">Type to search…</li>
            )}
            {!loading && debouncedQuery.trim().length >= minChars && options.length === 0 && (
              <li className="search-select__status">No matches</li>
            )}
            {!loading &&
              debouncedQuery.trim().length >= minChars &&
              options.map((option, index) => (
                <li
                  key={option._id}
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
