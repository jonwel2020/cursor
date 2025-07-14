const { body, param, query, validationResult } = require('express-validator');
const authConfig = require('../../config/auth');
const appConfig = require('../../config/app');

/**
 * 处理验证结果
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      code: 422,
      message: '数据验证失败',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  next();
}

/**
 * 用户注册验证规则
 */
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('用户名长度必须在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: authConfig.password.minLength, max: authConfig.password.maxLength })
    .withMessage(`密码长度必须在${authConfig.password.minLength}-${authConfig.password.maxLength}个字符之间`)
    .custom((value) => {
      if (authConfig.password.requireNumbers && !/\d/.test(value)) {
        throw new Error('密码必须包含至少一个数字');
      }
      if (authConfig.password.requireLowercase && !/[a-z]/.test(value)) {
        throw new Error('密码必须包含至少一个小写字母');
      }
      if (authConfig.password.requireUppercase && !/[A-Z]/.test(value)) {
        throw new Error('密码必须包含至少一个大写字母');
      }
      if (authConfig.password.requireSymbols && !/[!@#$%^&*]/.test(value)) {
        throw new Error('密码必须包含至少一个特殊字符');
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('确认密码与密码不匹配');
      }
      return true;
    }),
  
  body('nickname')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度必须在1-50个字符之间'),
  
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码')
];

/**
 * 用户登录验证规则
 */
const loginValidation = [
  body('account')
    .notEmpty()
    .withMessage('用户名/邮箱/手机号不能为空'),
  
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
];

/**
 * 更新用户信息验证规则
 */
const updateProfileValidation = [
  body('nickname')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('昵称长度必须在1-50个字符之间'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('头像必须是有效的URL'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('性别只能是male、female或unknown'),
  
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('生日格式不正确')
];

/**
 * 修改密码验证规则
 */
const changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('原密码不能为空'),
  
  body('newPassword')
    .isLength({ min: authConfig.password.minLength, max: authConfig.password.maxLength })
    .withMessage(`新密码长度必须在${authConfig.password.minLength}-${authConfig.password.maxLength}个字符之间`)
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('新密码不能与原密码相同');
      }
      return true;
    }),
  
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('确认密码与新密码不匹配');
      }
      return true;
    })
];

/**
 * 分页参数验证规则
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是大于0的整数')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: appConfig.pagination.maxLimit })
    .withMessage(`每页数量必须是1-${appConfig.pagination.maxLimit}之间的整数`)
    .toInt(),
  
  query('sort')
    .optional()
    .matches(/^[a-zA-Z_]+:(asc|desc)$/)
    .withMessage('排序格式错误，正确格式为：字段名:asc或字段名:desc')
];

/**
 * ID参数验证规则
 */
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID必须是大于0的整数')
    .toInt()
];

/**
 * 文件上传验证
 */
function validateFileUpload(fieldName, options = {}) {
  const {
    required = false,
    allowedTypes = appConfig.upload.allowedTypes,
    maxSize = appConfig.upload.maxFileSize
  } = options;

  return (req, res, next) => {
    const file = req.file || req.files?.[fieldName];
    
    if (required && !file) {
      return res.status(422).json({
        success: false,
        code: 422,
        message: '文件不能为空',
        timestamp: new Date().toISOString()
      });
    }
    
    if (file) {
      // 检查文件类型
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        return res.status(422).json({
          success: false,
          code: 422,
          message: `文件类型不支持，支持的类型：${allowedTypes.join(', ')}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // 检查文件大小
      if (file.size > maxSize) {
        return res.status(422).json({
          success: false,
          code: 422,
          message: `文件大小超过限制，最大允许${Math.round(maxSize / 1024 / 1024)}MB`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    next();
  };
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 验证结果
 */
function isValidPhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 验证结果
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证身份证号格式
 * @param {string} idCard - 身份证号
 * @returns {boolean} 验证结果
 */
function isValidIdCard(idCard) {
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  return idCardRegex.test(idCard);
}

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  paginationValidation,
  idValidation,
  validateFileUpload,
  isValidPhone,
  isValidEmail,
  isValidIdCard
};