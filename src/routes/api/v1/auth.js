const express = require('express');
const router = express.Router();

// 导入控制器
const authController = require('../../../controllers/auth');

// 导入中间件
const { authenticateToken } = require('../../../middleware/auth');
const { 
  registerValidation, 
  loginValidation, 
  changePasswordValidation,
  handleValidationErrors 
} = require('../../../utils/validate');

/**
 * 公开接口（无需认证）
 */

// 用户注册
router.post('/register', 
  registerValidation,
  handleValidationErrors,
  authController.register
);

// 用户登录
router.post('/login', 
  loginValidation,
  handleValidationErrors,
  authController.login
);

// 刷新Token
router.post('/refresh', authController.refreshToken);

// 重置密码
router.post('/reset-password', authController.resetPassword);

// 验证Token
router.post('/validate-token', authController.validateToken);

// 小程序登录
router.post('/miniprogram/login', authController.miniprogramLogin);

/**
 * 需要认证的接口
 */

// 获取当前用户信息
router.get('/profile', authenticateToken, authController.getProfile);

// 用户登出
router.post('/logout', authenticateToken, authController.logout);

// 修改密码
router.post('/change-password', 
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);

module.exports = router;