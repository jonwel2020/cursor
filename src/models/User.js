const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const { hashPassword } = require('../utils/encrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名',
    validate: {
      notEmpty: true,
      len: [3, 50],
      is: /^[a-zA-Z0-9_]+$/
    }
  },
  
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: '邮箱地址',
    validate: {
      isEmail: true
    }
  },
  
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
    comment: '手机号码',
    validate: {
      is: /^1[3-9]\d{9}$/
    }
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '密码哈希'
  },
  
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '昵称',
    validate: {
      len: [1, 50]
    }
  },
  
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '头像URL'
  },
  
  gender: {
    type: DataTypes.ENUM('male', 'female', 'unknown'),
    allowNull: false,
    defaultValue: 'unknown',
    comment: '性别'
  },
  
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '生日'
  },
  
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'moderator', 'user', 'guest'),
    allowNull: false,
    defaultValue: 'user',
    comment: '用户角色'
  },
  
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned', 'pending'),
    allowNull: false,
    defaultValue: 'active',
    comment: '账户状态'
  },
  
  // 小程序相关字段
  openid: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: '微信小程序OpenID'
  },
  
  unionid: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: '微信UnionID'
  },
  
  // 认证相关字段
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '邮箱是否已验证'
  },
  
  phone_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '手机号是否已验证'
  },
  
  // 安全相关字段
  login_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '登录尝试次数'
  },
  
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '账户锁定到期时间'
  },
  
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  
  last_login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '最后登录IP'
  },
  
  // 时间戳
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  },
  
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '删除时间'
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_username',
      fields: ['username']
    },
    {
      name: 'idx_email',
      fields: ['email']
    },
    {
      name: 'idx_phone',
      fields: ['phone']
    },
    {
      name: 'idx_openid',
      fields: ['openid']
    },
    {
      name: 'idx_status',
      fields: ['status']
    },
    {
      name: 'idx_role',
      fields: ['role']
    }
  ]
});

// 实例方法
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  // 隐藏敏感字段
  delete values.password;
  delete values.login_attempts;
  delete values.locked_until;
  return values;
};

// 检查账户是否被锁定
User.prototype.isLocked = function() {
  return !!(this.locked_until && this.locked_until > Date.now());
};

// 增加登录尝试次数
User.prototype.incLoginAttempts = async function() {
  const authConfig = require('../../config/auth');
  
  // 如果已经锁定且锁定时间已过，重置计数器
  if (this.locked_until && this.locked_until < Date.now()) {
    return this.update({
      login_attempts: 1,
      locked_until: null
    });
  }
  
  const updates = {
    login_attempts: this.login_attempts + 1
  };
  
  // 如果达到最大尝试次数，锁定账户
  if (this.login_attempts + 1 >= authConfig.lockout.maxAttempts && !this.isLocked()) {
    updates.locked_until = new Date(Date.now() + authConfig.lockout.lockoutDuration);
  }
  
  return this.update(updates);
};

// 重置登录尝试次数
User.prototype.resetLoginAttempts = async function() {
  return this.update({
    login_attempts: 0,
    locked_until: null,
    last_login_at: new Date(),
    last_login_ip: null // 需要在调用时传入IP
  });
};

// 检查密码
User.prototype.comparePassword = async function(password) {
  const { verifyPassword } = require('../utils/encrypt');
  return await verifyPassword(password, this.password);
};

// 类方法
User.findByAccount = async function(account) {
  return await this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { username: account },
        { email: account },
        { phone: account }
      ]
    }
  });
};

// 创建用户前的钩子
User.beforeCreate(async (user, options) => {
  if (user.password) {
    user.password = await hashPassword(user.password);
  }
});

// 更新用户前的钩子
User.beforeUpdate(async (user, options) => {
  if (user.changed('password') && user.password) {
    user.password = await hashPassword(user.password);
  }
});

module.exports = User;