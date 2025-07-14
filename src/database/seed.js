require('dotenv').config();
const { sequelize } = require('./connection');
const User = require('../models/User');

/**
 * 种子数据脚本
 * 创建初始的测试数据
 */
async function seed() {
  try {
    console.log('🌱 开始创建种子数据...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 创建超级管理员
    const superAdmin = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123456',
        nickname: '超级管理员',
        role: 'super_admin',
        status: 'active',
        email_verified: true
      }
    });
    
    if (superAdmin[1]) {
      console.log('👑 创建超级管理员: admin / admin123456');
    } else {
      console.log('👑 超级管理员已存在');
    }
    
    // 创建普通管理员
    const admin = await User.findOrCreate({
      where: { username: 'manager' },
      defaults: {
        username: 'manager',
        email: 'manager@example.com',
        password: 'manager123456',
        nickname: '管理员',
        role: 'admin',
        status: 'active',
        email_verified: true
      }
    });
    
    if (admin[1]) {
      console.log('👨‍💼 创建管理员: manager / manager123456');
    } else {
      console.log('👨‍💼 管理员已存在');
    }
    
    // 创建测试用户
    const testUsers = [
      {
        username: 'user001',
        email: 'user001@example.com',
        password: 'user123456',
        nickname: '测试用户001',
        phone: '13800000001',
        gender: 'male'
      },
      {
        username: 'user002',
        email: 'user002@example.com',
        password: 'user123456',
        nickname: '测试用户002',
        phone: '13800000002',
        gender: 'female'
      },
      {
        username: 'user003',
        email: 'user003@example.com',
        password: 'user123456',
        nickname: '测试用户003',
        phone: '13800000003',
        gender: 'unknown'
      }
    ];
    
    let createdCount = 0;
    for (const userData of testUsers) {
      const [user, created] = await User.findOrCreate({
        where: { username: userData.username },
        defaults: {
          ...userData,
          role: 'user',
          status: 'active'
        }
      });
      
      if (created) {
        createdCount++;
        console.log(`👤 创建测试用户: ${userData.username} / ${userData.password}`);
      }
    }
    
    if (createdCount === 0) {
      console.log('👤 测试用户已存在');
    }
    
    // 创建小程序测试用户
    const miniprogramUser = await User.findOrCreate({
      where: { openid: 'test_openid_123456' },
      defaults: {
        username: 'wx_test_user',
        nickname: '微信测试用户',
        openid: 'test_openid_123456',
        role: 'user',
        status: 'active',
        gender: 'unknown'
      }
    });
    
    if (miniprogramUser[1]) {
      console.log('📱 创建小程序测试用户');
    } else {
      console.log('📱 小程序测试用户已存在');
    }
    
    console.log('✅ 种子数据创建完成！');
    console.log('');
    console.log('🔑 默认账户信息:');
    console.log('   超级管理员: admin / admin123456');
    console.log('   管理员: manager / manager123456');
    console.log('   测试用户: user001 / user123456');
    console.log('   测试用户: user002 / user123456');
    console.log('   测试用户: user003 / user123456');
    console.log('');
    
  } catch (error) {
    console.error('❌ 种子数据创建失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此文件，执行种子数据创建
if (require.main === module) {
  seed();
}

module.exports = { seed };