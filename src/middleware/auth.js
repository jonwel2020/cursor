const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/encrypt');
const { unauthorized, forbidden } = require('../utils/response');
const { logSecurityEvent } = require('../utils/logger');
const authConfig = require('../../config/auth');
const User = require('../models/User');

/**
 * JWT认证中间件
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      logSecurityEvent('missing_token', { url: req.url }, req);
      return unauthorized(res, 'Access token is required');
    }

    // 验证token
    const decoded = verifyToken(token);
    
    // 从数据库获取用户信息
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      logSecurityEvent('invalid_user_token', { userId: decoded.userId }, req);
      return unauthorized(res, 'User not found');
    }

    if (user.status !== 'active') {
      logSecurityEvent('inactive_user_access', { userId: user.id }, req);
      return forbidden(res, 'Account is not active');
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    logSecurityEvent('token_verification_failed', { 
      error: error.message,
      token: req.headers.authorization?.substring(0, 20) + '...'
    }, req);

    if (error.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid token');
    } else {
      return unauthorized(res, 'Token verification failed');
    }
  }
}

/**
 * 可选认证中间件（token可有可无）
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });

      if (user && user.status === 'active') {
        req.user = user;
        req.tokenPayload = decoded;
      }
    }

    next();
  } catch (error) {
    // 可选认证失败不影响请求继续处理
    next();
  }
}

/**
 * 角色权限验证中间件
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }

    const userRole = req.user.role;
    const userRoleLevel = authConfig.roleHierarchy[userRole] || 0;
    
    // 检查是否有足够的权限等级
    const hasPermission = allowedRoles.some(role => {
      const requiredLevel = authConfig.roleHierarchy[role] || 0;
      return userRoleLevel >= requiredLevel;
    });

    if (!hasPermission) {
      logSecurityEvent('insufficient_permissions', {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        url: req.url
      }, req);
      return forbidden(res, 'Insufficient permissions');
    }

    next();
  };
}

/**
 * 管理员权限验证中间件
 */
function requireAdmin(req, res, next) {
  return requireRole(authConfig.roles.ADMIN, authConfig.roles.SUPER_ADMIN)(req, res, next);
}

/**
 * 超级管理员权限验证中间件
 */
function requireSuperAdmin(req, res, next) {
  return requireRole(authConfig.roles.SUPER_ADMIN)(req, res, next);
}

/**
 * 资源所有者验证中间件
 */
function requireOwnership(getResourceUserId) {
  return async (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }

    try {
      const resourceUserId = typeof getResourceUserId === 'function' 
        ? await getResourceUserId(req)
        : req.params.userId || req.body.userId;

      // 管理员可以访问所有资源
      if (req.user.role === authConfig.roles.ADMIN || req.user.role === authConfig.roles.SUPER_ADMIN) {
        return next();
      }

      // 检查是否是资源所有者
      if (req.user.id != resourceUserId) {
        logSecurityEvent('unauthorized_resource_access', {
          userId: req.user.id,
          resourceUserId,
          resource: req.url
        }, req);
        return forbidden(res, 'Access denied: not the resource owner');
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return forbidden(res, 'Access verification failed');
    }
  };
}

/**
 * 小程序认证中间件
 */
async function authenticateMiniProgram(req, res, next) {
  try {
    const { openid } = req.body;
    
    if (!openid) {
      return unauthorized(res, 'OpenID is required');
    }

    // 根据openid查找用户
    const user = await User.findOne({
      where: { openid },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    if (user.status !== 'active') {
      return forbidden(res, 'Account is not active');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('MiniProgram auth error:', error);
    return unauthorized(res, 'Authentication failed');
  }
}

/**
 * API密钥认证中间件
 */
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    logSecurityEvent('missing_api_key', { url: req.url }, req);
    return unauthorized(res, 'API key is required');
  }

  // 这里应该从数据库验证API密钥
  // 示例：简单验证
  if (apiKey !== process.env.API_KEY) {
    logSecurityEvent('invalid_api_key', { apiKey: apiKey.substring(0, 8) + '...' }, req);
    return unauthorized(res, 'Invalid API key');
  }

  next();
}

/**
 * 请求频率限制中间件
 */
function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const requests = new Map();

  return (req, res, next) => {
    const identifier = req.ip + (req.user?.id || '');
    const now = Date.now();
    const windowStart = now - windowMs;

    // 清理过期记录
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }

    const userRequests = requests.get(identifier);
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      logSecurityEvent('rate_limit_exceeded', {
        identifier,
        requestCount: validRequests.length,
        maxRequests
      }, req);
      
      return res.status(429).json({
        success: false,
        code: 429,
        message: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireOwnership,
  authenticateMiniProgram,
  authenticateApiKey,
  rateLimit
};