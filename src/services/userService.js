const User = require('../models/User');
const { logBusinessAction, logDatabaseOperation } = require('../utils/logger');
const { Op } = require('sequelize');
const appConfig = require('../../config/app');

/**
 * 获取用户信息服务
 */
async function getUserById(userId, includeDeleted = false) {
  const options = {
    attributes: { exclude: ['password', 'login_attempts', 'locked_until'] }
  };
  
  if (includeDeleted) {
    options.paranoid = false;
  }
  
  const user = await User.findByPk(userId, options);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  return user;
}

/**
 * 更新用户资料服务
 */
async function updateUserProfile(userId, updateData, operator) {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 过滤允许更新的字段
  const allowedFields = ['nickname', 'avatar', 'gender', 'birthday', 'email', 'phone'];
  const filteredData = {};
  
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key) && updateData[key] !== undefined) {
      filteredData[key] = updateData[key];
    }
  });
  
  // 检查邮箱和手机号唯一性
  if (filteredData.email || filteredData.phone) {
    const whereConditions = [];
    if (filteredData.email) whereConditions.push({ email: filteredData.email });
    if (filteredData.phone) whereConditions.push({ phone: filteredData.phone });
    
    const existingUser = await User.findOne({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: userId } },
          { [Op.or]: whereConditions }
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === filteredData.email) {
        throw new Error('邮箱已被其他用户使用');
      }
      if (existingUser.phone === filteredData.phone) {
        throw new Error('手机号已被其他用户使用');
      }
    }
  }
  
  // 更新用户信息
  const updatedUser = await user.update(filteredData);
  
  logBusinessAction('user_profile_updated', {
    userId,
    updatedFields: Object.keys(filteredData)
  }, operator);
  
  logDatabaseOperation('update', 'users', { id: userId }, operator);
  
  return updatedUser;
}

/**
 * 获取用户列表服务（管理员功能）
 */
async function getUserList(filters = {}, pagination = {}) {
  const {
    search,
    role,
    status,
    gender,
    startDate,
    endDate
  } = filters;
  
  const {
    page = appConfig.pagination.defaultPage,
    limit = appConfig.pagination.defaultLimit,
    sort = 'created_at:desc'
  } = pagination;
  
  // 构建查询条件
  const whereConditions = {};
  
  if (search) {
    whereConditions[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { nickname: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } }
    ];
  }
  
  if (role) {
    whereConditions.role = role;
  }
  
  if (status) {
    whereConditions.status = status;
  }
  
  if (gender) {
    whereConditions.gender = gender;
  }
  
  if (startDate || endDate) {
    whereConditions.created_at = {};
    if (startDate) whereConditions.created_at[Op.gte] = new Date(startDate);
    if (endDate) whereConditions.created_at[Op.lte] = new Date(endDate);
  }
  
  // 构建排序条件
  const [sortField, sortOrder] = sort.split(':');
  const order = [[sortField, sortOrder.toUpperCase()]];
  
  // 计算偏移量
  const offset = (page - 1) * limit;
  
  // 查询用户列表
  const { count, rows: users } = await User.findAndCountAll({
    where: whereConditions,
    attributes: { exclude: ['password', 'login_attempts', 'locked_until'] },
    order,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  return {
    users,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    }
  };
}

/**
 * 删除用户服务（软删除）
 */
async function deleteUser(userId, operator) {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 软删除用户
  await user.destroy();
  
  logBusinessAction('user_deleted', { userId }, operator);
  logDatabaseOperation('delete', 'users', { id: userId }, operator);
  
  return true;
}

/**
 * 恢复用户服务
 */
async function restoreUser(userId, operator) {
  const user = await User.findByPk(userId, { paranoid: false });
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  if (!user.deleted_at) {
    throw new Error('用户未被删除');
  }
  
  // 恢复用户
  await user.restore();
  
  logBusinessAction('user_restored', { userId }, operator);
  logDatabaseOperation('restore', 'users', { id: userId }, operator);
  
  return true;
}

/**
 * 更新用户状态服务
 */
async function updateUserStatus(userId, status, operator) {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  const validStatuses = ['active', 'inactive', 'banned', 'pending'];
  if (!validStatuses.includes(status)) {
    throw new Error('无效的状态值');
  }
  
  await user.update({ status });
  
  logBusinessAction('user_status_changed', {
    userId,
    oldStatus: user.status,
    newStatus: status
  }, operator);
  
  return user;
}

/**
 * 更新用户角色服务
 */
async function updateUserRole(userId, role, operator) {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  const validRoles = ['super_admin', 'admin', 'moderator', 'user', 'guest'];
  if (!validRoles.includes(role)) {
    throw new Error('无效的角色');
  }
  
  const oldRole = user.role;
  await user.update({ role });
  
  logBusinessAction('user_role_changed', {
    userId,
    oldRole,
    newRole: role
  }, operator);
  
  return user;
}

/**
 * 获取用户统计信息
 */
async function getUserStats() {
  const totalUsers = await User.count();
  const activeUsers = await User.count({ where: { status: 'active' } });
  const bannedUsers = await User.count({ where: { status: 'banned' } });
  const todayUsers = await User.count({
    where: {
      created_at: {
        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });
  
  // 按角色统计
  const roleStats = await User.findAll({
    attributes: [
      'role',
      [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
    ],
    group: ['role']
  });
  
  // 按性别统计
  const genderStats = await User.findAll({
    attributes: [
      'gender',
      [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']
    ],
    group: ['gender']
  });
  
  return {
    total: totalUsers,
    active: activeUsers,
    banned: bannedUsers,
    today: todayUsers,
    roleDistribution: roleStats.map(item => ({
      role: item.role,
      count: parseInt(item.get('count'))
    })),
    genderDistribution: genderStats.map(item => ({
      gender: item.gender,
      count: parseInt(item.get('count'))
    }))
  };
}

/**
 * 搜索用户服务
 */
async function searchUsers(keyword, limit = 10) {
  const users = await User.findAll({
    where: {
      [Op.or]: [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } }
      ],
      status: 'active'
    },
    attributes: ['id', 'username', 'nickname', 'avatar', 'email'],
    limit: parseInt(limit)
  });
  
  return users;
}

/**
 * 批量操作用户服务
 */
async function batchUpdateUsers(userIds, updateData, operator) {
  const allowedFields = ['status', 'role'];
  const filteredData = {};
  
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key) && updateData[key] !== undefined) {
      filteredData[key] = updateData[key];
    }
  });
  
  if (Object.keys(filteredData).length === 0) {
    throw new Error('没有有效的更新字段');
  }
  
  const [affectedCount] = await User.update(filteredData, {
    where: { id: { [Op.in]: userIds } }
  });
  
  logBusinessAction('batch_update_users', {
    userIds,
    updateData: filteredData,
    affectedCount
  }, operator);
  
  return affectedCount;
}

module.exports = {
  getUserById,
  updateUserProfile,
  getUserList,
  deleteUser,
  restoreUser,
  updateUserStatus,
  updateUserRole,
  getUserStats,
  searchUsers,
  batchUpdateUsers
};