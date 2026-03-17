import type { CSSProperties } from 'react';

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  input: {
    width: '100%',
    padding: '4px 6px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontFamily: 'var(--font)',
    fontSize: 13,
    textAlign: 'center' as const,
    outline: 'none',
    MozAppearance: 'textfield' as never,
  },
};

// Hide number input spinners via a <style> tag injected once
const hideSpinners = `
input.stat-filter::-webkit-outer-spin-button,
input.stat-filter::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input.stat-filter {
  -moz-appearance: textfield;
}
`;

let injected = false;
function injectStyles() {
  if (injected) return;
  injected = true;
  const el = document.createElement('style');
  el.textContent = hideSpinners;
  document.head.appendChild(el);
}

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function StatFilter({ label, value, onChange }: Props) {
  injectStyles();

  const displayValue = value === -20 ? '' : String(value);

  return (
    <div style={styles.wrapper}>
      <input
        className="stat-filter"
        type="number"
        placeholder={label}
        title={`Min ${label}`}
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '' || raw === '-') {
            onChange(-20);
            return;
          }
          const num = parseInt(raw, 10);
          if (!isNaN(num)) onChange(num);
        }}
        style={styles.input}
      />
    </div>
  );
}
