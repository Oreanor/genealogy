interface BookSpreadProps {
  left: React.ReactNode;
  right: React.ReactNode;
  fullWidth?: React.ReactNode;
}

export function BookSpread({ left, right, fullWidth }: BookSpreadProps) {
  if (fullWidth) {
    return (
      <div className="flex h-[94vh] min-h-[500px] md:min-h-[560px] w-full overflow-hidden rounded-lg shadow-xl">
        <div className="min-w-0 flex-1 overflow-hidden">{fullWidth}</div>
      </div>
    );
  }
  return (
    <div className="flex h-[94vh] min-h-[500px] md:min-h-[560px] w-full overflow-hidden rounded-lg shadow-xl">
      <div className="min-w-0 flex-1 border-r border-amber-200/50">{left}</div>
      <div className="min-w-0 flex-1">{right}</div>
    </div>
  );
}
