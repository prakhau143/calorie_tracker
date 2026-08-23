import { useEffect, useId, useRef, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

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
  const debouncedQuery = useDebounce(query, 300);
  const listboxId = useId();
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open || debouncedQuery.trim().length < minChars) {
      setOptions([]);
      return;
    }
    let cancelled = false;
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
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </label>
      {open && (
        <ul className="search-select__listbox" id={`${listboxId}-listbox`} role="listbox">
          {loading && <li className="search-select__status">Searching…</li>}
          {!loading && debouncedQuery.trim().length < minChars && (
            <li className="search-select__status">Type to search…</li>
          )}
          {!loading && debouncedQuery.trim().length >= minChars && options.length === 0 && (
            <li className="search-select__status">No matches</li>
          )}
          {!loading &&
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
        </ul>
      )}
    </div>
  );
}
