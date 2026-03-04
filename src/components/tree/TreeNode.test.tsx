import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TreeNode } from './TreeNode';
import type { Person } from '@/lib/types/person';

const person: Person = {
  id: 'person-1',
  name: 'Иван Петрович',
  birthYears: '1925–1998',
  birthPlace: '',
  occupation: '',
  parentIds: [],
};

describe('TreeNode', () => {
  it('renders person name and years in svg', () => {
    const { container } = render(
      <svg>
        <TreeNode person={person} x={0} y={0} scale={1} level={0} index={0} onPersonClick={() => {}} />
      </svg>
    );
    const texts = container.querySelectorAll('text');
    expect(texts.length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).toContain('Иван Петрович');
    expect(container.textContent).toContain('1925–1998');
  });

  it('renders unknown when person is null', () => {
    const { container } = render(
      <svg>
        <TreeNode person={null} x={0} y={0} scale={1} level={1} index={0} onPersonClick={() => {}} />
      </svg>
    );
    expect(container.textContent).toContain('неизв.');
  });

  it('calls onPersonClick when clicked', () => {
    const onPersonClick = vi.fn();
    const { container } = render(
      <svg>
        <TreeNode person={person} x={0} y={0} scale={1} level={0} index={0} onPersonClick={onPersonClick} />
      </svg>
    );
    const g = container.querySelector('g');
    expect(g).toBeTruthy();
    fireEvent.click(g!);
    expect(onPersonClick).toHaveBeenCalledWith('person-1');
  });

  it('does not call onPersonClick when person is null', () => {
    const onPersonClick = vi.fn();
    const { container } = render(
      <svg>
        <TreeNode person={null} x={0} y={0} scale={1} level={1} index={0} onPersonClick={onPersonClick} />
      </svg>
    );
    const g = container.querySelector('g');
    fireEvent.click(g!);
    expect(onPersonClick).not.toHaveBeenCalled();
  });

  it('truncates long names', () => {
    const longName: Person = { ...person, name: 'Очень длинное имя персоны для проверки' };
    const { container } = render(
      <svg>
        <TreeNode person={longName} x={0} y={0} scale={1} level={0} index={0} onPersonClick={() => {}} />
      </svg>
    );
    expect(container.textContent).toContain('…');
  });
});
