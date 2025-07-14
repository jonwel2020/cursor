const express = require('express');
const router = express.Router();

// 导入控制器
const userController = require('../../../controllers/user');

// 导入中间件
const { authenticateToken, requireOwnership } = require('../../../middleware/auth');
const { 
  updateProfileValidation,
  idValidation,
  handleValidationErrors 
} = require('../../../utils/validate');

/**
 * 需要认证的接口
 */

// 获取用户资料
router.get('/profile', authenticateToken, userController.getProfile);

// 更新用户资料
router.put('/profile', 
  authenticateToken,
  updateProfileValidation,
  handleValidationErrors,
  userController.updateProfile
);

// 搜索用户
router.get('/search', authenticateToken, userController.searchUsers);

// 获取指定用户信息（公开信息）
router.get('/:id', 
  authenticateToken,
  idValidation,
  handleValidationErrors,
  userController.getUserById
);

module.exports = router;