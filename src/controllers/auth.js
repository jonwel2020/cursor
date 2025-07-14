const authService = require('../services/authService');
const { success, error, asyncHandler } = require('../utils/response');
const { validationResult } = require('express-validator');

/**
 * @api {post} /api/v1/auth/register 用户注册
 * @apiName Register
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} username 用户名（3-20字符，字母数字下划线）
 * @apiParam {String} email 邮箱地址
 * @apiParam {String} phone 手机号码
 * @apiParam {String} password 密码（6-128字符）
 * @apiParam {String} confirmPassword 确认密码
 * @apiParam {String} [nickname] 昵称
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 用户数据和token
 * @apiSuccess {Object} data.user 用户信息
 * @apiSuccess {String} data.token 访问令牌
 * @apiSuccess {String} data.refreshToken 刷新令牌
 */
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, '数据验证失败', 422, errors.array());
  }

  const result = await authService.register(req.body, req);
  return success(res, result, '注册成功', 201);
});

/**
 * @api {post} /api/v1/auth/login 用户登录
 * @apiName Login
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} account 账户（用户名/邮箱/手机号）
 * @apiParam {String} password 密码
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 用户数据和token
 * @apiSuccess {Object} data.user 用户信息
 * @apiSuccess {String} data.token 访问令牌
 * @apiSuccess {String} data.refreshToken 刷新令牌
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, '数据验证失败', 422, errors.array());
  }

  const { account, password } = req.body;
  const result = await authService.login(account, password, req);
  return success(res, result, '登录成功');
});

/**
 * @api {post} /api/v1/auth/refresh 刷新Token
 * @apiName RefreshToken
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} refreshToken 刷新令牌
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 新的token数据
 * @apiSuccess {String} data.token 新的访问令牌
 * @apiSuccess {String} data.refreshToken 新的刷新令牌
 * @apiSuccess {Object} data.user 用户信息
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: refreshTokenString } = req.body;
  
  if (!refreshTokenString) {
    return error(res, '刷新令牌不能为空', 400);
  }

  const result = await authService.refreshToken(refreshTokenString);
  return success(res, result, 'Token刷新成功');
});

/**
 * @api {post} /api/v1/auth/logout 用户登出
 * @apiName Logout
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {String} message 操作消息
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id, req);
  return success(res, null, '登出成功');
});

/**
 * @api {post} /api/v1/auth/change-password 修改密码
 * @apiName ChangePassword
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * 
 * @apiParam {String} oldPassword 原密码
 * @apiParam {String} newPassword 新密码
 * @apiParam {String} confirmNewPassword 确认新密码
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {String} message 操作消息
 */
const changePassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, '数据验证失败', 422, errors.array());
  }

  const { oldPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, oldPassword, newPassword);
  return success(res, null, '密码修改成功');
});

/**
 * @api {post} /api/v1/auth/reset-password 重置密码
 * @apiName ResetPassword
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} account 账户（邮箱/手机号）
 * @apiParam {String} verificationCode 验证码
 * @apiParam {String} newPassword 新密码
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {String} message 操作消息
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { account, verificationCode, newPassword } = req.body;
  
  if (!account || !verificationCode || !newPassword) {
    return error(res, '参数不能为空', 400);
  }

  await authService.resetPassword(account, verificationCode, newPassword);
  return success(res, null, '密码重置成功');
});

/**
 * @api {post} /api/v1/auth/miniprogram/login 小程序登录
 * @apiName MiniprogramLogin
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} code 小程序登录凭证
 * @apiParam {Object} [userInfo] 用户信息
 * @apiParam {String} userInfo.nickName 昵称
 * @apiParam {String} userInfo.avatarUrl 头像URL
 * @apiParam {Number} userInfo.gender 性别（1男2女0未知）
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 用户数据和token
 * @apiSuccess {Object} data.user 用户信息
 * @apiSuccess {String} data.token 访问令牌
 * @apiSuccess {String} data.refreshToken 刷新令牌
 * @apiSuccess {String} data.sessionKey 会话密钥
 */
const miniprogramLogin = asyncHandler(async (req, res) => {
  const { code, userInfo } = req.body;
  
  if (!code) {
    return error(res, '登录凭证不能为空', 400);
  }

  const result = await authService.miniprogramLogin(code, userInfo, req);
  return success(res, result, '小程序登录成功');
});

/**
 * @api {get} /api/v1/auth/profile 获取当前用户信息
 * @apiName GetProfile
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 用户信息
 */
const getProfile = asyncHandler(async (req, res) => {
  return success(res, req.user, '获取用户信息成功');
});

/**
 * @api {post} /api/v1/auth/validate-token 验证Token
 * @apiName ValidateToken
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} token JWT Token
 * 
 * @apiSuccess {Boolean} success 操作状态
 * @apiSuccess {Object} data 验证结果
 * @apiSuccess {Object} data.user 用户信息
 * @apiSuccess {Object} data.payload Token载荷
 */
const validateToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return error(res, 'Token不能为空', 400);
  }

  const result = await authService.validateToken(token);
  return success(res, result, 'Token验证成功');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  resetPassword,
  miniprogramLogin,
  getProfile,
  validateToken
};