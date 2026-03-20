import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { TreeNode } from './TreeNode';
import { withI18n } from '@/lib/i18n/test-utils';
import type { Person } from '@/lib/types/person';

const person: Person = {
  id: 'p001',
  firstName: 'Иван',
  patronymic: 'Петрович',
  birthDate: '1925',
  deathDate: '1998',
  birthPlace: '',
  occupation: '',
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
    expect(screen.getAllByRole('button', { name: 'Иван Петрович' }).length).toBe(2);
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText('Петрович')).toBeInTheDocument();
    expect(screen.getByText('1925 – 1998')).toBeInTheDocument();
  });

  it('renders empty node (muted stroke/fill, no unknown text) when person is null', () => {
    const { container } = render(
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
    expect(screen.queryByText(/не выбрано|неизв\./i)).not.toBeInTheDocument();
    expect(container.querySelector('.border-gray-300')).toBeInTheDocument();
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
    fireEvent.click(screen.getAllByRole('button', { name: /Иван Петрович/ })[0]!);
    expect(onPersonClick).toHaveBeenCalledWith('p001');
  });

  it('shows locale template placeholder when name fields are empty', () => {
    const empty: Person = {
      id: 'p001',
      firstName: '',
      lastName: '',
      gender: 'm',
    };
    render(
      withI18n(
        <TreeNode person={empty} level={0} index={0} scale={1} onPersonClick={() => {}} />,
        'en'
      )
    );
    const namedButtons = screen.getAllByRole('button', { name: 'Doe John' });
    expect(namedButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Doe John')).toBeInTheDocument();
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
