# API 文档

## 概述

这是一个基于 Node.js + Express + MySQL 的后端 API 服务脚手架框架，提供完整的用户认证、权限管理、数据操作等通用功能，支持小程序端和后台管理端。

## 基础信息

- **基础URL**: `http://localhost:3000`
- **API版本**: v1.0.0
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {}, 
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "code": 400,
  "message": "错误信息",
  "errors": [],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 分页响应
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": [],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 认证接口

### 用户注册
- **URL**: `POST /api/v1/auth/register`
- **描述**: 用户注册
- **参数**:
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800000000",
    "password": "123456",
    "confirmPassword": "123456",
    "nickname": "测试用户"
  }
  ```

### 用户登录
- **URL**: `POST /api/v1/auth/login`
- **描述**: 用户登录
- **参数**:
  ```json
  {
    "account": "testuser",
    "password": "123456"
  }
  ```

### 刷新Token
- **URL**: `POST /api/v1/auth/refresh`
- **描述**: 刷新访问令牌
- **参数**:
  ```json
  {
    "refreshToken": "refresh_token_string"
  }
  ```

### 用户登出
- **URL**: `POST /api/v1/auth/logout`
- **描述**: 用户登出
- **认证**: 需要
- **参数**: 无

### 修改密码
- **URL**: `POST /api/v1/auth/change-password`
- **描述**: 修改密码
- **认证**: 需要
- **参数**:
  ```json
  {
    "oldPassword": "123456",
    "newPassword": "newpassword",
    "confirmNewPassword": "newpassword"
  }
  ```

### 小程序登录
- **URL**: `POST /api/v1/auth/miniprogram/login`
- **描述**: 小程序登录
- **参数**:
  ```json
  {
    "code": "wx_login_code",
    "userInfo": {
      "nickName": "微信用户",
      "avatarUrl": "https://example.com/avatar.jpg",
      "gender": 1
    }
  }
  ```

## 用户接口

### 获取用户资料
- **URL**: `GET /api/v1/user/profile`
- **描述**: 获取当前用户资料
- **认证**: 需要

### 更新用户资料
- **URL**: `PUT /api/v1/user/profile`
- **描述**: 更新用户资料
- **认证**: 需要
- **参数**:
  ```json
  {
    "nickname": "新昵称",
    "email": "new@example.com",
    "phone": "13800000001",
    "avatar": "https://example.com/avatar.jpg",
    "gender": "male",
    "birthday": "1990-01-01"
  }
  ```

### 获取指定用户信息
- **URL**: `GET /api/v1/user/:id`
- **描述**: 获取指定用户的公开信息
- **认证**: 需要

### 搜索用户
- **URL**: `GET /api/v1/user/search`
- **描述**: 搜索用户
- **认证**: 需要
- **参数**: `keyword`, `limit`

## 小程序专用接口

### 小程序登录
- **URL**: `POST /api/v1/miniprogram/login`
- **描述**: 小程序登录

### 获取小程序配置
- **URL**: `GET /api/v1/miniprogram/data/config`
- **描述**: 获取小程序配置信息

### 获取版本信息
- **URL**: `GET /api/v1/miniprogram/version`
- **描述**: 获取小程序版本信息

## 管理员接口

所有管理员接口都需要管理员权限。

### 获取用户列表
- **URL**: `GET /api/admin/users`
- **描述**: 获取用户列表（分页）
- **权限**: 管理员
- **参数**: `search`, `role`, `status`, `page`, `limit`, `sort`

### 获取用户统计
- **URL**: `GET /api/admin/users/stats`
- **描述**: 获取用户统计信息
- **权限**: 管理员

### 更新用户信息
- **URL**: `PUT /api/admin/users/:id`
- **描述**: 更新用户信息
- **权限**: 管理员

### 删除用户
- **URL**: `DELETE /api/admin/users/:id`
- **描述**: 软删除用户
- **权限**: 管理员

### 恢复用户
- **URL**: `POST /api/admin/users/:id/restore`
- **描述**: 恢复已删除的用户
- **权限**: 管理员

### 批量操作用户
- **URL**: `POST /api/admin/users/batch`
- **描述**: 批量更新用户
- **权限**: 超级管理员

### 系统信息
- **URL**: `GET /api/admin/system/info`
- **描述**: 获取系统信息
- **权限**: 管理员

### 健康检查
- **URL**: `GET /api/admin/system/health`
- **描述**: 系统健康检查
- **权限**: 管理员

## 状态码说明

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `422` - 数据验证失败
- `429` - 请求过于频繁
- `500` - 服务器内部错误

## 用户角色权限

- `guest` - 游客（权限等级：0）
- `user` - 普通用户（权限等级：10）
- `moderator` - 版主（权限等级：20）
- `admin` - 管理员（权限等级：30）
- `super_admin` - 超级管理员（权限等级：99）

## 错误码说明

### 认证相关
- `AUTH_001` - Token缺失
- `AUTH_002` - Token无效
- `AUTH_003` - Token过期
- `AUTH_004` - 权限不足
- `AUTH_005` - 账户被锁定

### 用户相关
- `USER_001` - 用户不存在
- `USER_002` - 用户名已存在
- `USER_003` - 邮箱已存在
- `USER_004` - 手机号已存在
- `USER_005` - 密码错误

### 数据验证
- `VALID_001` - 参数缺失
- `VALID_002` - 参数格式错误
- `VALID_003` - 参数长度不符
- `VALID_004` - 参数值不符合要求

## 开发指南

### 添加新的业务模块

1. **创建数据模型** - 在 `src/models/` 目录下创建模型文件
2. **创建服务层** - 在 `src/services/` 目录下创建业务逻辑
3. **创建控制器** - 在 `src/controllers/` 目录下创建控制器
4. **定义路由** - 在 `src/routes/` 目录下定义路由
5. **添加验证** - 使用中间件进行参数验证

### 数据库操作

```bash
# 运行迁移
npm run migrate

# 创建种子数据
npm run seed
```

### 测试账户

- 超级管理员: `admin / admin123456`
- 管理员: `manager / manager123456`
- 测试用户: `user001 / user123456`

## 部署说明

### 环境变量配置

复制 `.env.example` 到 `.env` 并配置相应的值：

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-jwt-secret
```

### 生产环境部署

1. 安装依赖: `npm install --production`
2. 配置环境变量
3. 运行数据库迁移: `npm run migrate`
4. 启动服务: `npm start`

## 许可证

MIT License