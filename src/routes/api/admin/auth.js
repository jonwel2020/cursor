const express = require('express');
const router = express.Router();

// 导入控制器
const authController = require('../../../controllers/auth');

/**
 * 管理员认证相关接口
 * 注意：这些接口已经在上级路由中应用了认证和管理员权限中间件
 */

// 获取当前管理员信息
router.get('/profile', authController.getProfile);

// 管理员登出
router.post('/logout', authController.logout);

// 修改密码
router.post('/change-password', 
  require('../../../utils/validate').changePasswordValidation,
  require('../../../utils/validate').handleValidationErrors,
  authController.changePassword
);

// 验证管理员权限
router.get('/verify', (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        permissions: ['admin_access']
      },
      permissions: {
        canManageUsers: true,
        canViewStats: true,
        canModifySystem: req.user.role === 'super_admin'
      }
    },
    message: '管理员权限验证成功'
  });
});

module.exports = router;