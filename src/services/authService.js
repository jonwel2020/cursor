const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyPassword } = require('../utils/encrypt');
const { logBusinessAction, logSecurityEvent } = require('../utils/logger');
const authConfig = require('../../config/auth');
const axios = require('axios');

/**
 * 用户注册服务
 */
async function register(userData, req) {
  const { username, email, phone, password, nickname } = userData;
  
  // 检查用户名是否已存在
  const existingUser = await User.findOne({
    where: {
      [User.sequelize.Op.or]: [
        { username },
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    }
  });
  
  if (existingUser) {
    let message = '用户已存在';
    if (existingUser.username === username) message = '用户名已存在';
    else if (existingUser.email === email) message = '邮箱已存在';
    else if (existingUser.phone === phone) message = '手机号已存在';
    
    throw new Error(message);
  }
  
  // 创建新用户
  const user = await User.create({
    username,
    email,
    phone,
    password,
    nickname: nickname || username,
    status: 'active'
  });
  
  // 生成token
  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });
  
  // 记录业务日志
  logBusinessAction('user_register', {
    userId: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone
  }, user);
  
  return {
    user,
    token,
    refreshToken
  };
}

/**
 * 用户登录服务
 */
async function login(account, password, req) {
  // 查找用户
  const user = await User.findByAccount(account);
  
  if (!user) {
    logSecurityEvent('login_user_not_found', { account }, req);
    throw new Error('用户不存在');
  }
  
  // 检查账户状态
  if (user.status !== 'active') {
    logSecurityEvent('login_inactive_account', { userId: user.id, status: user.status }, req);
    throw new Error('账户已被禁用');
  }
  
  // 检查账户是否被锁定
  if (user.isLocked()) {
    logSecurityEvent('login_account_locked', { userId: user.id }, req);
    throw new Error('账户已被锁定，请稍后再试');
  }
  
  // 验证密码
  const isValidPassword = await user.comparePassword(password);
  
  if (!isValidPassword) {
    // 增加登录尝试次数
    await user.incLoginAttempts();
    
    logSecurityEvent('login_invalid_password', { userId: user.id, attempts: user.login_attempts + 1 }, req);
    throw new Error('密码错误');
  }
  
  // 重置登录尝试次数
  await user.resetLoginAttempts();
  
  // 更新最后登录信息
  await user.update({
    last_login_at: new Date(),
    last_login_ip: req.ip
  });
  
  // 生成token
  const token = generateToken({ userId: user.id, username: user.username, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });
  
  // 记录业务日志
  logBusinessAction('user_login', {
    userId: user.id,
    username: user.username,
    loginIp: req.ip
  }, user);
  
  return {
    user,
    token,
    refreshToken
  };
}

/**
 * 刷新Token服务
 */
async function refreshToken(refreshTokenString) {
  try {
    const { verifyToken } = require('../utils/encrypt');
    const decoded = verifyToken(refreshTokenString);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user || user.status !== 'active') {
      throw new Error('用户不存在或已被禁用');
    }
    
    // 生成新的token
    const newToken = generateToken({ userId: user.id, username: user.username, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id });
    
    return {
      token: newToken,
      refreshToken: newRefreshToken,
      user
    };
  } catch (error) {
    throw new Error('刷新Token失败');
  }
}

/**
 * 小程序登录服务
 */
async function miniprogramLogin(code, userInfo, req) {
  const { appId, appSecret, loginUrl } = authConfig.miniprogram;
  
  if (!appId || !appSecret) {
    throw new Error('小程序配置未设置');
  }
  
  try {
    // 向微信服务器获取session_key和openid
    const response = await axios.get(loginUrl, {
      params: {
        appid: appId,
        secret: appSecret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    const { openid, session_key, unionid, errcode, errmsg } = response.data;
    
    if (errcode) {
      logSecurityEvent('miniprogram_login_failed', { errcode, errmsg, code }, req);
      throw new Error(`微信登录失败: ${errmsg}`);
    }
    
    // 查找或创建用户
    let user = await User.findOne({ where: { openid } });
    
    if (!user) {
      // 创建新用户
      user = await User.create({
        username: `wx_${openid.substring(0, 10)}`,
        nickname: userInfo?.nickName || '微信用户',
        avatar: userInfo?.avatarUrl,
        gender: userInfo?.gender === 1 ? 'male' : userInfo?.gender === 2 ? 'female' : 'unknown',
        openid,
        unionid,
        status: 'active'
      });
      
      logBusinessAction('miniprogram_user_register', {
        userId: user.id,
        openid,
        nickname: user.nickname
      }, user);
    } else {
      // 更新用户信息
      if (userInfo) {
        await user.update({
          nickname: userInfo.nickName || user.nickname,
          avatar: userInfo.avatarUrl || user.avatar,
          gender: userInfo.gender === 1 ? 'male' : userInfo.gender === 2 ? 'female' : user.gender,
          last_login_at: new Date(),
          last_login_ip: req.ip
        });
      }
      
      logBusinessAction('miniprogram_user_login', {
        userId: user.id,
        openid
      }, user);
    }
    
    // 生成token
    const token = generateToken({ userId: user.id, username: user.username, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });
    
    return {
      user,
      token,
      refreshToken,
      sessionKey: session_key
    };
    
  } catch (error) {
    if (error.response) {
      logSecurityEvent('miniprogram_api_error', { 
        status: error.response.status,
        data: error.response.data 
      }, req);
    }
    throw new Error('小程序登录失败');
  }
}

/**
 * 修改密码服务
 */
async function changePassword(userId, oldPassword, newPassword) {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 验证原密码
  const isValidPassword = await user.comparePassword(oldPassword);
  if (!isValidPassword) {
    throw new Error('原密码错误');
  }
  
  // 更新密码
  await user.update({ password: newPassword });
  
  logBusinessAction('password_changed', { userId }, user);
  
  return true;
}

/**
 * 重置密码服务（通过邮箱或手机）
 */
async function resetPassword(account, verificationCode, newPassword) {
  // 这里应该先验证验证码的有效性
  // 简化示例，实际应用中需要验证码验证逻辑
  
  const user = await User.findByAccount(account);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 更新密码
  await user.update({ 
    password: newPassword,
    login_attempts: 0,
    locked_until: null
  });
  
  logBusinessAction('password_reset', { userId: user.id }, user);
  
  return true;
}

/**
 * 验证Token服务
 */
async function validateToken(token) {
  try {
    const { verifyToken } = require('../utils/encrypt');
    const decoded = verifyToken(token);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user || user.status !== 'active') {
      throw new Error('用户不存在或已被禁用');
    }
    
    return { user, payload: decoded };
  } catch (error) {
    throw new Error('Token验证失败');
  }
}

/**
 * 登出服务
 */
async function logout(userId, req) {
  // 在实际应用中，可以将token加入黑名单
  // 或者记录登出事件
  
  logBusinessAction('user_logout', { userId }, { id: userId });
  
  return true;
}

module.exports = {
  register,
  login,
  refreshToken,
  miniprogramLogin,
  changePassword,
  resetPassword,
  validateToken,
  logout
};