import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { TreeNode } from './TreeNode';
import { withI18n } from '@/lib/i18n/test-utils';
import type { Person } from '@/lib/types/person';

const person: Person = {
  id: 'person-1',
  firstName: 'Иван',
  patronymic: 'Петрович',
  birthDate: '1925',
  deathDate: '1998',
  birthPlace: '',
  occupation: '',
  parentIds: [],
  gender: 'm',
};

describe('TreeNode', () => {
  it('renders person name and years', () => {
    render(
      withI18n(
        <TreeNode
          person={person}
          level={0}
          index={0}
          scale={1}
          onPersonClick={() => {}}
        />
      )
    );
    expect(screen.getByText('Иван Петрович')).toBeInTheDocument();
    expect(screen.getByText('1925–1998')).toBeInTheDocument();
  });

  it('renders unknown when person is null', () => {
    render(
      withI18n(
        <TreeNode
          person={null}
          level={1}
          index={0}
          scale={1}
          onPersonClick={() => {}}
        />
      )
    );
    expect(screen.getByText('неизв.')).toBeInTheDocument();
  });

  it('calls onPersonClick when clicked', () => {
    const onPersonClick = vi.fn();
    render(
      withI18n(
        <TreeNode
          person={person}
          level={0}
          index={0}
          scale={1}
          onPersonClick={onPersonClick}
        />
      )
    );
    fireEvent.click(screen.getByRole('button', { name: /Иван Петрович/ }));
    expect(onPersonClick).toHaveBeenCalledWith('person-1');
  });

  it('truncates long names', () => {
    const longName: Person = {
      ...person,
      firstName: 'Очень длинное имя персоны для проверки',
    };
    render(
      withI18n(
        <TreeNode
          person={longName}
          level={0}
          index={0}
          scale={1}
          onPersonClick={() => {}}
        />
      )
    );
    expect(screen.getByText(/…/)).toBeInTheDocument();
  });
});
