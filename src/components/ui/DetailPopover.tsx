import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
export function DetailPopover({
  label,
  className,
  style,
  children,
  details,
}: {
  label: string;
  className: string;
  style?: React.CSSProperties;
  children: ReactNode;
  details: ReactNode;
}) {
  const [mode, setMode] = useState<'closed' | 'hover' | 'pinned'>('closed');
  const [position, setPosition] = useState({ left: 12, top: 12 });
  const button = useRef<HTMLButtonElement>(null),
    popup = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef({ x: 0, y: 0 }),
    held = useRef(false);
  const id = useId();
  useEffect(() => {
    if (mode === 'closed') return;
    function close() {
      setMode('closed');
    }
    function outside(e: PointerEvent) {
      if (
        !button.current?.contains(e.target as Node) &&
        !popup.current?.contains(e.target as Node)
      )
        close();
    }
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    const b = button.current?.getBoundingClientRect(),
      p = popup.current?.getBoundingClientRect();
    if (b && p)
      setPosition({
        left: Math.max(12, Math.min(b.left, innerWidth - p.width - 12)),
        top: Math.max(12, Math.min(b.bottom + 10, innerHeight - p.height - 12)),
      });
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    const dismiss = setTimeout(close, mode === 'pinned' ? 10000 : 60000);
    return () => {
      clearTimeout(dismiss);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [mode]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const cancelHold = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  return (
    <>
      <button
        ref={button}
        type="button"
        className={className}
        style={style}
        aria-label={label}
        aria-expanded={mode !== 'closed'}
        aria-describedby={mode === 'closed' ? undefined : id}
        onMouseEnter={() => setMode((m) => (m === 'pinned' ? m : 'hover'))}
        onMouseLeave={() => setMode((m) => (m === 'pinned' ? m : 'closed'))}
        onFocus={(e) => {
          if (e.currentTarget.matches(':focus-visible')) setMode('hover');
        }}
        onBlur={() => setMode((m) => (m === 'pinned' ? m : 'closed'))}
        onClick={() => {
          if (held.current) {
            held.current = false;
            return;
          }
          setMode((m) => (m === 'pinned' ? 'closed' : 'pinned'));
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return;
          origin.current = { x: e.clientX, y: e.clientY };
          held.current = false;
          timer.current = setTimeout(() => {
            held.current = true;
            setMode('pinned');
          }, 450);
        }}
        onPointerMove={(e) => {
          if (
            Math.hypot(
              e.clientX - origin.current.x,
              e.clientY - origin.current.y,
            ) > 10
          )
            cancelHold();
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
      >
        {children}
      </button>
      {mode !== 'closed' && (
        <div
          ref={popup}
          id={id}
          className="detail-popup"
          role="tooltip"
          style={position}
        >
          {details}
        </div>
      )}
    </>
  );
}
