const express = require('express');
const router = express.Router();

// 导入子路由
const apiV1Routes = require('./api/v1');
const adminRoutes = require('./api/admin');

// API文档路由
router.get('/docs', (req, res) => {
  res.redirect('/docs/api/index.html');
});

// 根路径重定向到API文档
router.get('/', (req, res) => {
  res.json({
    name: 'Backend API Scaffold',
    version: '1.0.0',
    description: '一个基于 Node.js + Express + MySQL 的后端 API 服务脚手架框架',
    docs: '/docs',
    health: '/health',
    endpoints: {
      'API v1': '/api/v1',
      'Admin API': '/api/admin'
    },
    author: 'Your Name',
    license: 'MIT'
  });
});

// 健康检查接口
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 注册子路由
router.use('/api/v1', apiV1Routes);
router.use('/api/admin', adminRoutes);

module.exports = router;