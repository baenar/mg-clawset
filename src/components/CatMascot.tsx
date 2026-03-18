import { useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';

const wrapperStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gridRow: '1 / 3',
  gridColumn: '1 / 3',
};

const catStyle: CSSProperties = {
  width: 56,
  height: 56,
  flexShrink: 0,
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
};

const bubbleBase: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 6,
  padding: '10px 14px',
  borderRadius: '4px 12px 12px 12px',
  background: '#2f303a',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: "'Rubik', system-ui, sans-serif",
  lineHeight: 1.45,
  width: 240,
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  zIndex: 50,
  cursor: 'pointer',
};

const bubbleHidden: CSSProperties = {
  ...bubbleBase,
  opacity: 0,
  transform: 'translateY(-8px) scale(0.95)',
  transition: 'opacity 0.3s, transform 0.3s',
  pointerEvents: 'none',
};

const bubbleVisible: CSSProperties = {
  ...bubbleBase,
  opacity: 1,
  transform: 'translateY(0) scale(1)',
  transition: 'opacity 0.4s 0.5s, transform 0.4s 0.5s',
};

function detectAdblock(): Promise<boolean> {
  return new Promise((resolve) => {
    const testUrl = 'https://gc.zgo.at/count.js';
    fetch(testUrl, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        const scripts = document.querySelectorAll('script[data-goatcounter]');
        if (scripts.length === 0) {
          resolve(true);
          return;
        }
        setTimeout(() => {
          if (typeof (window as unknown as Record<string, unknown>).goatcounter === 'undefined') {
            resolve(true);
          } else {
            resolve(false);
          }
        }, 2000);
      })
      .catch(() => resolve(true));
  });
}

interface Props {
  compact?: boolean;
}

export default function CatMascot({ compact }: Props) {
  const [showBubble, setShowBubble] = useState(false);
  const [adblockDetected, setAdblockDetected] = useState(false);

  useEffect(() => {
    detectAdblock().then((blocked) => {
      if (blocked) {
        setAdblockDetected(true);
        setShowBubble(true);
      }
    });
  }, []);

  const dismiss = useCallback(() => {
    setShowBubble(false);
  }, []);

  useEffect(() => {
    if (!showBubble) return;
    const handler = () => setShowBubble(false);
    const id = setTimeout(() => {
      window.addEventListener('click', handler, { once: true });
    }, 100);
    return () => {
      clearTimeout(id);
      window.removeEventListener('click', handler);
    };
  }, [showBubble]);

  return (
    <div style={{
      ...wrapperStyle,
      marginLeft: compact ? -10 : 0,
    }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        style={catStyle}
      >
        <polygon points="15,20 85,20 75,0 25,0" fill="#C28F5A" />
        <polygon points="15,20 85,20 85,50 15,50" fill="#8C6239" />
        <polygon points="35,43 65,43 50,60" fill="#5D4037" />
        <polygon points="30,10 42,25 25,30" fill="#6D4C41" />
        <polygon points="70,10 58,25 75,30" fill="#6D4C41" />
        <polygon points="32,15 40,24 29,26" fill="#A1887F" />
        <polygon points="68,15 60,24 71,26" fill="#A1887F" />
        <polygon points="42,25 58,25 50,38" fill="#8D6E63" />
        <polygon points="46,25 50,32 54,25 50,29" fill="#3E2723" />
        <polygon points="25,80 42,75 50,43 20,40" fill="#6D4C41" />
        <polygon points="25,30 42,25 35,43 20,40" fill="#6D4C41" />
        <polygon points="75,80 58,75 50,43 80,40" fill="#6D4C41" />
        <polygon points="75,30 58,25 65,43 80,40" fill="#6D4C41" />
        <polygon points="42,25 50,38 35,43" fill="#8D6E63" />
        <polygon points="42,25 60,48 35,43" fill="#8D6E63" />
        <polygon points="58,25 50,38 65,43" fill="#8D6E63" />
        <polygon points="58,25 50,48 65,43" fill="#8D6E63" />
        <polygon points="22,38 35,41 25,43" fill="#3E2723" />
        <polygon points="78,38 65,41 75,43" fill="#3E2723" />
        <polygon points="47,38 53,38 50,41" fill="#6D4C41" />
        <polygon points="35,43 50,41 50,50 40,53" fill="#D7CCC8" />
        <polygon points="65,43 50,41 50,50 60,53" fill="#D7CCC8" />
        <polygon points="48,41 52,41 50,45" fill="#E08283" />
        <polygon points="33,34 43,34 38,39" fill="#6B8E23" />
        <polygon points="67,34 57,34 62,39" fill="#6B8E23" />
        <polygon points="37,34 39,34 38,39" fill="#1A1A1A" />
        <polygon points="63,34 61,34 62,39" fill="#1A1A1A" />
        <polygon points="15,50 15,20 3,10 3,40" fill="#E6B981" />
        <polygon points="85,50 85,20 97,10 97,40" fill="#E6B981" />
        <polygon points="15,50 85,50 85,85 15,85" fill="#D4A373" />
        <polygon points="15,50 85,50 75,73 25,73" fill="#C28F5A" />
        <polygon points="28,47 42,47 35,60" fill="#6D4C41" />
        <polygon points="31,51 39,51 35,56" fill="#3E2723" />
        <polygon points="72,47 58,47 65,60" fill="#6D4C41" />
        <polygon points="69,51 61,51 65,56" fill="#3E2723" />
      </svg>

      {adblockDetected && (
        <div
          style={showBubble ? bubbleVisible : bubbleHidden}
          onClick={dismiss}
        >
          Psst! Adblocker spotted — no ads here though! It just blocks our analytics. Mind whitelisting us? 🐾
          <div style={{ fontSize: 11, color: 'var(--text-m)', marginTop: 4 }}>
            click to dismiss
          </div>
        </div>
      )}
    </div>
  );
}
