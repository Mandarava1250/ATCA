/**
 * AuthService 单元测试
 * 测试认证服务的核心方法
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before imports
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn((token: string) => {
    if (token === 'valid-access-token') {
      return { userId: 1, username: 'testuser', role: 'user', type: 'access' };
    }
    if (token === 'valid-refresh-token') {
      return { userId: 1, username: 'testuser', role: 'user', type: 'refresh' };
    }
    throw new Error('Invalid token');
  }),
}));

jest.mock('../../src/config/app', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiry: '1h',
      refreshExpiry: '7d',
    },
  },
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    set: jest.fn<(key: string, value: string) => Promise<string>>().mockResolvedValue('OK'),
    get: jest.fn<(key: string) => Promise<string | null>>().mockResolvedValue(null),
    on: jest.fn(),
    status: 'ready',
  }));
});

import { authService, AuthUser } from '../../src/services/AuthService';

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const result = authService.generateTokens(1, 'testuser', 'user');

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBe('mock-jwt-token');
    });

    it('should call jwt.sign with correct parameters', () => {
      const jwt = require('jsonwebtoken');
      
      authService.generateTokens(1, 'testuser', 'admin');

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, username: 'testuser', role: 'admin', type: 'access' }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should return user info for valid access token', async () => {
      const result = await authService.verifyAccessToken('valid-access-token');

      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
      expect(result?.username).toBe('testuser');
      expect(result?.role).toBe('user');
    });

    it('should return null for invalid token', async () => {
      const result = await authService.verifyAccessToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for refresh token used as access token', async () => {
      const result = await authService.verifyAccessToken('valid-refresh-token');

      // Refresh tokens have type='refresh', should be rejected as access token
      expect(result).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return user info for valid refresh token', () => {
      const result = authService.verifyRefreshToken('valid-refresh-token');

      expect(result).toBeDefined();
      expect(result?.userId).toBe(1);
      expect(result?.username).toBe('testuser');
      expect(result?.role).toBe('user');
    });

    it('should return null for invalid token', () => {
      const result = authService.verifyRefreshToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for access token used as refresh token', () => {
      const result = authService.verifyRefreshToken('valid-access-token');

      // Access tokens have type='access', should be rejected as refresh token
      expect(result).toBeNull();
    });
  });

  describe('authMiddleware', () => {
    it('should call next() for valid token in Authorization header', async () => {
      const req = {
        headers: { authorization: 'Bearer valid-access-token' },
        query: {},
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      await authService.authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(1);
    });

    it('should return 401 when no token provided', async () => {
      const req = {
        headers: {},
        query: {},
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      await authService.authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'AUTH_003' }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      const req = {
        headers: { authorization: 'Bearer invalid-token' },
        query: {},
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      await authService.authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept token from query parameter', async () => {
      const req = {
        headers: {},
        query: { token: 'valid-access-token' },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      await authService.authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });
  });

  describe('adminMiddleware', () => {
    it('should call next() for admin user', () => {
      const req = { user: { userId: 1, username: 'admin', role: 'admin' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authService.adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next() for moderator user', () => {
      const req = { user: { userId: 1, username: 'mod', role: 'moderator' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authService.adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 for regular user', () => {
      const req = { user: { userId: 1, username: 'user', role: 'user' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authService.adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user not authenticated', () => {
      const req = {} as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const next = jest.fn();

      authService.adminMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});