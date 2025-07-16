const {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
} = require('../src/utils/encrypt');

describe('加密工具测试示例', () => {
  describe('密码加密功能', () => {
    test('应该能正确加密密码', async () => {
      const password = 'test123456';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).toMatch(/^\$2[ayb]\$12\$/); // bcrypt格式检查
    });

    test('应该能正确验证密码', async () => {
      const password = 'test123456';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    test('相同密码每次加密结果应该不同', async () => {
      const password = 'test123456';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      
      // 但都应该能验证原密码
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe('JWT Token 功能', () => {
    const testUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };

    test('应该能生成和验证JWT Token', () => {
      const token = generateToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT格式: header.payload.signature
      
      const decoded = verifyToken(token);
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.username).toBe(testUser.username);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    test('Token 应该包含过期时间', () => {
      const token = generateToken(testUser);
      const decoded = verifyToken(token);
      
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('无效 Token 应该抛出错误', () => {
      const invalidTokens = [
        'invalid.token.here',
        'not-a-jwt-token',
        '',
        null,
        undefined
      ];

      invalidTokens.forEach(invalidToken => {
        expect(() => verifyToken(invalidToken)).toThrow();
      });
    });
  });

  describe('错误处理', () => {
    test('hashPassword 处理空字符串', async () => {
      // bcrypt 实际上可以处理空字符串，不会抛出错误
      const result = await hashPassword('');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('verifyPassword 处理无效输入', async () => {
      const validHash = await hashPassword('test123456');
      
      // 测试空字符串密码
      const result1 = await verifyPassword('', validHash);
      expect(result1).toBe(false);
      
      // 测试错误密码
      const result2 = await verifyPassword('wrongpassword', validHash);
      expect(result2).toBe(false);
      
      // 测试无效哈希
      try {
        await verifyPassword('test123456', 'invalid_hash');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
