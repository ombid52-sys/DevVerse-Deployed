"use client";

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
} from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  triggerClassName?: string;
  size?: "sm" | "md";
  onChange?: (e: { target: { value: string; name?: string } } | any) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      triggerClassName,
      label,
      error,
      helperText,
      placeholder = "Select an option",
      options = [],
      value: controlledValue,
      defaultValue,
      name,
      disabled = false,
      required = false,
      size = "md",
      onChange,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, "-") : generatedId);
    const listboxId = `${selectId}-listbox`;

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string | number>(
      isControlled ? controlledValue : defaultValue !== undefined ? defaultValue : options[0]?.value ?? ""
    );

    const currentValue = isControlled ? controlledValue : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);

    // Sync ref
    const setSelectRefs = useCallback(
      (node: HTMLSelectElement | null) => {
        hiddenSelectRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
        }
      },
      [ref]
    );

    const selectedOption = options.find((opt) => String(opt.value) === String(currentValue));

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;

      const handlePointerDown = (e: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("touchstart", handlePointerDown);
      };
    }, [isOpen]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
        const items = listboxRef.current.querySelectorAll("[role='option']");
        const activeItem = items[highlightedIndex] as HTMLElement;
        if (activeItem) {
          activeItem.scrollIntoView({ block: "nearest" });
        }
      }
    }, [isOpen, highlightedIndex]);

    const handleSelect = (option: SelectOption) => {
      if (disabled) return;

      if (!isControlled) {
        setInternalValue(option.value);
      }

      if (onChange) {
        onChange({
          target: {
            value: String(option.value),
            name: name || selectId,
          },
        });
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            handleSelect(options[highlightedIndex]);
          } else {
            setIsOpen(false);
          }
        } else {
          setIsOpen(true);
          const currentIndex = options.findIndex((o) => String(o.value) === String(currentValue));
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIndex = options.findIndex((o) => String(o.value) === String(currentValue));
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        } else {
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIndex = options.findIndex((o) => String(o.value) === String(currentValue));
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : options.length - 1);
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }
      } else if (e.key === "Escape" || e.key === "Tab") {
        if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    return (
      <div ref={containerRef} className={cn("relative w-full", className)} {...props}>
        {label && (
          <label
            id={`${selectId}-label`}
            htmlFor={selectId}
            className="block text-xs font-semibold text-neutral-800 mb-1.5 select-none"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        {/* Hidden select element for form accessibility & form data submissions */}
        <select
          ref={setSelectRefs}
          id={selectId}
          name={name}
          value={currentValue !== undefined ? String(currentValue) : ""}
          onChange={(e) => {
            const nextVal = e.target.value;
            if (!isControlled) setInternalValue(nextVal);
            onChange?.(e);
          }}
          disabled={disabled}
          required={required}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={label ? `${selectId}-label` : undefined}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            const nextOpen = !isOpen;
            setIsOpen(nextOpen);
            if (nextOpen) {
              const currentIndex = options.findIndex((o) => String(o.value) === String(currentValue));
              setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full flex items-center justify-between text-left transition-all duration-150 cursor-pointer select-none",
            "bg-white border rounded-lg shadow-sm font-medium",
            size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-xs sm:text-sm",
            isOpen
              ? "border-brand-500 ring-2 ring-brand-500/20"
              : error
              ? "border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-neutral-300 hover:border-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
            disabled && "bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed shadow-none",
            triggerClassName
          )}
        >
          <span
            className={cn(
              "truncate min-w-0 flex-1",
              selectedOption ? "text-neutral-900" : "text-neutral-400 font-normal"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0 ml-2",
              isOpen && "rotate-180 text-brand-600"
            )}
          />
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className={cn(
              "absolute left-0 right-0 z-50 mt-1.5 w-full bg-white border border-neutral-200/90 rounded-xl shadow-xl shadow-neutral-900/10 py-1 overflow-hidden ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-100"
            )}
          >
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-label={label || placeholder}
              tabIndex={-1}
              className="max-h-60 overflow-y-auto overscroll-contain p-1 space-y-0.5 focus:outline-none"
            >
              {options.length === 0 ? (
                <li className="px-3 py-2 text-xs text-neutral-400 text-center select-none">
                  No options available
                </li>
              ) : (
                options.map((option, index) => {
                  const isSelected = String(option.value) === String(currentValue);
                  const isHighlighted = highlightedIndex === index;

                  return (
                    <li
                      key={String(option.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer select-none transition-colors",
                        size === "sm" ? "text-xs" : "text-xs sm:text-sm",
                        isSelected
                          ? "bg-brand-50 text-brand-700 font-semibold"
                          : isHighlighted
                          ? "bg-neutral-100 text-neutral-900"
                          : "text-neutral-700 hover:bg-neutral-50"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-600 shrink-0 ml-2" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
