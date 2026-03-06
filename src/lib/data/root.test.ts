import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PERSONS_FIXTURE } from './__fixtures__/persons';

vi.mock('@/lib/data/persons', () => ({
  getPersons: () => PERSONS_FIXTURE,
  getPersonById: (id: string) => PERSONS_FIXTURE.find((p) => p.id === id) ?? null,
}));

let mockData: Record<string, unknown> = {};
vi.mock('@/data/data.json', () => ({
  get default() {
    return mockData;
  },
}));

let getRootPersonId: typeof import('./root').getRootPersonId;

describe('getRootPersonId', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('returns rootPersonId from data.json when set', async () => {
    mockData = { rootPersonId: 'p002' };
    const mod = await import('./root');
    getRootPersonId = mod.getRootPersonId;
    expect(getRootPersonId()).toBe('p002');
  });

  it('falls back to first person when rootPersonId is missing', async () => {
    mockData = {};
    const mod = await import('./root');
    getRootPersonId = mod.getRootPersonId;
    expect(getRootPersonId()).toBe('p001');
  });

  it('trims whitespace from rootPersonId', async () => {
    mockData = { rootPersonId: '  p002  ' };
    const mod = await import('./root');
    getRootPersonId = mod.getRootPersonId;
    expect(getRootPersonId()).toBe('p002');
  });
});
