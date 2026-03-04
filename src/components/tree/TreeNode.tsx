'use client';

import { getTreeRole } from '@/lib/utils/relationship';
import type { Person } from '@/lib/types/person';

export const NODE_SCALE = 1.8;
const ELLIPSE_RX = 1.7;
const ELLIPSE_RY = 2.2;
const ELLIPSE_CY = -0.45;
const ELLIPSE = { cx: 0, cy: ELLIPSE_CY, rx: ELLIPSE_RX, ry: ELLIPSE_RY };
const OVAL_TOP = ELLIPSE_CY - ELLIPSE_RY;
const OVAL_BOTTOM = ELLIPSE_CY + ELLIPSE_RY;
const PLAQUE_OVERLAP = 0.2;
const PLAQUE_Y = OVAL_BOTTOM - PLAQUE_OVERLAP;
const PLAQUE_PADDING_TOP = 0.12;
const PLAQUE_PADDING_SIDE = 0.4;
const LINE_GAP = 0.08; // отступ между строками
const PLAQUE_HEIGHT = 2.0;
export const PLAQUE_BOTTOM_OFFSET = PLAQUE_Y + PLAQUE_HEIGHT;
export const OVAL_TOP_OFFSET = OVAL_TOP;
const PLAQUE_RX = 0.22;
const CHAR_WIDTH = 0.38;
const MIN_PLAQUE_WIDTH = 2.8;
const MAX_NAME_LEN = 22;
const MAX_YEARS_LEN = 24;

function plaqueWidth(texts: string[]): number {
  const maxLen = Math.max(0, ...texts.map((t) => t.length));
  return Math.max(MIN_PLAQUE_WIDTH, maxLen * CHAR_WIDTH + 0.6);
}

export interface TreeNodeProps {
  person: Person | null;
  x: number;
  y: number;
  scale: number;
  level: number;
  index: number;
  siblings?: Person[];
  onPersonClick: (personId: string) => void;
  onSiblingsBadgeClick?: (siblings: Person[], e: React.MouseEvent) => void;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

const FONT_ROLE = 0.42;
const FONT_NAME = 0.56;
const FONT_YEARS = 0.4;

export function TreeNode({
  person,
  x,
  y,
  scale,
  level,
  index,
  siblings = [],
  onPersonClick,
  onSiblingsBadgeClick,
}: TreeNodeProps) {
  const hasPerson = !!person;
  const personId = person?.id ?? `empty-${x}-${y}`;
  const role = getTreeRole(level, index, person);
  const displayName = truncate(person?.name ?? 'неизв.', MAX_NAME_LEN);
  const displayYears = person?.birthYears
    ? truncate(person.birthYears, MAX_YEARS_LEN)
    : '';

  const pW = plaqueWidth([role, displayName, displayYears].filter(Boolean)) + PLAQUE_PADDING_SIDE;
  const plaqueX = -pW / 2;
  const showBadge = siblings.length > 0 && onSiblingsBadgeClick;

  const yRole = role ? PLAQUE_Y + PLAQUE_PADDING_TOP + FONT_ROLE : 0;
  const yName = role
    ? yRole + FONT_ROLE + LINE_GAP + FONT_NAME
    : PLAQUE_Y + PLAQUE_PADDING_TOP + FONT_NAME;
  const yYears = displayYears ? yName + FONT_NAME + LINE_GAP + FONT_YEARS : 0;

  const effectiveScale = scale * NODE_SCALE;

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSiblingsBadgeClick?.(siblings, e);
  };

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
          x={plaqueX - 0.2}
          y={OVAL_TOP - 0.1}
          width={pW + 0.4}
          height={PLAQUE_BOTTOM_OFFSET - OVAL_TOP + 0.3}
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
            x={-ELLIPSE_RX}
            y={OVAL_TOP}
            width={ELLIPSE_RX * 2}
            height={ELLIPSE_RY * 2}
            preserveAspectRatio="xMidYMid slice"
          />
        </g>
      ) : (
        <ellipse
          {...ELLIPSE}
          fill="var(--paper)"
          stroke="var(--tree-stroke)"
          strokeWidth="0.1"
        />
      )}
      <rect
        x={plaqueX}
        y={PLAQUE_Y}
        width={pW}
        height={PLAQUE_HEIGHT}
        rx={PLAQUE_RX}
        fill="var(--tree-plaque-fill)"
        stroke="var(--tree-plaque-stroke)"
        strokeWidth="0.1"
      />
      {role && (
        <text
          x="0"
          y={yRole}
          textAnchor="middle"
          fontSize={FONT_ROLE}
          fill="var(--tree-stroke)"
        >
          {role}
        </text>
      )}
      <text
        x="0"
        y={yName}
        textAnchor="middle"
        fontSize={FONT_NAME}
        fill="var(--ink)"
        fontWeight="600"
      >
        {displayName}
      </text>
      {displayYears && (
        <text
          x="0"
          y={yYears}
          textAnchor="middle"
          fontSize={FONT_YEARS}
          fill="var(--tree-stroke)"
        >
          {displayYears}
        </text>
      )}
      {showBadge && (
        <g
          onClick={handleBadgeClick}
          style={{ cursor: 'pointer', pointerEvents: 'all' }}
          className="hover:opacity-80"
        >
          <rect
            x={plaqueX + pW - 0.75}
            y={PLAQUE_Y + 0.1}
            width="0.65"
            height="0.5"
            rx="0.12"
            fill="var(--accent)"
          />
          <text
            x={plaqueX + pW - 0.42}
            y={PLAQUE_Y + 0.42}
            textAnchor="middle"
            fontSize="0.32"
            fill="var(--nav-btn-ink)"
          >
            +{siblings.length}
          </text>
        </g>
      )}
    </g>
  );
}
