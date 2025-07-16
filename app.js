require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 导入配置
const appConfig = require('./config/app');
const databaseConfig = require('./config/database');

// 导入中间件
const logger = require('./src/middleware/logger');
const { errorHandler } = require('./src/middleware/error');

// 导入路由
const routes = require('./src/routes');

// 导入数据库连接
const { sequelize } = require('./src/database/connection');

const app = express();

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: appConfig.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 请求限制
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.maxRequests,
  message: {
    error: '请求过于频繁，请稍后再试',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 日志中间件
app.use(logger.requestLogger);

// API路由
app.use('/', routes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    code: 404,
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use(errorHandler);

// 数据库连接和服务启动
async function startServer() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 同步数据库模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('📊 数据库模型同步完成');
    }

    // 启动服务器
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 服务器启动成功，端口: ${PORT}`);
      console.log(`📖 API文档: http://localhost:${PORT}/docs`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('📱 接收到 SIGTERM 信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📱 接收到 SIGINT 信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;