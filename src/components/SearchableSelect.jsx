import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";

const normalizeText = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Buscar...",
  disabled = false,
  getOptionValue = (opt) => String(opt.id),
  getOptionLabel = (opt) => opt.nombre || "",
  getOptionSubtext = (opt) => opt.codigo || "",
  emptyMessage = "Sin resultados",
}) => {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedOption = useMemo(
    () => options.find((opt) => getOptionValue(opt) === String(value)) || null,
    [options, value, getOptionValue]
  );

  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const normQuery = normalizeText(query);
    if (!normQuery) return options.slice(0, 80);

    const results = [];
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const label = normalizeText(getOptionLabel(opt));
      const subtext = normalizeText(getOptionSubtext(opt));
      if (label.includes(normQuery) || (subtext && subtext.includes(normQuery))) {
        results.push(opt);
        if (results.length >= 80) break;
      }
    }
    return results;
  }, [options, query, getOptionLabel, getOptionSubtext]);

  const handleSelect = (opt) => {
    const nextVal = getOptionValue(opt);
    setIsOpen(false);
    setQuery("");
    if (onChange) onChange(nextVal);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery("");
    setIsOpen(false);
    if (onChange) onChange("");
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : Math.max(0, filteredOptions.length - 1)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-3 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          disabled={disabled}
          value={isOpen ? query : selectedLabel}
          placeholder={selectedLabel || placeholder}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setQuery("");
              setHighlightedIndex(0);
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="w-full pl-9 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-yellow-500 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="absolute right-2.5 top-2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/70 transition-colors"
              title="Limpiar"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={15}
            className={`text-slate-400 pointer-events-none transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto py-1">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const optVal = getOptionValue(opt);
              const isSelected = optVal === String(value);
              const isHighlighted = idx === highlightedIndex;
              const subtext = getOptionSubtext(opt);

              return (
                <button
                  key={optVal}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3.5 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? "bg-yellow-50 text-slate-900 font-bold"
                      : isHighlighted
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{getOptionLabel(opt)}</span>
                  {subtext && (
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {subtext}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
