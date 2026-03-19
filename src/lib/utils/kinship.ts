import type { Gender } from '@/lib/types/person';
import { getPersons, getPersonById } from '@/lib/data/persons';
import { getSpouse } from '@/lib/data/familyRelations';

export type EdgeKind = 'parent' | 'child' | 'spouse';
interface Edge { to: string; kind: EdgeKind }

function buildGraph(): Map<string, Edge[]> {
  const g = new Map<string, Edge[]>();
  const add = (from: string, to: string, kind: EdgeKind) => {
    let list = g.get(from);
    if (!list) { list = []; g.set(from, list); }
    if (!list.some((e) => e.to === to && e.kind === kind)) list.push({ to, kind });
  };

  for (const p of getPersons()) {
    if (p.fatherId) {
      add(p.id, p.fatherId, 'parent');
      add(p.fatherId, p.id, 'child');
    }
    if (p.motherId) {
      add(p.id, p.motherId, 'parent');
      add(p.motherId, p.id, 'child');
    }
    const spouse = getSpouse(p.id);
    if (spouse) {
      add(p.id, spouse.id, 'spouse');
      add(spouse.id, p.id, 'spouse');
    }
  }
  return g;
}

/** BFS shortest path returning sequence of edge kinds. */
function findPath(idA: string, idB: string): { ids: string[]; kinds: EdgeKind[] } | null {
  if (idA === idB) return { ids: [idA], kinds: [] };
  const graph = buildGraph();
  const visited = new Set<string>([idA]);
  const queue: { id: string; path: string[]; kinds: EdgeKind[] }[] = [{ id: idA, path: [idA], kinds: [] }];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const edge of graph.get(cur.id) ?? []) {
      if (visited.has(edge.to)) continue;
      const newPath = [...cur.path, edge.to];
      const newKinds = [...cur.kinds, edge.kind];
      if (edge.to === idB) return { ids: newPath, kinds: newKinds };
      visited.add(edge.to);
      queue.push({ id: edge.to, path: newPath, kinds: newKinds });
    }
  }
  return null;
}

/**
 * Count consecutive 'parent' steps from start, then consecutive 'child' steps.
 * Returns null if path doesn't fit the up-then-down pattern (ignoring leading/trailing spouse).
 */
function analyzeBloodPath(kinds: EdgeKind[]): { up: number; down: number } | null {
  let i = 0;
  let up = 0;
  let down = 0;
  while (i < kinds.length && kinds[i] === 'parent') { up++; i++; }
  while (i < kinds.length && kinds[i] === 'child') { down++; i++; }
  if (i !== kinds.length) return null;
  return { up, down };
}

/**
 * Strip one leading or trailing 'spouse' edge, returning the inner blood path
 * and which side the spouse was on ('a' = person A is the spouse, 'b' = person B).
 */
function stripSpouse(kinds: EdgeKind[]): { inner: EdgeKind[]; side: 'a' | 'b' | null } {
  if (kinds.length > 0 && kinds[0] === 'spouse') {
    return { inner: kinds.slice(1), side: 'a' };
  }
  if (kinds.length > 0 && kinds.at(-1) === 'spouse') {
    return { inner: kinds.slice(0, -1), side: 'b' };
  }
  return { inner: kinds, side: null };
}

function bloodKey(up: number, down: number, genderB: Gender | undefined): string | null {
  if (up === 0 && down === 0) return 'kinSelf';

  // Direct ancestors (path goes UP from A to B)
  if (up === 1 && down === 0) return genderB === 'f' ? 'kinMother' : 'kinFather';
  if (up === 2 && down === 0) return genderB === 'f' ? 'kinGrandmother' : 'kinGrandfather';
  if (up === 3 && down === 0) return genderB === 'f' ? 'kinGreatGrandmother' : 'kinGreatGrandfather';
  if (up >= 4 && down === 0) return genderB === 'f' ? 'kinAncestorF' : 'kinAncestorM';

  // Direct descendants (path goes DOWN from A to B)
  if (up === 0 && down === 1) return genderB === 'f' ? 'kinDaughter' : 'kinSon';
  if (up === 0 && down === 2) return genderB === 'f' ? 'kinGranddaughter' : 'kinGrandson';
  if (up === 0 && down === 3) return genderB === 'f' ? 'kinGreatGranddaughter' : 'kinGreatGrandson';
  if (up === 0 && down >= 4) return genderB === 'f' ? 'kinDescendantF' : 'kinDescendantM';

  // Siblings
  if (up === 1 && down === 1) return genderB === 'f' ? 'kinSister' : 'kinBrother';

  // Uncle/aunt = parent's sibling (up 2 to grandparent, down 1)
  if (up === 2 && down === 1) return genderB === 'f' ? 'kinAunt' : 'kinUncle';
  // Nephew/niece = sibling's child (up 1, down 2)
  if (up === 1 && down === 2) return genderB === 'f' ? 'kinNiece' : 'kinNephew';

  // First cousins
  if (up === 2 && down === 2) return genderB === 'f' ? 'kinCousinF' : 'kinCousinM';

  // Great-uncle/aunt = grandparent's sibling (up 3, down 1)
  if (up === 3 && down === 1) return genderB === 'f' ? 'kinGreatAunt' : 'kinGreatUncle';
  // Grand-nephew/niece = sibling's grandchild (up 1, down 3)
  if (up === 1 && down === 3) return genderB === 'f' ? 'kinGreatNiece' : 'kinGreatNephew';

  // Parent's first cousin (up 3, down 2) — двоюродный дядя/тётя
  if (up === 3 && down === 2) return genderB === 'f' ? 'kinSecondAunt' : 'kinSecondUncle';
  // First cousin's child (up 2, down 3) — двоюродный племянник/племянница
  if (up === 2 && down === 3) return genderB === 'f' ? 'kinSecondNiece' : 'kinSecondNephew';

  // Second cousins
  if (up === 3 && down === 3) return genderB === 'f' ? 'kinSecondCousinF' : 'kinSecondCousinM';

  return 'kinDistantRelative';
}

/**
 * In-law key: given blood relationship key and which person is the spouse link,
 * return the specific in-law key if one exists.
 *
 * side='a' means: A is spouse of someone, so "B is [blood] to A's spouse" → in-law from A's perspective.
 * side='b' means: B is spouse of someone, so "B's spouse is [blood] to A" → B is in-law.
 */
function inLawKey(bKey: string, side: 'a' | 'b', genderA: Gender | undefined, genderB: Gender | undefined): string | null {
  if (side === 'a') {
    if (bKey === 'kinFather' || bKey === 'kinMother') {
      return genderA === 'f'
        ? (genderB === 'f' ? 'kinMotherInLawF' : 'kinFatherInLawF')
        : (genderB === 'f' ? 'kinMotherInLawM' : 'kinFatherInLawM');
    }
    if (bKey === 'kinBrother') return genderA === 'f' ? 'kinBrotherInLawF' : 'kinBrotherInLawM';
    if (bKey === 'kinSister') return genderA === 'f' ? 'kinSisterInLawF' : 'kinSisterInLawM';
  }
  if (side === 'b') {
    if (bKey === 'kinSon' || bKey === 'kinDaughter') {
      return genderB === 'f' ? 'kinDaughterInLaw' : 'kinSonInLaw';
    }
    if (bKey === 'kinBrother' || bKey === 'kinSister') {
      return genderB === 'f' ? 'kinSisterInLawSpouse' : 'kinBrotherInLawSpouse';
    }
  }
  return null;
}

export interface KinshipResult {
  key: string;
  path: string[];
  edgeKinds: EdgeKind[];
}

/**
 * Compute the kinship i18n key describing who person B is to person A.
 * Returns null if no connection found.
 */
export function getKinship(idA: string, idB: string): KinshipResult | null {
  if (idA === idB) return { key: 'kinSelf', path: [idA], edgeKinds: [] };

  const result = findPath(idA, idB);
  if (!result) return null;

  const personB = getPersonById(idB);
  const personA = getPersonById(idA);
  const gA = personA?.gender;
  const gB = personB?.gender;
  const ek = result.kinds;

  if (ek.length === 1 && ek[0] === 'spouse') {
    return { key: gB === 'f' ? 'kinWife' : 'kinHusband', path: result.ids, edgeKinds: ek };
  }

  const blood = analyzeBloodPath(ek);
  if (blood) {
    const key = bloodKey(blood.up, blood.down, gB);
    if (key) return { key, path: result.ids, edgeKinds: ek };
  }

  const { inner, side } = stripSpouse(ek);
  if (side) {
    const innerBlood = analyzeBloodPath(inner);
    if (innerBlood) {
      const innerGenderB = side === 'b'
        ? getPersonById(result.ids.at(-2)!)?.gender
        : gB;
      const bk = bloodKey(innerBlood.up, innerBlood.down, innerGenderB);
      if (bk) {
        const ilk = inLawKey(bk, side, gA, gB);
        if (ilk) return { key: ilk, path: result.ids, edgeKinds: ek };
        return { key: 'kinInLaw', path: result.ids, edgeKinds: ek };
      }
    }
  }

  return { key: 'kinDistantRelative', path: result.ids, edgeKinds: ek };
}
