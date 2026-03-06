import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import type { Person } from '@/lib/types/person';
import { buildTreeMatrix } from '@/lib/utils/tree';
import { getRootPersonId } from '@/lib/data/root';
import { formatLifeDates } from '@/lib/utils/person';
import { getSiblings, getCousins } from '@/lib/data/familyRelations';
import { getTreeRoleKey } from '@/lib/utils/relationship';
import { getAvatarForPerson } from '@/lib/data/photos';
import { s, A4_LANDSCAPE_PT, COLORS } from './styles';

const PAD = 24;
const TITLE_H = 28;
const W = A4_LANDSCAPE_PT.width - PAD * 2;
const H = A4_LANDSCAPE_PT.height - PAD * 2 - TITLE_H;

const NODE_W = 72;
const OVAL_W = 46;
const OVAL_H = 54;

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 100;
const TREE_TOP_OFFSET = 2;

function getNodePosition(level: number, index: number, totalLevels: number) {
  const count = Math.pow(2, level);
  const x = ((2 * index + 1) / (2 * count)) * VIEW_WIDTH;
  const rowHeight = VIEW_HEIGHT / (totalLevels + 0.35);
  const y = VIEW_HEIGHT - (level + 0.7) * rowHeight - TREE_TOP_OFFSET;
  return { xPct: x / VIEW_WIDTH, yPct: y / VIEW_HEIGHT };
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

interface TreeLabels {
  chapterTree: string;
  roleLabels: Record<string, string>;
}

export function TreePage({ labels }: { labels: TreeLabels }) {
  const matrix = buildTreeMatrix(getRootPersonId());
  const totalLevels = matrix.length;

  const treeIds = new Set(matrix.flat().filter(Boolean).map((p) => p!.id));
  const siblingsCount = new Map<string, number>();
  for (const row of matrix) {
    for (const person of row) {
      if (!person) continue;
      const sibs = getSiblings(person.id);
      const cousins = getCousins(person.id);
      const all = [...sibs, ...cousins].filter((p) => !treeIds.has(p.id));
      const unique = new Set(all.map((p) => p.id)).size;
      if (unique > 0) siblingsCount.set(person.id, unique);
    }
  }

  const nodes: { person: Person | null; level: number; index: number; xPt: number; yPt: number }[] = [];
  for (let level = 0; level < totalLevels; level++) {
    const row = matrix[level]!;
    for (let index = 0; index < row.length; index++) {
      const pos = getNodePosition(level, index, totalLevels);
      nodes.push({
        person: row[index] ?? null,
        level,
        index,
        xPt: PAD + pos.xPct * W,
        yPt: PAD + pos.yPct * H,
      });
    }
  }

  return (
    <Page size={[A4_LANDSCAPE_PT.width, A4_LANDSCAPE_PT.height]} style={s.pageA4L} wrap={false}>
      <Text style={[s.chapterTitle, { marginBottom: -96 }]}>{labels.chapterTree}</Text>

      <View style={{ position: 'relative', width: W, height: H }}>
        {nodes.map((node) => {
          const { person, level, index, xPt, yPt } = node;
          if (!person) return null;

          const roleKey = getTreeRoleKey(level, index, person);
          const roleLabel = roleKey ? (labels.roleLabels[roleKey] ?? '') : '';
          const avatar = getAvatarForPerson(person.id, person.avatarPhotoSrc);
          const sibCount = siblingsCount.get(person.id) ?? 0;

          return (
            <View
              key={`node-${level}-${index}`}
              style={{
                position: 'absolute',
                left: xPt - PAD - NODE_W / 2,
                top: yPt - PAD,
                width: NODE_W,
                alignItems: 'center',
              }}
            >
              {/* Oval with avatar */}
              <View
                style={{
                  width: OVAL_W,
                  height: OVAL_H,
                  borderRadius: OVAL_W / 2,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.white,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {avatar && (
                  <Image
                    src={avatar.src}
                    style={{ width: OVAL_W, height: OVAL_H, objectFit: 'cover' }}
                  />
                )}
              </View>
              {sibCount > 0 && (
                <Text
                  style={{
                    position: 'absolute',
                    right: (NODE_W - OVAL_W) / 2 - 4,
                    top: -3,
                    fontSize: 7,
                    fontWeight: 700,
                    backgroundColor: COLORS.accent,
                    color: COLORS.white,
                    borderRadius: 6,
                    paddingHorizontal: 2,
                    paddingVertical: 1,
                  }}
                >
                  +{sibCount}
                </Text>
              )}
              {/* Name plaque */}
              <View style={{ marginTop: 2, alignItems: 'center', maxWidth: NODE_W }}>
                {roleLabel ? (
                  <Text style={{ fontSize: 6, color: COLORS.inkMuted, textAlign: 'center' }}>
                    {roleLabel}
                  </Text>
                ) : null}
                <Text style={{ fontSize: 7, fontWeight: 700, textAlign: 'center' }}>
                  {truncate(person.lastName ?? '', 18)}
                </Text>
                <Text style={{ fontSize: 6.5, textAlign: 'center' }}>
                  {truncate(`${person.firstName ?? ''} ${person.patronymic ?? ''}`.trim(), 22)}
                </Text>
                {(person.birthDate || person.deathDate) && (
                  <Text style={{ fontSize: 5.5, color: COLORS.inkMuted, textAlign: 'center' }}>
                    {truncate(formatLifeDates(person.birthDate, person.deathDate), 24)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Text style={s.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
    </Page>
  );
}
