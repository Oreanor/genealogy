import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichText } from './RichText';

describe('RichText', () => {
  it('renders text node', () => {
    render(<RichText nodes={[{ type: 'text', value: 'Hello' }]} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders bold', () => {
    render(
      <RichText
        nodes={[
          {
            type: 'bold',
            children: [{ type: 'text', value: 'Bold text' }],
          },
        ]}
      />
    );
    const el = screen.getByText('Bold text');
    expect(el.closest('strong')).toBeInTheDocument();
  });

  it('renders italic', () => {
    render(
      <RichText
        nodes={[
          {
            type: 'italic',
            children: [{ type: 'text', value: 'Italic' }],
          },
        ]}
      />
    );
    const el = screen.getByText('Italic');
    expect(el.closest('em')).toBeInTheDocument();
  });

  it('renders link', () => {
    render(
      <RichText
        nodes={[
          {
            type: 'link',
            href: '/glava/persony?id=1',
            children: [{ type: 'text', value: 'Link' }],
          },
        ]}
      />
    );
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toHaveAttribute('href', '/glava/persony?id=1');
  });

  it('renders mixed content', () => {
    render(
      <RichText
        nodes={[
          { type: 'text', value: 'Before ' },
          {
            type: 'bold',
            children: [{ type: 'text', value: 'bold' }],
          },
          { type: 'text', value: ' after' },
        ]}
      />
    );
    expect(screen.getByText(/Before/)).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText(/after/)).toBeInTheDocument();
  });
});
