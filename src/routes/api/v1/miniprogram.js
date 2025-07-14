const express = require('express');
const router = express.Router();

// 导入控制器
const authController = require('../../../controllers/auth');
const userController = require('../../../controllers/user');

// 导入中间件
const { authenticateToken } = require('../../../middleware/auth');
const { updateProfileValidation, handleValidationErrors } = require('../../../utils/validate');

/**
 * 小程序专用接口
 */

// 小程序登录
router.post('/login', authController.miniprogramLogin);

// 获取用户信息
router.get('/user/profile', authenticateToken, userController.getProfile);

// 更新用户信息
router.put('/user/profile', 
  authenticateToken,
  updateProfileValidation,
  handleValidationErrors,
  userController.updateProfile
);

// 搜索用户
router.get('/user/search', authenticateToken, userController.searchUsers);

// 小程序专用的数据接口示例
router.get('/data/config', (req, res) => {
  res.json({
    success: true,
    data: {
      appName: '小程序名称',
      version: '1.0.0',
      features: ['用户管理', '数据展示', '搜索功能'],
      contact: {
        email: 'support@example.com',
        phone: '400-123-4567'
      }
    },
    message: '获取配置成功'
  });
});

// 小程序版本信息
router.get('/version', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.0.0',
      buildTime: '2024-01-01 00:00:00',
      changelog: [
        '初始版本发布',
        '用户认证功能',
        '基础数据管理'
      ],
      updateRequired: false,
      updateUrl: ''
    },
    message: '获取版本信息成功'
  });
});

module.exports = router;