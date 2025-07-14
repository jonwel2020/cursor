# 开发指南

## 项目结构

```
backend-api-scaffold/
├── package.json              # 项目配置和依赖
├── app.js                   # 应用入口文件
├── .env.example             # 环境变量模板
├── .gitignore               # Git忽略文件
├── README.md                # 项目说明
├── config/                  # 配置文件
│   ├── app.js              # 应用配置
│   ├── database.js         # 数据库配置
│   └── auth.js             # 认证配置
├── src/                     # 源代码
│   ├── controllers/        # 控制器层
│   │   ├── auth.js         # 认证控制器
│   │   └── user.js         # 用户控制器
│   ├── middleware/         # 中间件
│   │   ├── auth.js         # 认证中间件
│   │   ├── error.js        # 错误处理中间件
│   │   └── logger.js       # 日志中间件
│   ├── models/             # 数据模型
│   │   └── User.js         # 用户模型
│   ├── routes/             # 路由定义
│   │   ├── index.js        # 主路由
│   │   └── api/            # API路由
│   │       ├── v1/         # v1版本API
│   │       └── admin/      # 管理员API
│   ├── services/           # 业务逻辑层
│   │   ├── authService.js  # 认证服务
│   │   └── userService.js  # 用户服务
│   ├── utils/              # 工具函数
│   │   ├── response.js     # 响应工具
│   │   ├── validate.js     # 验证工具
│   │   ├── encrypt.js      # 加密工具
│   │   └── logger.js       # 日志工具
│   └── database/           # 数据库相关
│       ├── connection.js   # 数据库连接
│       ├── migrate.js      # 迁移脚本
│       └── seed.js         # 种子数据
├── docs/                    # 文档
│   ├── API.md              # API文档
│   └── DEVELOPMENT.md      # 开发指南
├── logs/                    # 日志文件（自动生成）
└── uploads/                 # 上传文件（自动生成）
```

## 开发环境搭建

### 1. 环境要求

- Node.js >= 16.0.0
- MySQL >= 5.7
- npm >= 7.0.0

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=scaffold_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

### 4. 数据库初始化

```bash
# 运行数据库迁移
npm run migrate

# 创建测试数据
npm run seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器启动后，可以访问：
- API服务: http://localhost:3000
- 健康检查: http://localhost:3000/health
- API文档: http://localhost:3000/docs

## 开发规范

### 1. 代码风格

- 使用 2 个空格缩进
- 使用单引号
- 行末不加分号
- 函数名使用驼峰命名
- 常量使用大写下划线命名

### 2. 提交规范

使用语义化提交信息：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建或工具相关

示例：
```bash
git commit -m "feat: 添加用户注册功能"
git commit -m "fix: 修复登录验证错误"
git commit -m "docs: 更新API文档"
```

### 3. 分支管理

- `main` - 主分支，用于生产环境
- `develop` - 开发分支
- `feature/*` - 功能分支
- `hotfix/*` - 热修复分支

### 4. API设计规范

#### RESTful API

- 使用HTTP动词表示操作：
  - `GET` - 获取资源
  - `POST` - 创建资源
  - `PUT` - 更新资源
  - `DELETE` - 删除资源

- URL命名规范：
  - 使用复数形式：`/users` 而不是 `/user`
  - 使用小写字母和连字符：`/user-profiles`
  - 版本控制：`/api/v1/users`

#### 响应格式

统一使用工具函数返回响应：
```javascript
const { success, error, paginated } = require('../utils/response');

// 成功响应
return success(res, data, '操作成功');

// 错误响应
return error(res, '操作失败', 400);

// 分页响应
return paginated(res, data, pagination, '获取成功');
```

### 5. 错误处理

#### 使用自定义错误类

```javascript
const { AppError, ValidationError } = require('../middleware/error');

// 抛出业务错误
throw new AppError('用户不存在', 404);

// 抛出验证错误
throw new ValidationError('数据验证失败', errors);
```

#### 异步错误处理

使用 `asyncHandler` 包装异步函数：
```javascript
const { asyncHandler } = require('../utils/response');

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return success(res, user);
});
```

### 6. 数据验证

使用 express-validator 进行数据验证：
```javascript
const { body, validationResult } = require('express-validator');
const { handleValidationErrors } = require('../utils/validate');

const validateUser = [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3个字符'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  handleValidationErrors
];

router.post('/users', validateUser, createUser);
```

### 7. 数据库操作

#### 模型定义

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Model = sequelize.define('ModelName', {
  // 字段定义
}, {
  tableName: 'table_name',
  timestamps: true,
  paranoid: true,
  underscored: true
});
```

#### 查询优化

- 使用 `attributes` 选择需要的字段
- 使用 `include` 进行关联查询
- 使用索引优化查询性能
- 避免 N+1 查询问题

### 8. 日志记录

使用统一的日志工具：
```javascript
const { logBusinessAction, logSecurityEvent } = require('../utils/logger');

// 记录业务操作
logBusinessAction('user_created', { userId: user.id }, operator);

// 记录安全事件
logSecurityEvent('login_failed', { reason: 'invalid_password' }, req);
```

### 9. 测试

#### 单元测试

```javascript
const request = require('supertest');
const app = require('../app');

describe('User API', () => {
  test('GET /api/v1/users', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

#### 集成测试

测试完整的API流程，包括数据库操作。

### 10. 性能优化

#### 数据库优化

- 合理使用索引
- 避免 SELECT *
- 使用分页查询
- 使用连接池

#### 缓存策略

- 对频繁查询的数据进行缓存
- 使用适当的缓存过期策略
- 考虑使用 Redis 作为缓存存储

#### 请求优化

- 使用请求压缩
- 实现请求限流
- 优化数据库查询

## 常见问题

### 1. 数据库连接失败

检查数据库配置和网络连接：
```bash
# 测试数据库连接
mysql -h localhost -u root -p
```

### 2. JWT Token 验证失败

检查 JWT_SECRET 配置和 token 格式。

### 3. 权限验证失败

确认用户角色和权限配置正确。

### 4. 文件上传失败

检查上传目录权限和文件大小限制。

### 5. 日志文件过大

配置日志轮转策略，定期清理旧日志。

## 部署指南

### 1. 生产环境配置

```env
NODE_ENV=production
PORT=3000
# 使用强密码
JWT_SECRET=your_very_secure_jwt_secret_here
# 生产数据库配置
DB_HOST=your_production_db_host
```

### 2. 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start app.js --name "api-scaffold"

# 查看状态
pm2 status

# 查看日志
pm2 logs api-scaffold
```

### 3. 使用 Docker 部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 4. 反向代理配置

使用 Nginx 作为反向代理：
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 贡献指南

1. Fork 项目
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -m 'feat: 添加新功能'`
4. 推送到分支: `git push origin feature/new-feature`
5. 提交 Pull Request

## 许可证

MIT License