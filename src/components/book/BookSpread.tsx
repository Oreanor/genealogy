interface BookSpreadProps {
  /** Left and right pages. Omit if fullWidth is set. */
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Full width (single page, e.g. tree). */
  fullWidth?: React.ReactNode;
  /** Use 3×A5 width (444×210 mm) instead of 2×A5. For tree section. */
  wide?: boolean;
}

/** 2×A5: 296×210 mm. */
const spreadClass2 =
  'flex w-full min-w-0 max-h-[calc(100vh-4rem)] max-w-[calc((100vh-6rem)*296/210)] aspect-[296/210] min-h-[320px] overflow-hidden rounded-lg shadow-xl';
/** 3×A5: 444×210 mm. */
const spreadClassWide =
  'flex w-full min-w-0 max-h-[calc(100vh-4rem)] max-w-[calc((100vh-6rem)*444/210)] aspect-[444/210] min-h-[320px] overflow-hidden rounded-lg shadow-xl';

export function BookSpread({ left, right, fullWidth, wide }: BookSpreadProps) {
  const spreadClass = wide ? spreadClassWide : spreadClass2;
  if (fullWidth) {
    return (
      <div className={spreadClass}>
        <div className="min-w-0 flex-1 overflow-hidden">{fullWidth}</div>
      </div>
    );
  }
  return (
    <div className={spreadClass}>
      <div className="min-w-0 flex-1 border-r border-[var(--border-subtle)]">{left}</div>
      <div className="min-w-0 flex-1">{right}</div>
    </div>
  );
}
