import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { makeData, person } from '@/lib/data/__fixtures__/dataMerge';
import { useAdminImportFlow } from './useAdminImportFlow';

function setup() {
  const dataRef = { current: makeData({ persons: [person('p1')] }) };
  const onReload = vi.fn();
  const onExported = vi.fn();
  const t = (key: string) => key;
  const hook = renderHook(() => useAdminImportFlow({ dataRef, onReload, onExported, t }));
  return { hook, onReload, onExported };
}

describe('useAdminImportFlow.handleImport', () => {
  it.each([
    ['not JSON', '{oops'],
    ['an empty file', ''],
    ['JSON of the wrong shape', JSON.stringify({ ...makeData(), persons: {} })],
  ])('shows an error for %s', (_label, text) => {
    const { hook, onReload } = setup();
    act(() => hook.result.current.handleImport(text));
    expect(hook.result.current.alertMessage).toBe('adminImportError');
    expect(onReload).not.toHaveBeenCalled();
  });

  it('applies a valid import without conflicts', () => {
    const { hook, onReload } = setup();
    const incoming = makeData({ persons: [person('p1'), person('p2')] });
    act(() => hook.result.current.handleImport(JSON.stringify(incoming)));
    expect(hook.result.current.alertMessage).toBe('adminImportSuccess');
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(onReload.mock.calls[0]![0].persons.map((p: { id: string }) => p.id)).toEqual(['p1', 'p2']);
  });

  it('marks data as exported after download', () => {
    const { hook, onExported } = setup();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:x');
    globalThis.URL.revokeObjectURL = vi.fn();
    act(() => hook.result.current.handleDownload());
    expect(onExported).toHaveBeenCalledTimes(1);
  });
});
