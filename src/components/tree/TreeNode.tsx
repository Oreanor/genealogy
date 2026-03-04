import type { Person } from '@/lib/types/person';

const NODE_SCALE = 1.8;
const ELLIPSE = { cx: 0, cy: -0.45, rx: 0.85, ry: 1.1 };
const PLAQUE = { x: -1.15, y: 0.4, width: 2.3, height: 1.15, rx: 0.18 };
const MAX_NAME_LEN = 18;
const MAX_YEARS_LEN = 20;

export interface TreeNodeProps {
  person: Person | null;
  x: number;
  y: number;
  scale: number;
  onPersonClick: (personId: string) => void;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

export function TreeNode({ person, x, y, scale, onPersonClick }: TreeNodeProps) {
  const hasPerson = !!person;
  const personId = person?.id ?? `empty-${x}-${y}`;
  const displayName = truncate(person?.name ?? 'неизв.', MAX_NAME_LEN);
  const displayYears = person?.birthYears
    ? truncate(person.birthYears, MAX_YEARS_LEN)
    : '';

  const effectiveScale = scale * NODE_SCALE;

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${effectiveScale})`}
      className={hasPerson ? 'cursor-pointer transition-opacity hover:opacity-80' : ''}
      style={{
        cursor: hasPerson ? 'pointer' : 'default',
        pointerEvents: hasPerson ? 'all' : 'none',
      }}
      onClick={() => hasPerson && onPersonClick(person!.id)}
      role={hasPerson ? 'button' : undefined}
      tabIndex={hasPerson ? 0 : undefined}
      onKeyDown={(e) => {
        if (hasPerson && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPersonClick(person!.id);
        }
      }}
    >
      {hasPerson && (
        <rect
          x="-1.2"
          y="-1.6"
          width="2.4"
          height="2.8"
          fill="transparent"
          aria-hidden
        />
      )}
      <defs>
        <clipPath id={`oval-${personId}`}>
          <ellipse {...ELLIPSE} />
        </clipPath>
      </defs>
      {hasPerson && person.photoUrl ? (
        <g clipPath={`url(#oval-${personId})`}>
          <image
            href={person.photoUrl}
            x="-0.85"
            y="-1.55"
            width="1.7"
            height="2.2"
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      ) : (
        <ellipse
          {...ELLIPSE}
          fill="#fef9c3"
          stroke="#78716c"
          strokeWidth="0.1"
        />
      )}
      <rect
        x={PLAQUE.x}
        y={PLAQUE.y}
        width={PLAQUE.width}
        height={PLAQUE.height}
        rx={PLAQUE.rx}
        fill="#fef3c7"
        stroke="#b45309"
        strokeWidth="0.1"
      />
      <text x="0" y="0.78" textAnchor="middle" fontSize="0.34" fill="#1c1917" fontWeight="600">
        {displayName}
      </text>
      {displayYears && (
        <text x="0" y="1.05" textAnchor="middle" fontSize="0.26" fill="#78716c">
          {displayYears}
        </text>
      )}
    </g>
  );
}
