const express = require('express');
const router = express.Router();

// 导入控制器
const userController = require('../../../controllers/user');

// 导入中间件
const { requireSuperAdmin } = require('../../../middleware/auth');
const { 
  idValidation,
  paginationValidation,
  handleValidationErrors 
} = require('../../../utils/validate');

/**
 * 用户管理接口
 * 注意：这些接口已经在上级路由中应用了认证和管理员权限中间件
 */

// 获取用户统计信息
router.get('/stats', userController.getUserStats);

// 获取用户列表
router.get('/', 
  paginationValidation,
  handleValidationErrors,
  userController.getUserList
);

// 获取指定用户详细信息
router.get('/:id', 
  idValidation,
  handleValidationErrors,
  userController.getUserById
);

// 更新用户信息
router.put('/:id', 
  idValidation,
  handleValidationErrors,
  userController.adminUpdateUser
);

// 删除用户（软删除）
router.delete('/:id', 
  idValidation,
  handleValidationErrors,
  userController.adminDeleteUser
);

// 恢复用户
router.post('/:id/restore', 
  idValidation,
  handleValidationErrors,
  userController.adminRestoreUser
);

// 批量操作用户（需要超级管理员权限）
router.post('/batch', 
  requireSuperAdmin,
  userController.batchUpdateUsers
);

// 搜索用户
router.get('/search/:keyword', (req, res) => {
  const { keyword } = req.params;
  const { limit = 20 } = req.query;
  
  // 重新组织参数传递给控制器
  req.query = { keyword, limit };
  userController.searchUsers(req, res);
});

module.exports = router;