import {useState, useCallback, useRef, useEffect} from 'react';
import type {CSSProperties} from 'react';
import type {Filters} from '../types/furniture';

const CELL_COLORS: Record<number, string> = {
    1: 'transparent',
    2: 'var(--lavender-grey)',
    3: 'var(--blushed-brick)',
    4: 'var(--sand-dune)',
    5: 'var(--charcoal)',
};

const CELL_BORDERS: Record<number, string> = {
    1: 'var(--border)',
    2: 'rgba(132,143,165,0.5)',
    3: 'rgba(193,73,83,0.5)',
    4: 'rgba(229,220,197,0.5)',
    5: 'rgba(76,76,71,0.5)',
};

const CELL_TYPES = [
    {type: null as number | null, label: 'Any'},
    {type: 1, label: 'Empty'},
    {type: 2, label: 'Solid'},
    {type: 3, label: 'Anchor Pt'},
    {type: 5, label: 'Background'},
];

const headerBtn: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    padding: '8px 0',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
};

const dimInput: CSSProperties = {
    width: 48,
    height: 30,
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--social-bg)',
    color: 'var(--text-h)',
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'inherit',
};

function ButtonToggle<T extends string>({options, value, onChange}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div style={{display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)'}}>
            {options.map((opt, i) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    style={{
                        padding: '5px 12px',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        border: 'none',
                        borderRight: i < options.length - 1 ? '1px solid var(--border)' : 'none',
                        background: value === opt.value ? 'var(--accent)' : 'var(--social-bg)',
                        color: value === opt.value ? '#fff' : 'var(--text)',
                        fontWeight: value === opt.value ? 600 : 400,
                    }}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

interface Props {
    filters: Filters;
    onFiltersChange: (f: Filters) => void;
    statsPerSpace: boolean;
    onStatsPerSpaceChange: (v: boolean) => void;
    compact?: boolean;
    isMobile?: boolean;
}

export default function AdvancedFilters({
                                            filters,
                                            onFiltersChange,
                                            statsPerSpace,
                                            onStatsPerSpaceChange,
                                            compact,
                                            isMobile
                                        }: Props) {
    const [open, setOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<number | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);

    useEffect(() => {
        if (open && contentRef.current) {
            const observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setContentHeight(entry.contentRect.height);
                }
            });
            observer.observe(contentRef.current);
            setContentHeight(contentRef.current.scrollHeight);
            return () => observer.disconnect();
        } else {
            setContentHeight(0);
        }
    }, [open]);

    const update = useCallback((partial: Partial<Filters>) => {
        onFiltersChange({...filters, ...partial});
    }, [filters, onFiltersChange]);

    const w = filters.shapeWidth;
    const h = filters.shapeHeight;
    const shape = filters.exactShape;

    const setDimensions = useCallback((newW: number | null, newH: number | null) => {
        let newShape: (number | null)[][] | null = null;
        if (newW !== null && newH !== null && newW > 0 && newH > 0) {
            newShape = Array.from({length: newH}, (_, r) =>
                Array.from({length: newW}, (_, c) =>
                    shape && shape[r]?.[c] !== undefined ? shape[r][c] : null
                )
            );
        }
        update({shapeWidth: newW, shapeHeight: newH, exactShape: newShape});
    }, [shape, update]);

    const handleCellClick = useCallback((r: number, c: number) => {
        if (!shape) return;
        const newShape = shape.map(row => [...row]);
        newShape[r][c] = selectedType;
        update({exactShape: newShape});
    }, [shape, selectedType, update]);

    const clearShape = useCallback(() => {
        update({shapeWidth: null, shapeHeight: null, exactShape: null});
    }, [update]);

    const labelS: CSSProperties = {fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap'};

    return (
        <div style={{borderTop: '1px solid var(--border)', padding: '0 12px', overflow: 'hidden'}}>
            <button style={headerBtn} onClick={() => setOpen(!open)}>
        <span style={{
            fontSize: 10,
            display: 'inline-block',
            transition: 'transform 0.3s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>▼</span>
                Advanced filters
            </button>
            <div style={{
                maxHeight: open ? contentHeight + 16 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s ease',
            }}>
                <div ref={contentRef} style={{paddingBottom: 10}}>
                    {(() => {
                        const shapeActive = !!(shape && w && h);
                        const stackBelow = compact && shapeActive && !isMobile;
                        const isStacked = stackBelow || isMobile;

                        const shapeGrid = (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: compact ? 8 : 12,
                                overflow: 'hidden',
                                maxHeight: shapeActive ? 400 : 0,
                                maxWidth: shapeActive ? 600 : 0,
                                opacity: shapeActive ? 1 : 0,
                                transition: 'max-height 0.3s ease, max-width 0.3s ease, opacity 0.25s ease',
                            }}>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateRows: `repeat(${h || 1}, 28px)`,
                                        gridTemplateColumns: `repeat(${w || 1}, 28px)`,
                                        gap: 2,
                                        flexShrink: 0,
                                    }}
                                >
                                    {(shape || []).map((row, r) =>
                                        row.map((cell, c) => {
                                            const bg = cell === null ? 'var(--social-bg)' : CELL_COLORS[cell] || 'var(--social-bg)';
                                            const border = cell === null
                                                ? '1px dashed var(--border)'
                                                : `1px solid ${CELL_BORDERS[cell] || 'var(--border)'}`;
                                            const txt = cell === null ? '?' : CELL_TYPES.find(ct => ct.type === cell)?.label?.[0] || '';

                                            return (
                                                <div
                                                    key={`${r}-${c}`}
                                                    onClick={() => handleCellClick(r, c)}
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        background: bg,
                                                        border,
                                                        borderRadius: 4,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        color: cell === null || cell === 1 || cell === 5 ? 'var(--text)' : '#000',
                                                        userSelect: 'none',
                                                    }}
                                                    title={cell === null ? 'Any' : CELL_TYPES.find(ct => ct.type === cell)?.label || ''}
                                                >
                                                    {txt}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Legend / paint selector */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, auto)',
                                    gap: '4px 6px',
                                    alignItems: 'center',
                                    flexShrink: 0,
                                }}>
                                    {CELL_TYPES.map(({type, label}) => (
                                        <button
                                            key={label}
                                            onClick={() => setSelectedType(type)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 5,
                                                fontSize: 12,
                                                fontFamily: 'inherit',
                                                cursor: 'pointer',
                                                border: selectedType === type ? '2px solid var(--accent)' : '1px solid var(--border)',
                                                background: type === null ? 'var(--social-bg)' : CELL_COLORS[type],
                                                color: type === null || type === 5 || type === 1 ? 'var(--text)' : '#000',
                                                fontWeight: selectedType === type ? 700 : 400,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );

                        const sizeInputs = (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                alignItems: isStacked ? 'center' : 'flex-end',
                                flexShrink: 0
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                                    <span style={labelS}>Size</span>
                                    <input
                                        type="number" min={1} max={9} placeholder="W"
                                        value={w ?? ''} style={dimInput}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? null : Math.max(1, Math.min(16, parseInt(e.target.value) || 1));
                                            setDimensions(val, h);
                                        }}
                                    />
                                    <span style={{color: 'var(--text)', fontSize: 13}}>x</span>
                                    <input
                                        type="number" min={1} max={6} placeholder="H"
                                        value={h ?? ''} style={dimInput}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? null : Math.max(1, Math.min(7, parseInt(e.target.value) || 1));
                                            setDimensions(w, val);
                                        }}
                                    />
                                    <button
                                        onClick={clearShape}
                                        style={{
                                            background: 'none',
                                            border: '1px solid var(--border)',
                                            borderRadius: 6,
                                            color: 'var(--text)',
                                            cursor: 'pointer',
                                            fontSize: 12,
                                            padding: '4px 8px',
                                            fontFamily: 'inherit',
                                            visibility: (w !== null || h !== null) ? 'visible' : 'hidden',
                                        }}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        );

                        const toggles = (
                            <div style={{
                                display: 'flex',
                                flexDirection: isStacked ? 'row' : 'column',
                                gap: 8,
                                flexWrap: 'wrap',
                                justifyContent: isStacked ? 'center' : undefined,
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                    <span style={labelS}>{compact ? '/space' : 'Stats/space'}</span>
                                    <ButtonToggle
                                        options={[{value: 'off', label: 'Off'}, {value: 'on', label: 'On'}]}
                                        value={statsPerSpace ? 'on' : 'off'}
                                        onChange={(v) => onStatsPerSpaceChange(v === 'on')}
                                    />
                                </div>
                                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                    <span style={labelS}>Anchored</span>
                                    <ButtonToggle
                                        options={[
                                            {value: 'any' as const, label: '-'},
                                            {value: 'anchored' as const, label: 'Yes'},
                                            {value: 'not-anchored' as const, label: 'No'},
                                        ]}
                                        value={filters.anchorFilter}
                                        onChange={(v) => update({anchorFilter: v})}
                                    />
                                </div>
                            </div>
                        );

                        if (stackBelow) {
                            return (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 12,
                                }}>
                                    {shapeGrid}
                                    {sizeInputs}
                                    <div style={{
                                        opacity: shapeActive ? 1 : 0,
                                        transition: 'opacity 0.3s ease',
                                    }}>
                                        {toggles}
                                    </div>
                                </div>
                            );
                        }

                        if (isMobile) {
                            return (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    alignItems: 'center',
                                }}>
                                    {shapeGrid}
                                    {sizeInputs}
                                    {toggles}
                                </div>
                            );
                        }

                        return (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto 1fr',
                                alignItems: 'center',
                                gap: 20,
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: compact ? 10 : 16,
                                }}>
                                    {shapeGrid}
                                    {sizeInputs}
                                </div>
                                <div style={{
                                    width: 1,
                                    alignSelf: 'stretch',
                                    minHeight: 40,
                                    background: 'var(--border)',
                                }}/>
                                {toggles}
                            </div>
                        );
                    })()}        </div>
            </div>
        </div>
    );
}
