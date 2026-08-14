import { useEffect, useRef, useState, type ReactNode } from 'react';
import './Dropdown.scss';

export interface DropdownOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Secondary line rendered dimmed under the label. */
  sublabel?: ReactNode;
  disabled?: boolean;
  /** Tooltip shown on hover, e.g. the reason a provider is unavailable. */
  tooltip?: string;
  /** Right-aligned adornment (e.g. a status badge). */
  trailing?: ReactNode;
}

interface DropdownProps<T extends string> {
  label?: string;
  value?: T;
  options: DropdownOption<T>[];
  placeholder?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
  onChange: (value: T) => void;
}

/**
 * Custom (non-native) dropdown. Native <select> can't render disabled reasons
 * or two-line options, so we own the menu. Closes on outside click / Escape.
 */
export function Dropdown<T extends string>({
  label,
  value,
  options,
  placeholder = 'Select…',
  align = 'left',
  disabled,
  onChange,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="dd" ref={rootRef}>
      {label && <span className="dd__label">{label}</span>}
      <button
        type="button"
        className="dd__trigger"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="dd__value">{selected ? selected.label : placeholder}</span>
        <span className={`dd__chevron ${open ? 'is-open' : ''}`}>▾</span>
      </button>

      {open && (
        <ul className={`dd__menu dd__menu--${align}`} role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              aria-disabled={opt.disabled}
              title={opt.tooltip}
              className={[
                'dd__option',
                opt.value === value ? 'is-selected' : '',
                opt.disabled ? 'is-disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                if (opt.disabled) return;
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span className="dd__option-main">
                <span className="dd__option-label">{opt.label}</span>
                {opt.sublabel && <span className="dd__option-sub">{opt.sublabel}</span>}
              </span>
              {opt.trailing && <span className="dd__option-trailing">{opt.trailing}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
