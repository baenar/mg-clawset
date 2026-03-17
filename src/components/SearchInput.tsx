import type { CSSProperties } from 'react';

const styles: Record<string, CSSProperties> = {
  input: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontFamily: 'var(--font)',
    fontSize: 14,
    outline: 'none',
  },
};

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchInput({ value, onChange }: Props) {
  return (
    <input
      type="text"
      placeholder="Search name..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.input}
    />
  );
}
