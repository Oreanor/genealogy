import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PersonCard } from './PersonCard';
import type { Person } from '@/lib/types/person';

const person: Person = {
  id: 'p1',
  name: 'Иван Петрович',
  birthYears: '1925–1998',
  birthPlace: 'д. Заозерье',
  occupation: 'учитель',
  parentIds: [],
};

describe('PersonCard', () => {
  it('renders person name', () => {
    render(<PersonCard person={person} />);
    expect(screen.getByRole('heading', { name: 'Иван Петрович' })).toBeInTheDocument();
  });

  it('renders birth years when present', () => {
    render(<PersonCard person={person} />);
    expect(screen.getByText(/1925–1998/)).toBeInTheDocument();
  });

  it('renders birth place when present', () => {
    render(<PersonCard person={person} />);
    expect(screen.getByText(/д\. Заозерье/)).toBeInTheDocument();
  });

  it('renders occupation when present', () => {
    render(<PersonCard person={person} />);
    expect(screen.getByText(/учитель/)).toBeInTheDocument();
  });

  it('omits optional fields when absent', () => {
    const minimal: Person = { id: 'p2', name: 'X', parentIds: [] };
    render(<PersonCard person={minimal} />);
    expect(screen.getByRole('heading', { name: 'X' })).toBeInTheDocument();
    expect(screen.queryByText(/Годы:/)).not.toBeInTheDocument();
  });
});
