import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';

interface Props {
  src: string;
  alt: string;
  compact?: boolean;
}

export default function FurnitureImage({ src, alt, compact }: Props) {
  const size = compact ? 40 : 56;
  const imgSize = compact ? 34 : 48;
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fixedSrc = src.startsWith('public/') ? src.slice(6) : src;

  const handleEnter = useCallback(() => {
    if (compact) return;
    timerRef.current = setTimeout(() => setShowModal(true), 500);
  }, [compact]);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setShowModal(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const wrapper: CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    background: 'var(--code-bg)',
    overflow: 'hidden',
    position: 'relative',
    cursor: compact ? 'default' : 'pointer',
  };

  const img: CSSProperties = {
    maxWidth: imgSize,
    maxHeight: imgSize,
    objectFit: 'contain',
  };

  const modal: CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
    width: 200,
    height: 200,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    boxShadow: 'var(--shadow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };

  // Position the modal relative to the wrapper
  const getModalPosition = (): CSSProperties => {
    if (!wrapperRef.current) return {};
    const rect = wrapperRef.current.getBoundingClientRect();
    return {
      top: Math.max(8, rect.top - 70),
      left: rect.right + 12,
    };
  };

  return (
    <div
      ref={wrapperRef}
      style={wrapper}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <img src={fixedSrc} alt={alt} style={img} />
      {showModal && (
        <div style={{ ...modal, ...getModalPosition() }}>
          <img
            src={fixedSrc}
            alt={alt}
            style={{ maxWidth: 180, maxHeight: 180, objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
