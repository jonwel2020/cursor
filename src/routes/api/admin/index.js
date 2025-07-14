const express = require('express');
const router = express.Router();

// 导入子路由
const authRoutes = require('./auth');
const userRoutes = require('./user');

// 导入中间件
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');
const { slowRequestLogger, securityLogger } = require('../../../middleware/logger');

// 应用通用中间件
router.use(slowRequestLogger(2000)); // 管理员接口2秒以上记录为慢请求
router.use(securityLogger('admin_api_access')); // 记录管理员API访问

// 所有管理员接口都需要认证和管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// API信息
router.get('/', (req, res) => {
  res.json({
    version: '1.0.0',
    description: 'Admin API - 后台管理系统专用接口',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    },
    endpoints: {
      auth: '/auth - 管理员认证接口',
      users: '/users - 用户管理接口'
    },
    permissions: {
      required: ['admin', 'super_admin'],
      current: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

// 注册子路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// 系统信息接口
router.get('/system/info', (req, res) => {
  const { sequelize } = require('../../../database/connection');
  
  res.json({
    success: true,
    data: {
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV
      },
      database: {
        dialect: sequelize.getDialect(),
        version: sequelize.getDatabaseVersion ? 'Available' : 'N/A'
      },
      application: {
        name: 'Backend API Scaffold',
        version: '1.0.0',
        started: new Date(Date.now() - process.uptime() * 1000).toISOString()
      }
    },
    message: '获取系统信息成功'
  });
});

// 数据库健康检查
router.get('/system/health', async (req, res) => {
  const { healthCheck } = require('../../../database/connection');
  
  try {
    const dbHealth = await healthCheck();
    
    res.json({
      success: true,
      data: {
        database: dbHealth,
        application: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      },
      message: '系统健康检查完成'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '健康检查失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;