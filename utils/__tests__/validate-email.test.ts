import validateEmail from '../validate-email';

describe('validateEmail', () => {
  it('returns true for valid emails', () => {
    expect(validateEmail.validateEmail('user@example.com')).toBe(true);
    expect(validateEmail.validateEmail('test.user@domain.co')).toBe(true);
    expect(validateEmail.validateEmail('a@b.c')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(validateEmail.validateEmail('invalid')).toBe(false);
    expect(validateEmail.validateEmail('missing@')).toBe(false);
    expect(validateEmail.validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail.validateEmail('')).toBe(false);
  });

  it('is case insensitive', () => {
    expect(validateEmail.validateEmail('User@Example.COM')).toBe(true);
  });
});
