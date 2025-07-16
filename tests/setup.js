// 测试环境设置
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'scaffold_test_db';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';

// 设置测试超时
jest.setTimeout(30000);

// 全局测试清理
afterAll(async () => {
  // 确保所有异步操作完成
  await new Promise(resolve => setTimeout(resolve, 1000));
}); 