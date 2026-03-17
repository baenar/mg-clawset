import type { CSSProperties } from 'react';

const style: CSSProperties = {
  width: 48,
  height: 48,
  flexShrink: 0,
  borderRadius: 6,
  border: '1px dashed var(--border)',
  background: 'transparent',
};

export default function ShapePlaceholder() {
  return <div style={style} />;
}
