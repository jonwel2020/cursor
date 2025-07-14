const { Sequelize } = require('sequelize');
const config = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建 Sequelize 实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    timezone: dbConfig.timezone,
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool,
    logging: dbConfig.logging,
    define: dbConfig.define,
    
    // 自动重连配置
    retry: {
      match: [
        /ECONNRESET/,
        /ETIMEDOUT/,
        /ENOTFOUND/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 3
    }
  }
);

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 优雅关闭数据库连接
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('📊 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
  }
}

// 数据库健康检查
async function healthCheck() {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      message: '数据库连接正常',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: '数据库连接异常',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  sequelize,
  testConnection,
  closeConnection,
  healthCheck
};

// 导出 sequelize 实例作为默认导出，以便其他地方使用
module.exports.default = sequelize;