const express = require('express');
const router = express.Router();

// 导入子路由
const authRoutes = require('./auth');
const userRoutes = require('./user');
const miniprogramRoutes = require('./miniprogram');

// 导入中间件
const { authenticateToken, optionalAuth } = require('../../../middleware/auth');
const { slowRequestLogger } = require('../../../middleware/logger');

// 应用通用中间件
router.use(slowRequestLogger(3000)); // 3秒以上的请求记录为慢请求

// API信息
router.get('/', (req, res) => {
  res.json({
    version: '1.0.0',
    description: 'API v1 - 主要为小程序端和前端应用提供服务',
    endpoints: {
      auth: '/auth - 认证相关接口',
      user: '/user - 用户相关接口',
      miniprogram: '/miniprogram - 小程序专用接口'
    },
    documentation: '/docs'
  });
});

// 注册子路由
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/miniprogram', miniprogramRoutes);

// 受保护的测试接口
router.get('/protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '这是一个受保护的接口',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

// 可选认证的测试接口
router.get('/optional-auth', optionalAuth, (req, res) => {
  res.json({
    success: true,
    message: '这是一个可选认证的接口',
    authenticated: !!req.user,
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;