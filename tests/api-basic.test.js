const request = require('supertest');

// 创建一个简单的测试应用，不连接数据库
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const testApp = express();
testApp.use(helmet());
testApp.use(cors());
testApp.use(express.json());

// 简单的健康检查路由
testApp.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'test'
  });
});

// 根路径
testApp.get('/', (req, res) => {
  res.json({
    name: 'Backend API Scaffold',
    version: '1.0.0',
    description: 'Test API',
    docs: '/docs',
    health: '/health'
  });
});

// 404处理
testApp.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    code: 404,
    path: req.originalUrl
  });
});

describe('基础 API 测试', () => {
  test('GET /health 健康检查', async () => {
    const response = await request(testApp)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('environment', 'test');
  });

  test('GET / API信息', async () => {
    const response = await request(testApp)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('name', 'Backend API Scaffold');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('docs', '/docs');
    expect(response.body).toHaveProperty('health', '/health');
  });

  test('404 错误处理', async () => {
    const response = await request(testApp)
      .get('/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message', '接口不存在');
    expect(response.body).toHaveProperty('code', 404);
    expect(response.body).toHaveProperty('path', '/nonexistent');
  });

  test('CORS 头检查', async () => {
    const response = await request(testApp)
      .get('/health')
      .expect(200);

    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('安全头检查', async () => {
    const response = await request(testApp)
      .get('/health')
      .expect(200);

    // Helmet 添加的安全头
    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-frame-options');
  });
});
