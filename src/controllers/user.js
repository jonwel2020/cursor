const userService = require('../services/userService');
const { success, error, paginated, asyncHandler } = require('../utils/response');
const { validationResult } = require('express-validator');

/**
 * @api {get} /api/v1/user/profile 获取用户资料
 * @apiName GetUserProfile
 * @apiGroup User
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 用户信息
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  return success(res, user, '获取用户资料成功');
});

/**
 * @api {put} /api/v1/user/profile 更新用户资料
 * @apiName UpdateUserProfile
 * @apiGroup User
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * 
 * @apiParam {String} [nickname] 昵称
 * @apiParam {String} [email] 邮箱
 * @apiParam {String} [phone] 手机号
 * @apiParam {String} [avatar] 头像URL
 * @apiParam {String} [gender] 性别（male/female/unknown）
 * @apiParam {String} [birthday] 生日（YYYY-MM-DD）
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 更新后的用户信息
 */
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, '数据验证失败', 422, errors.array());
  }

  const user = await userService.updateUserProfile(req.user.id, req.body, req.user);
  return success(res, user, '用户资料更新成功');
});

/**
 * @api {get} /api/v1/user/:id 获取指定用户信息
 * @apiName GetUserById
 * @apiGroup User
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * 
 * @apiParam {Number} id 用户ID
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 用户信息
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  
  // 只返回公开信息
  const publicInfo = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    gender: user.gender,
    created_at: user.created_at
  };
  
  return success(res, publicInfo, '获取用户信息成功');
});

/**
 * @api {get} /api/v1/user/search 搜索用户
 * @apiName SearchUsers
 * @apiGroup User
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * 
 * @apiParam {String} keyword 搜索关键词
 * @apiParam {Number} [limit=10] 返回数量限制
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Array} data 用户列表
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { keyword, limit } = req.query;
  
  if (!keyword) {
    return error(res, '搜索关键词不能为空', 400);
  }

  const users = await userService.searchUsers(keyword, limit);
  return success(res, users, '搜索用户成功');
});

// 管理员功能控制器

/**
 * @api {get} /api/admin/users 获取用户列表（管理员）
 * @apiName GetUserList
 * @apiGroup AdminUser
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token（管理员权限）
 * 
 * @apiParam {String} [search] 搜索关键词
 * @apiParam {String} [role] 角色筛选
 * @apiParam {String} [status] 状态筛选
 * @apiParam {String} [gender] 性别筛选
 * @apiParam {String} [startDate] 开始日期
 * @apiParam {String} [endDate] 结束日期
 * @apiParam {Number} [page=1] 页码
 * @apiParam {Number} [limit=20] 每页数量
 * @apiParam {String} [sort=created_at:desc] 排序方式
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Array} data 用户列表
 * @apiSuccess {Object} pagination 分页信息
 */
const getUserList = asyncHandler(async (req, res) => {
  const result = await userService.getUserList(req.query, req.query);
  return paginated(res, result.users, result.pagination, '获取用户列表成功');
});

/**
 * @api {put} /api/admin/users/:id 更新用户信息（管理员）
 * @apiName AdminUpdateUser
 * @apiGroup AdminUser
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token（管理员权限）
 * 
 * @apiParam {Number} id 用户ID
 * @apiParam {String} [nickname] 昵称
 * @apiParam {String} [email] 邮箱
 * @apiParam {String} [phone] 手机号
 * @apiParam {String} [status] 状态
 * @apiParam {String} [role] 角色
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 更新后的用户信息
 */
const adminUpdateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, role, ...profileData } = req.body;
  
  let user;
  
  // 更新基础信息
  if (Object.keys(profileData).length > 0) {
    user = await userService.updateUserProfile(id, profileData, req.user);
  }
  
  // 更新状态
  if (status) {
    user = await userService.updateUserStatus(id, status, req.user);
  }
  
  // 更新角色
  if (role) {
    user = await userService.updateUserRole(id, role, req.user);
  }
  
  // 如果没有更新操作，获取用户信息
  if (!user) {
    user = await userService.getUserById(id);
  }
  
  return success(res, user, '用户信息更新成功');
});

/**
 * @api {delete} /api/admin/users/:id 删除用户（管理员）
 * @apiName AdminDeleteUser
 * @apiGroup AdminUser
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token（管理员权限）
 * 
 * @apiParam {Number} id 用户ID
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {String} message 操作消息
 */
const adminDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await userService.deleteUser(id, req.user);
  return success(res, null, '用户删除成功');
});

/**
 * @api {post} /api/admin/users/:id/restore 恢复用户（管理员）
 * @apiName AdminRestoreUser
 * @apiGroup AdminUser
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token（管理员权限）
 * 
 * @apiParam {Number} id 用户ID
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {String} message 操作消息
 */
const adminRestoreUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await userService.restoreUser(id, req.user);
  return success(res, null, '用户恢复成功');
});

/**
 * @api {get} /api/admin/users/stats 获取用户统计信息（管理员）
 * @apiName GetUserStats
 * @apiGroup AdminUser
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token（管理员权限）
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 统计数据
 * @apiSuccess {Number} data.total 总用户数
 * @apiSuccess {Number} data.active 活跃用户数
 * @apiSuccess {Number} data.banned 被禁用户数
 * @apiSuccess {Number} data.today 今日新增用户数
 * @apiSuccess {Array} data.roleDistribution 角色分布
 * @apiSuccess {Array} data.genderDistribution 性别分布
 */
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats();
  return success(res, stats, '获取用户统计成功');
});

/**
 * @api {post} /api/admin/users/batch 批量操作用户（管理员）
 * @apiName BatchUpdateUsers
 * @apiGroup AdminUser
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token（管理员权限）
 * 
 * @apiParam {Array} userIds 用户ID数组
 * @apiParam {String} [status] 状态
 * @apiParam {String} [role] 角色
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 操作结果
 * @apiSuccess {Number} data.affectedCount 受影响的用户数量
 */
const batchUpdateUsers = asyncHandler(async (req, res) => {
  const { userIds, ...updateData } = req.body;
  
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return error(res, '用户ID数组不能为空', 400);
  }

  const affectedCount = await userService.batchUpdateUsers(userIds, updateData, req.user);
  
  return success(res, { affectedCount }, `批量操作成功，影响${affectedCount}个用户`);
});

module.exports = {
  // 普通用户功能
  getProfile,
  updateProfile,
  getUserById,
  searchUsers,
  
  // 管理员功能
  getUserList,
  adminUpdateUser,
  adminDeleteUser,
  adminRestoreUser,
  getUserStats,
  batchUpdateUsers
};