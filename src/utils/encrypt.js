const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authConfig = require('../../config/auth');

/**
 * 密码加密
 * @param {string} password - 原始密码
 * @returns {Promise<string>} 加密后的密码哈希
 */
async function hashPassword(password) {
  const saltRounds = authConfig.password.saltRounds;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 哈希密码
 * @returns {Promise<boolean>} 验证结果
 */
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * 生成JWT Token
 * @param {Object} payload - Token载荷
 * @param {string} expiresIn - 过期时间
 * @returns {string} JWT Token
 */
function generateToken(payload, expiresIn = authConfig.jwt.expiresIn) {
  return jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience
  });
}

/**
 * 验证JWT Token
 * @param {string} token - JWT Token
 * @returns {Object} 解码后的载荷
 */
function verifyToken(token) {
  return jwt.verify(token, authConfig.jwt.secret, {
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience
  });
}

/**
 * 生成刷新Token
 * @param {Object} payload - Token载荷
 * @returns {string} 刷新Token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.refreshExpiresIn,
    issuer: authConfig.jwt.issuer,
    audience: authConfig.jwt.audience
  });
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 生成数字验证码
 * @param {number} length - 验证码长度
 * @returns {string} 数字验证码
 */
function generateVerificationCode(length = authConfig.verification.codeLength) {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * MD5哈希
 * @param {string} data - 待哈希的数据
 * @returns {string} MD5哈希值
 */
function md5Hash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * SHA256哈希
 * @param {string} data - 待哈希的数据
 * @returns {string} SHA256哈希值
 */
function sha256Hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * AES加密
 * @param {string} text - 待加密的文本
 * @param {string} key - 加密密钥
 * @returns {string} 加密后的文本
 */
function aesEncrypt(text, key = process.env.APP_SECRET) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES解密
 * @param {string} encryptedText - 加密的文本
 * @param {string} key - 解密密钥
 * @returns {string} 解密后的文本
 */
function aesDecrypt(encryptedText, key = process.env.APP_SECRET) {
  const algorithm = 'aes-256-cbc';
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateRefreshToken,
  generateRandomString,
  generateVerificationCode,
  generateUUID,
  md5Hash,
  sha256Hash,
  aesEncrypt,
  aesDecrypt
};