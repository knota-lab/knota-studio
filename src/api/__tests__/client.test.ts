import { describe, expect, it } from 'vitest';
import { ApiError } from '../client';

describe('ApiError', () => {
  it('constructs with all fields', () => {
    const err = new ApiError(
      'Not Found',
      404,
      { code: 'user.not_found' },
      'user.not_found',
      '用户不存在',
    );
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('Not Found');
    expect(err.status).toBe(404);
    expect(err.code).toBe('user.not_found');
    expect(err.description).toBe('用户不存在');
    expect(err.body).toEqual({ code: 'user.not_found' });
  });

  it('constructs without optional fields', () => {
    const err = new ApiError('Server Error', 500, null);
    expect(err.code).toBeUndefined();
    expect(err.description).toBeUndefined();
  });

  it('propagates as a proper Error subclass', () => {
    const err = new ApiError('msg', 400, {});
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });
});
