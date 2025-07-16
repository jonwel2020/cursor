require('dotenv').config();
const { sequelize } = require('./connection');

// 导入所有模型
const User = require('../models/User');

/**
 * 数据库迁移脚本
 * 这个脚本会同步所有数据库模型到数据库
 */
async function migrate() {
  try {
    console.log('🔄 开始数据库迁移...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步模型到数据库
    await sequelize.sync({ 
      force: process.env.DB_FORCE_SYNC === 'true',
      alter: process.env.DB_ALTER_SYNC === 'true' || process.env.NODE_ENV === 'development'
    });
    
    console.log('✅ 数据库模型同步完成');
    console.log('📊 迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此文件，执行迁移
if (require.main === module) {
  migrate();
}

module.exports = { migrate };