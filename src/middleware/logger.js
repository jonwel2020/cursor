const { logRequest, logger } = require('../utils/logger');

/**
 * 请求日志中间件
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // 记录请求开始
  logRequest(req, res);
  
  // 保存原始的res.json方法
  const originalJson = res.json;
  
  // 重写res.json方法以记录响应数据
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // 记录响应信息（不记录敏感数据）
    const responseLog = {
      type: 'response_data',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      success: data?.success !== false,
      message: data?.message,
      timestamp: new Date().toISOString()
    };
    
    // 如果是错误响应，记录错误级别
    if (res.statusCode >= 400) {
      logger.warn('Request failed', responseLog);
    } else {
      logger.info('Request completed', responseLog);
    }
    
    // 调用原始的json方法
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * 错误日志中间件
 */
function errorLogger(error, req, res, next) {
  // 记录错误详情
  logger.error('Request error occurred', {
    type: 'request_error',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  
  next(error);
}

/**
 * 安全事件日志中间件
 */
function securityLogger(event) {
  return (req, res, next) => {
    logger.warn(`Security Event: ${event}`, {
      type: 'security_event',
      event,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    next();
  };
}

/**
 * 慢请求日志中间件
 */
function slowRequestLogger(threshold = 5000) {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        logger.warn('Slow request detected', {
          type: 'slow_request',
          method: req.method,
          url: req.url,
          duration,
          threshold,
          ip: req.ip,
          userId: req.user?.id,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    next();
  };
}

/**
 * SQL查询日志中间件
 */
function sqlLogger(query, options) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('SQL Query', {
      type: 'sql_query',
      query: query.replace(/\s+/g, ' ').trim(),
      duration: options?.duration,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  requestLogger,
  errorLogger,
  securityLogger,
  slowRequestLogger,
  sqlLogger
};