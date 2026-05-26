import { useState, useRef, useEffect } from 'react';
import { searchDrugs } from '../utils/drugSearch.js';

export function DrugSearchInput({ value, onChange, placeholder = 'Search drug (CDSCO)...', onBlur, hideIcon = false }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 2) {
        const matches = searchDrugs(val);
        setResults(matches);
        setShowDropdown(matches.length > 0);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 200);
  };

  const handleSelect = (drug) => {
    setQuery(drug.name);
    onChange(drug.name);
    setShowDropdown(false);
    setActiveIndex(-1);
    // Explicitly trigger onBlur logic since dropdown selection doesn't naturally trigger input blur
    if (onBlur) onBlur();
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative w-full text-left" ref={wrapperRef}>
      <div className={`flex items-center gap-1.5 border border-gray-200 rounded-xl bg-white w-full focus-within:ring-2 focus-within:ring-teal/20 focus-within:border-teal transition-all ${hideIcon ? 'px-2 py-1' : 'px-3 py-1.5'}`}>
        {!hideIcon && (
          <svg className="text-gray-400 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full text-xs border-none bg-transparent focus:outline-none placeholder:text-gray-400 p-0"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map((drug, idx) => (
            <div
              key={idx}
              className={`p-3 hover:bg-teal-light/20 cursor-pointer border-b border-gray-50 last:border-b-0 text-left ${idx === activeIndex ? 'bg-teal-light/35' : ''}`}
              onClick={() => handleSelect(drug)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <div className="text-sm font-semibold text-navy">{drug.name}</div>
              <div className="text-xs text-gray-500 flex justify-between gap-2 mt-0.5">
                <span className="truncate">{drug.composition}</span>
                {drug.brand && <span className="font-medium text-teal-dark shrink-0">{drug.brand}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
