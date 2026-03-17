import type { CSSProperties, ReactNode } from 'react';

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    padding: 16,
    gap: 0,
  },
};

interface Props {
  children: ReactNode;
}

export default function SplitScreenContainer({ children }: Props) {
  return <div style={styles.container}>{children}</div>;
}
