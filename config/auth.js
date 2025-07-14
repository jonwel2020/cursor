module.exports = {
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'backend-api-scaffold',
    audience: 'scaffold-client'
  },
  
  // 密码策略
  password: {
    minLength: 6,
    maxLength: 128,
    requireNumbers: false,
    requireLowercase: false,
    requireUppercase: false,
    requireSymbols: false,
    saltRounds: 12
  },
  
  // 账户锁定策略
  lockout: {
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分钟
    enabled: true
  },
  
  // 会话配置
  session: {
    maxSessions: 5, // 每个用户最大会话数
    cleanupInterval: 60 * 60 * 1000 // 1小时清理一次过期会话
  },
  
  // 权限角色定义
  roles: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    USER: 'user',
    GUEST: 'guest'
  },
  
  // 权限等级（数字越大权限越高）
  roleHierarchy: {
    guest: 0,
    user: 10,
    moderator: 20,
    admin: 30,
    super_admin: 99
  },
  
  // 小程序配置
  miniprogram: {
    appId: process.env.MINIPROGRAM_APP_ID,
    appSecret: process.env.MINIPROGRAM_APP_SECRET,
    loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',
    grantType: 'authorization_code'
  },
  
  // OAuth配置（可扩展其他第三方登录）
  oauth: {
    wechat: {
      enabled: !!process.env.MINIPROGRAM_APP_ID,
      appId: process.env.MINIPROGRAM_APP_ID,
      appSecret: process.env.MINIPROGRAM_APP_SECRET
    }
  },
  
  // 验证码配置
  verification: {
    codeLength: 6,
    expirationTime: 5 * 60 * 1000, // 5分钟
    maxSendCount: 5, // 每小时最多发送次数
    cooldownTime: 60 * 1000 // 1分钟冷却时间
  }
};