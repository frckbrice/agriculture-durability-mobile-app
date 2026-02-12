import { toOptions } from '../remove-and-capitalise';

describe('toOptions', () => {
  it('removes dashes and capitalizes each word', () => {
    expect(toOptions('hello-world')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(toOptions('hello')).toBe('Hello');
  });

  it('handles multiple dashes', () => {
    expect(toOptions('foo-bar-baz')).toBe('Foo Bar Baz');
  });

  it('handles empty string', () => {
    expect(toOptions('')).toBe('');
  });
});
