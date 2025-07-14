const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const appConfig = require('../../config/app');

// 确保logs目录存在
const logsDir = path.join(__dirname, '../../logs');

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    // 添加错误堆栈
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// 创建日志传输器
const transports = [
  // 控制台输出
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }),
  
  // 错误日志文件（按日期轮转）
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: appConfig.log.datePattern,
    level: 'error',
    maxSize: appConfig.log.maxSize,
    maxFiles: appConfig.log.maxFiles,
    format: logFormat
  }),
  
  // 组合日志文件（按日期轮转）
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: appConfig.log.datePattern,
    maxSize: appConfig.log.maxSize,
    maxFiles: appConfig.log.maxFiles,
    format: logFormat
  }),
  
  // 访问日志文件（按日期轮转）
  new DailyRotateFile({
    filename: path.join(logsDir, 'access-%DATE%.log'),
    datePattern: appConfig.log.datePattern,
    level: 'info',
    maxSize: appConfig.log.maxSize,
    maxFiles: appConfig.log.maxFiles,
    format: logFormat
  })
];

// 创建logger实例
const logger = winston.createLogger({
  level: appConfig.log.level,
  format: logFormat,
  transports,
  // 处理未捕获的异常
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  // 处理未处理的Promise拒绝
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

/**
 * 记录请求日志
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {string} level - 日志级别
 */
function logRequest(req, res, level = 'info') {
  const startTime = Date.now();
  const { method, url, ip, headers } = req;
  
  // 获取用户信息
  const userId = req.user?.id || 'anonymous';
  const userAgent = headers['user-agent'] || 'unknown';
  
  // 记录请求开始
  logger.log(level, `${method} ${url}`, {
    type: 'request_start',
    method,
    url,
    ip,
    userId,
    userAgent,
    timestamp: new Date().toISOString()
  });
  
  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    
    logger.log(level, `${method} ${url} - ${statusCode} - ${duration}ms`, {
      type: 'request_end',
      method,
      url,
      ip,
      userId,
      statusCode,
      duration,
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * 记录数据库操作日志
 * @param {string} operation - 操作类型
 * @param {string} table - 表名
 * @param {Object} data - 操作数据
 * @param {Object} user - 用户信息
 */
function logDatabaseOperation(operation, table, data, user = null) {
  logger.info(`Database ${operation} on ${table}`, {
    type: 'database_operation',
    operation,
    table,
    userId: user?.id,
    dataId: data?.id,
    timestamp: new Date().toISOString()
  });
}

/**
 * 记录安全事件
 * @param {string} event - 事件类型
 * @param {Object} details - 事件详情
 * @param {Object} req - Express请求对象
 */
function logSecurityEvent(event, details, req) {
  logger.warn(`Security Event: ${event}`, {
    type: 'security_event',
    event,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    url: req.url,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * 记录业务操作日志
 * @param {string} action - 操作动作
 * @param {Object} details - 操作详情
 * @param {Object} user - 用户信息
 */
function logBusinessAction(action, details, user) {
  logger.info(`Business Action: ${action}`, {
    type: 'business_action',
    action,
    userId: user?.id,
    username: user?.username,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * 记录系统错误
 * @param {Error} error - 错误对象
 * @param {Object} context - 错误上下文
 */
function logError(error, context = {}) {
  logger.error(`System Error: ${error.message}`, {
    type: 'system_error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    timestamp: new Date().toISOString()
  });
}

/**
 * 清理过期日志文件
 */
function cleanupLogs() {
  logger.info('Log cleanup task started', {
    type: 'log_cleanup',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  logger,
  logRequest,
  logDatabaseOperation,
  logSecurityEvent,
  logBusinessAction,
  logError,
  cleanupLogs
};