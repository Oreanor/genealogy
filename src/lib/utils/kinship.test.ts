import { describe, it, expect, vi } from 'vitest';
import { getKinship } from './kinship';
import { PERSONS_FIXTURE } from '@/lib/data/__fixtures__/persons';

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) => PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
}));

// Fixture: p001 Иван (father p002, mother p003), p002 Пётр, p003 Мария, p016 Олег (father p002, mother p003), etc.

describe('getKinship', () => {
  it.each([
    ['p001', 'p002', 'kinFather', 'Сергей→Владимир = отец'],
    ['p002', 'p001', 'kinSon', 'Владимир→Сергей = сын'],
    ['p001', 'p003', 'kinMother', 'Сергей→Вера = мать'],
    ['p003', 'p001', 'kinSon', 'Вера→Сергей = сын'],
    ['p001', 'p016', 'kinBrother', 'Сергей→Олег = брат'],
    ['p016', 'p001', 'kinBrother', 'Олег→Сергей = брат'],
    ['p001', 'p004', 'kinGrandfather', 'Сергей→Павел = дед'],
    ['p001', 'p005', 'kinGrandmother', 'Сергей→Вера Дудник = бабушка'],
    ['p001', 'p007', 'kinGrandmother', 'Сергей→Елена = бабушка'],
    ['p001', 'p008', 'kinGreatGrandfather', 'Сергей→Андрей = прадед'],
    ['p002', 'p016', 'kinSon', 'Владимир→Олег = сын'],
    ['p002', 'p003', 'kinWife', 'Владимир→Вера = жена'],
    ['p003', 'p002', 'kinHusband', 'Вера→Владимир = муж'],
    ['p007', 'p015', 'kinDaughter', 'Елена→Ольга = дочь'],
    ['p015', 'p007', 'kinMother', 'Ольга→Елена = мать'],
  ])('%s → %s = %s (%s)', (a, b, expected) => {
    const r = getKinship(a, b);
    expect(r).not.toBeNull();
    expect(r!.key).toBe(expected);
  });
});
