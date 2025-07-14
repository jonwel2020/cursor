# Backend API Scaffold

一个基于 Node.js + Express + MySQL 的后端 API 服务脚手架框架，提供完整的用户认证、权限管理、数据操作等通用功能，支持小程序端和后台管理端。

## 🚀 特性

- **完整的用户认证系统** - JWT Token 认证、密码加密
- **权限管理** - 基于角色的访问控制(RBAC)
- **双端支持** - 小程序端API和后台管理端API
- **数据库操作** - Sequelize ORM，支持迁移和种子数据
- **安全防护** - Helmet、CORS、请求限制
- **日志系统** - Winston 日志记录，按日期轮转
- **参数验证** - Express Validator 数据验证
- **错误处理** - 统一的错误处理机制
- **文件上传** - 多文件上传支持
- **API文档** - 自动生成API文档

## 📁 项目结构

```
backend-api-scaffold/
├── package.json
├── app.js                 # 应用入口
├── .env.example          # 环境变量模板
├── config/               # 配置文件
│   ├── database.js      # 数据库配置
│   ├── app.js          # 应用配置
│   └── auth.js         # 认证配置
├── src/
│   ├── controllers/     # 控制器层
│   ├── middleware/      # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由定义
│   ├── services/       # 业务逻辑层
│   ├── utils/          # 工具函数
│   └── database/       # 数据库操作
└── docs/               # 文档
```

## 🛠 安装和使用

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd backend-api-scaffold
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

### 4. 初始化数据库
```bash
# 运行数据库迁移
npm run migrate

# 运行种子数据（可选）
npm run seed
```

### 5. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 📖 API 接口

### 小程序端 API
- **基础路径**: `/api/v1/`
- **认证**: Bearer Token

### 后台管理端 API
- **基础路径**: `/api/admin/`
- **认证**: Bearer Token + 管理员权限

### 主要接口

#### 用户认证
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/refresh` - 刷新Token
- `POST /api/v1/auth/logout` - 用户退出

#### 用户管理
- `GET /api/v1/user/profile` - 获取用户信息
- `PUT /api/v1/user/profile` - 更新用户信息
- `POST /api/v1/user/avatar` - 上传头像

#### 管理端
- `GET /api/admin/users` - 获取用户列表
- `PUT /api/admin/users/:id` - 更新用户信息
- `DELETE /api/admin/users/:id` - 删除用户

## 🔧 开发指南

### 添加新的业务模块

1. **创建数据模型** - 在 `src/models/` 目录下创建模型文件
2. **创建服务层** - 在 `src/services/` 目录下创建业务逻辑
3. **创建控制器** - 在 `src/controllers/` 目录下创建控制器
4. **定义路由** - 在 `src/routes/` 目录下定义路由
5. **添加验证** - 使用中间件进行参数验证

### 数据库迁移

```bash
# 创建新的迁移文件
node src/database/createMigration.js <migration_name>

# 运行迁移
npm run migrate
```

### 生成API文档

```bash
npm run docs
```

文档将生成在 `docs/api/` 目录下。

## 🔐 环境变量

```env
# 应用配置
NODE_ENV=development
PORT=3000
APP_SECRET=your-secret-key

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=scaffold_db
DB_USER=root
DB_PASSWORD=password

# JWT配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 文件上传
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5MB
```

## 📝 许可证

MIT License