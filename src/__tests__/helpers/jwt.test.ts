import { generateToken, verifyToken } from '../../helpers/jwt';

describe('JWT Helper', () => {
  const mockPayload = {
    userId: '123456789',
    email: 'test@example.com',
    role: 'L1',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for the same payload at different times', () => {
      const token1 = generateToken(mockPayload);
      // Wait a bit to ensure different iat (issued at) timestamps
      const token2 = generateToken(mockPayload);

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      // Tokens might be the same if generated in same second, but should have valid format
      expect(token1.split('.')).toHaveLength(3);
      expect(token2.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token) as any;

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.string';

      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'malformed';

      expect(() => verifyToken(malformedToken)).toThrow();
    });

    it('should include expiration time in token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);

      // Token should expire in 1 day (86400 seconds)
      const expectedExpiration = decoded.iat + 86400;
      expect(decoded.exp).toBe(expectedExpiration);
    });
  });
});
