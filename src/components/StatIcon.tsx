import type { CSSProperties } from 'react';

const ICON_MAP: Record<string, string> = {
  appeal: '/mg-clawset/icons/Appeal_Icon.png',
  comfort: '/mg-clawset/icons/Comfort_Icon.png',
  stimulation: '/mg-clawset/icons/Stimulation_Icon.png',
  health: '/mg-clawset/icons/Health_Icon.png',
  mutation: '/mg-clawset/icons/Mutation_Icon.png',
};

const LABEL_MAP: Record<string, string> = {
  appeal: 'Appeal',
  comfort: 'Comfort',
  stimulation: 'Stimulation',
  health: 'Health',
  mutation: 'Mutation',
};

interface Props {
  stat: string;
  size?: number;
}

export default function StatIcon({ stat, size = 16 }: Props) {
  const src = ICON_MAP[stat];
  if (!src) return <span>{stat}</span>;

  const style: CSSProperties = {
    width: size,
    height: size,
    objectFit: 'contain',
    /* Black PNGs: invert in dark mode via a CSS class */
    filter: 'var(--icon-invert, none)',
  };

  return <img src={src} alt={LABEL_MAP[stat] ?? stat} title={LABEL_MAP[stat] ?? stat} style={style} draggable={false} />;
}
