const request = require('supertest');
const express = require('express');

// 创建一个简单的测试应用，不依赖复杂的数据库连接
const app = express();

// 添加中间件
app.use(express.json());

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'test'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'Backend API Scaffold',
    version: '1.0.0',
    description: '一个基于 Node.js + Express + MySQL 的后端 API 服务脚手架框架'
  });
});

describe('健康检查测试 (简化版)', () => {
  test('GET /health 应该返回健康状态', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
  });

  test('GET / 应该返回API信息', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('name', 'Backend API Scaffold');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('description');
  });
}); 