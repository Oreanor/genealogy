import { describe, it, expect } from 'vitest';
import { getKinship } from './kinship';

// From data.json:
// p001 Сергей (m), father=p002, mother=p003
// p002 Владимир (m), father=p004, mother=p005
// p003 Вера Андреева (f), father=p006, mother=p007
// p016 Олег (m), father=p002, mother=p003
// p004 Павел (m), father=p008, mother=p009
// p005 Вера Дудник (f), father=p010, mother=p011
// p007 Елена Беляева (f), father=p014, mother=p015
// p015 Татьяна Беляева (f)

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
    ['p007', 'p015', 'kinMother', 'Елена→Татьяна = мать'],
    ['p015', 'p007', 'kinDaughter', 'Татьяна→Елена = дочь'],
  ])('%s → %s = %s (%s)', (a, b, expected) => {
    const r = getKinship(a, b);
    expect(r).not.toBeNull();
    expect(r!.key).toBe(expected);
  });
});
