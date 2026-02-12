import { AppError } from '../error-class';

describe('AppError', () => {
  it('has name AppError', () => {
    const err = new AppError('test');
    expect(err.name).toBe('AppError');
  });

  it('stores and exposes message', () => {
    const msg = 'Something went wrong';
    const err = new AppError(msg);
    expect(err.message).toBe(msg);
  });

  it('is an instance of Error', () => {
    const err = new AppError('test');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('log method logs the message', () => {
    const err = new AppError('log me');
    const spy = jest.spyOn(console, 'log').mockImplementation();
    err.log('custom');
    expect(spy).toHaveBeenCalledWith('AppError:', 'custom');
    spy.mockRestore();
  });

  it('exposes sanitized userMessage for UI', () => {
    const err = new AppError('Technical error with stack');
    expect(err.userMessage).toBeDefined();
    expect(typeof err.userMessage).toBe('string');
  });
});
