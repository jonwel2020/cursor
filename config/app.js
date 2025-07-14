module.exports = {
  // 应用基础配置
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  apiVersion: process.env.API_VERSION || 'v1',
  
  // 跨域配置
  corsOrigins: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://admin.yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:9000'],
  
  // 请求限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // 文件上传配置
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES 
      ? process.env.ALLOWED_FILE_TYPES.split(',')
      : ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    // 图片文件类型
    imageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    // 文档文件类型
    documentTypes: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls']
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    datePattern: 'YYYY-MM-DD'
  },
  
  // 分页配置
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100
  },
  
  // 缓存配置
  cache: {
    ttl: 60 * 60, // 1小时
    maxKeys: 1000
  },
  
  // 邮件配置
  email: {
    enabled: process.env.SMTP_HOST ? true : false,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  }
};