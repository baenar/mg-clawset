import type { CSSProperties } from 'react';

interface Props {
  visible: boolean;
}

export default function RoomDesignerWorkspace({ visible }: Props) {
  const style: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--code-bg)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    marginLeft: 16,
    minHeight: 0,
    overflow: 'hidden',
    transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    flex: visible ? '1 1 0%' : '0 0 0%',
    opacity: visible ? 1 : 0,
    ...(visible ? {} : { marginLeft: 0, border: 'none' }),
  };

  const textStyle: CSSProperties = {
    color: 'var(--lavender-grey)',
    fontSize: 18,
    fontWeight: 500,
    fontFamily: 'var(--font)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={style}>
      <span style={textStyle}>Room Designer Coming Soon</span>
    </div>
  );
}
