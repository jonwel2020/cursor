const { logError } = require('../utils/logger');

/**
 * 统一错误处理中间件
 */
function errorHandler(error, req, res, next) {
  // 记录错误日志
  logError(error, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // 默认错误信息
  let statusCode = 500;
  let message = '服务器内部错误';
  let errors = null;

  // 根据错误类型设置响应信息
  if (error.name === 'ValidationError') {
    // Sequelize 验证错误
    statusCode = 422;
    message = '数据验证失败';
    errors = error.errors?.map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
  } else if (error.name === 'UniqueConstraintError') {
    // Sequelize 唯一约束错误
    statusCode = 409;
    message = '数据已存在';
    errors = error.errors?.map(err => ({
      field: err.path,
      message: `${err.path} 已存在`,
      value: err.value
    }));
  } else if (error.name === 'ForeignKeyConstraintError') {
    // Sequelize 外键约束错误
    statusCode = 400;
    message = '关联数据不存在';
  } else if (error.name === 'DatabaseError') {
    // Sequelize 数据库错误
    statusCode = 500;
    message = '数据库操作失败';
  } else if (error.name === 'SequelizeConnectionError') {
    // Sequelize 连接错误
    statusCode = 503;
    message = '数据库连接失败';
  } else if (error.name === 'JsonWebTokenError') {
    // JWT 错误
    statusCode = 401;
    message = '认证失败';
  } else if (error.name === 'TokenExpiredError') {
    // JWT 过期错误
    statusCode = 401;
    message = 'Token已过期';
  } else if (error.name === 'MulterError') {
    // 文件上传错误
    statusCode = 400;
    if (error.code === 'LIMIT_FILE_SIZE') {
      message = '文件大小超过限制';
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      message = '文件数量超过限制';
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      message = '文件字段名不正确';
    } else {
      message = '文件上传失败';
    }
  } else if (error.name === 'SyntaxError' && error.type === 'entity.parse.failed') {
    // JSON 解析错误
    statusCode = 400;
    message = '请求数据格式错误';
  } else if (error.name === 'CastError') {
    // 类型转换错误
    statusCode = 400;
    message = '参数类型错误';
  } else if (error.status || error.statusCode) {
    // 自定义状态码错误
    statusCode = error.status || error.statusCode;
    message = error.message || message;
  } else if (error.message) {
    // 其他已知错误
    message = error.message;
  }

  // 开发环境下显示完整错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  const response = {
    success: false,
    code: statusCode,
    message,
    timestamp: new Date().toISOString()
  };

  // 添加详细错误信息
  if (errors) {
    response.errors = errors;
  }

  // 开发环境添加堆栈信息
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  // 避免敏感信息泄露
  if (statusCode === 500 && !isDevelopment) {
    response.message = '服务器内部错误';
  }

  res.status(statusCode).json(response);
}

/**
 * 404 错误处理中间件
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`路径 ${req.originalUrl} 不存在`);
  error.status = 404;
  next(error);
}

/**
 * 异步错误包装器
 */
function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 创建自定义错误类
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 创建验证错误
 */
class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 422);
    this.errors = errors;
  }
}

/**
 * 创建认证错误
 */
class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401);
  }
}

/**
 * 创建授权错误
 */
class AuthorizationError extends AppError {
  constructor(message = '没有权限访问') {
    super(message, 403);
  }
}

/**
 * 创建资源未找到错误
 */
class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404);
  }
}

/**
 * 创建冲突错误
 */
class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409);
  }
}

/**
 * 创建请求过频错误
 */
class TooManyRequestsError extends AppError {
  constructor(message = '请求过于频繁') {
    super(message, 429);
  }
}

/**
 * 创建业务逻辑错误
 */
class BusinessError extends AppError {
  constructor(message, code = 400) {
    super(message, code);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  BusinessError
};