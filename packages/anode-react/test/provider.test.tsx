import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AnodeProvider, useAnode } from '../src/context.js';

const Consumer = () => {
  const ctx = useAnode();
  return <div data-testid="ctx-id">{ctx !== null ? 'defined' : 'null'}</div>;
};

describe('AnodeProvider', () => {
  it('should provide context to consumers without crashing', () => {
    const { getByTestId } = render(
      <AnodeProvider>
        <Consumer />
      </AnodeProvider>
    );
    expect(getByTestId('ctx-id')).toHaveTextContent('defined');
  });
});
