import { useState, useRef, useEffect } from 'react';
import { searchDrugs } from '../utils/drugSearch.js';
import { apiClient } from '../config.js';

export function DrugSearchInput({
  value = '',
  onChange,
  onSelectDrug,
  placeholder = 'Search drug or brand (e.g. Cosvate GM, Cipla, Dolo)...',
  onBlur,
  hideIcon = false
}) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const queryRef = useRef(query);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

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
    if (onChange) onChange(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const qNormalized = val.trim();
      if (qNormalized.length >= 2) {
        // 1. Get local matches instantly
        const localMatches = searchDrugs(qNormalized);
        setResults(localMatches);
        setShowDropdown(localMatches.length > 0);

        // 2. Fetch server database matches via LLM
        setLoading(true);
        try {
          const response = await apiClient.get(`/api/drugs/search?q=${encodeURIComponent(qNormalized)}`);
          
          if (queryRef.current.trim() === qNormalized) {
            const serverMatches = response.data?.data || [];
            if (serverMatches.length > 0) {
              setResults((prev) => {
                const combined = [...prev];
                serverMatches.forEach((srvDrug) => {
                  const isDuplicate = combined.some((locDrug) => {
                    const nameMatch = locDrug.name.toLowerCase() === srvDrug.name.toLowerCase();
                    const compMatch = (locDrug.composition || '').toLowerCase() === (srvDrug.composition || '').toLowerCase();
                    const brandMatch = (locDrug.brand || '').toLowerCase() === (srvDrug.brand || '').toLowerCase();
                    return nameMatch || (compMatch && brandMatch);
                  });
                  if (!isDuplicate) {
                    combined.push({
                      name: srvDrug.name,
                      composition: srvDrug.composition,
                      brand: srvDrug.brand,
                      score: 50,
                    });
                  }
                });
                return combined;
              });
              setShowDropdown(true);
            }
          }
        } catch (err) {
          console.error('Error searching drugs on server:', err);
        } finally {
          if (queryRef.current.trim() === qNormalized) {
            setLoading(false);
          }
        }
      } else {
        setResults([]);
        setShowDropdown(false);
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (drug) => {
    let drugNameStr = '';
    if (typeof drug === 'object' && drug !== null) {
      if (drug.brand && !drug.name.toLowerCase().includes(drug.brand.toLowerCase())) {
        drugNameStr = `${drug.name} (${drug.brand})`;
      } else {
        drugNameStr = drug.name;
      }
    } else {
      drugNameStr = String(drug || '');
    }

    if (!drugNameStr.trim()) return;

    if (onSelectDrug) {
      onSelectDrug(drugNameStr.trim());
      setQuery('');
      if (onChange) onChange('');
    } else {
      setQuery(drugNameStr);
      if (onChange) onChange(drugNameStr);
    }

    setShowDropdown(false);
    setActiveIndex(-1);
    if (onBlur) onBlur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      } else if (query.trim()) {
        handleSelect({ name: query.trim() });
      }
      return;
    }

    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
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
          onFocus={() => (results.length > 0 || loading) && setShowDropdown(true)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="w-full text-xs border-none bg-transparent focus:outline-none placeholder:text-gray-400 p-0"
        />
        {query.trim() && (
          <button
            type="button"
            onClick={() => handleSelect({ name: query.trim() })}
            className="px-2 py-0.5 bg-[#0A2947] hover:bg-[#163f66] text-white text-[11px] font-bold rounded-lg border-none cursor-pointer shrink-0 transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {(showDropdown || loading) && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {results.map((drug, idx) => (
            <div
              key={idx}
              className={`p-3 hover:bg-teal-light/20 cursor-pointer border-b border-gray-50 last:border-b-0 text-left transition-colors ${idx === activeIndex ? 'bg-teal-light/35 font-semibold' : ''}`}
              onClick={() => handleSelect(drug)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <div className="text-xs font-bold text-navy flex items-center justify-between">
                <span>{drug.name}</span>
                {drug.brand && <span className="font-semibold text-teal-dark text-[10px] bg-teal-light/30 px-1.5 py-0.5 rounded-md">{drug.brand}</span>}
              </div>
              {drug.composition && (
                <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {drug.composition}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="p-2.5 text-center text-xs font-semibold text-teal-dark bg-teal-light/10 flex items-center justify-center gap-1.5">
              <svg className="animate-spin text-teal" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10" strokeDasharray="16" />
              </svg>
              Searching pharmaceutical database...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
