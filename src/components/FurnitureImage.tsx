import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import type { FurnitureItem } from '../types/furniture';

interface Props {
  src: string;
  alt: string;
  compact?: boolean;
  draggableItem?: FurnitureItem;
}

export default function FurnitureImage({ src, alt, compact, draggableItem }: Props) {
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

  const handleDragStart = useCallback((e: DragEvent) => {
    if (!draggableItem) return;
    e.dataTransfer.setData('application/json', JSON.stringify(draggableItem));
    e.dataTransfer.effectAllowed = 'copy';
    window.dispatchEvent(new CustomEvent('furniture-drag-start', { detail: draggableItem }));
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowModal(false);
  }, [draggableItem]);

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
    cursor: draggableItem ? 'grab' : compact ? 'default' : 'pointer',
  };

  const img: CSSProperties = {
    maxWidth: imgSize,
    maxHeight: imgSize,
    objectFit: 'contain',
    pointerEvents: 'none',
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
      draggable={!!draggableItem}
      onDragStart={handleDragStart}
    >
      <img src={fixedSrc} alt={alt} style={img} draggable={false} />
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
