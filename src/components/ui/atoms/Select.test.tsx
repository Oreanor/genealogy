import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

describe('Select', () => {
  it('renders options and calls onChange', () => {
    const onChange = vi.fn();
    render(
      <Select value="b" onChange={(e) => onChange((e.target as HTMLSelectElement).value)}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('b');

    fireEvent.change(select, { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalledWith('a');
  });
});

