import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { makeData, person } from '@/lib/data/__fixtures__/dataMerge';
import { confirmNavigation } from '@/lib/utils/navigationGuard';
import { UNSAVED_BASELINE, useUnsavedChangesGuard } from './useUnsavedChangesGuard';

function fireBeforeUnload(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

function setup(baseline: string | null = null, ready = true) {
  const dataRef = { current: makeData({ persons: [person('p1')] }) };
  const baselineHashRef = { current: baseline };
  const hook = renderHook(
    ({ isReady }) => useUnsavedChangesGuard({ dataRef, baselineHashRef, ready: isReady, confirmMessage: 'leave?' }),
    { initialProps: { isReady: ready } }
  );
  return { dataRef, baselineHashRef, hook };
}

afterEach(() => vi.restoreAllMocks());

describe('useUnsavedChangesGuard', () => {
  it('treats freshly loaded data as saved', () => {
    const { baselineHashRef, hook } = setup();
    expect(baselineHashRef.current).not.toBeNull();
    expect(fireBeforeUnload()).toBe(false);
    expect(confirmNavigation()).toBe(true);
    hook.unmount();
  });

  it('warns once the data changes, and asks before in-app navigation', () => {
    const { dataRef, hook } = setup();
    dataRef.current = { ...dataRef.current, persons: [person('p1'), person('p2')] };
    expect(fireBeforeUnload()).toBe(true);

    const confirm = vi.fn(() => false);
    Object.defineProperty(window, 'confirm', { value: confirm, configurable: true, writable: true });
    expect(confirmNavigation()).toBe(false);
    expect(confirm).toHaveBeenCalledWith('leave?');
    hook.unmount();
  });

  it('ignores changes made before the editors are ready (async normalization)', () => {
    const { dataRef, baselineHashRef, hook } = setup(null, false);
    dataRef.current = { ...dataRef.current, photos: [] };
    expect(baselineHashRef.current).toBeNull();
    expect(fireBeforeUnload()).toBe(false);

    hook.rerender({ isReady: true });
    expect(fireBeforeUnload()).toBe(false);
    dataRef.current = { ...dataRef.current, persons: [] };
    expect(fireBeforeUnload()).toBe(true);
    hook.unmount();
  });

  it('keeps imported data unsaved until exported', () => {
    const { hook } = setup(UNSAVED_BASELINE);
    expect(fireBeforeUnload()).toBe(true);
    hook.unmount();
  });

  it('removes its listeners and guard on unmount', () => {
    const { dataRef, hook } = setup();
    hook.unmount();
    dataRef.current = { ...dataRef.current, persons: [] };
    expect(fireBeforeUnload()).toBe(false);
    expect(confirmNavigation()).toBe(true);
  });
});
