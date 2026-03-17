import type { CSSProperties } from 'react';

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: 13,
    color: 'var(--text)',
  },
  track: {
    width: 36,
    height: 20,
    borderRadius: 10,
    position: 'relative',
    transition: 'background 0.2s',
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: 2,
    transition: 'left 0.2s',
  },
};

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function ToggleSwitch({ checked, onChange, label }: Props) {
  return (
    <div style={styles.wrapper} onClick={() => onChange(!checked)}>
      <div
        style={{
          ...styles.track,
          background: checked ? 'var(--accent)' : 'var(--border)',
        }}
      >
        <div style={{ ...styles.thumb, left: checked ? 18 : 2 }} />
      </div>
      <span>{label}</span>
    </div>
  );
}
