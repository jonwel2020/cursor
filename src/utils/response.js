/**
 * 统一的API响应格式工具
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} code - 状态码
 */
function success(res, data = null, message = '操作成功', code = 200) {
  return res.status(code).json({
    success: true,
    code,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} code - 状态码
 * @param {*} errors - 详细错误信息
 */
function error(res, message = '操作失败', code = 400, errors = null) {
  return res.status(code).json({
    success: false,
    code,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
}

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 数据列表
 * @param {Object} pagination - 分页信息
 * @param {string} message - 响应消息
 */
function paginated(res, data, pagination, message = '获取成功') {
  return res.status(200).json({
    success: true,
    code: 200,
    message,
    data,
    pagination: {
      current_page: pagination.page,
      per_page: pagination.limit,
      total: pagination.total,
      total_pages: Math.ceil(pagination.total / pagination.limit),
      has_next: pagination.page < Math.ceil(pagination.total / pagination.limit),
      has_prev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * 验证错误响应
 * @param {Object} res - Express响应对象
 * @param {Array} validationErrors - 验证错误数组
 */
function validationError(res, validationErrors) {
  const errors = validationErrors.map(err => ({
    field: err.path || err.param,
    message: err.msg || err.message,
    value: err.value
  }));

  return error(res, '数据验证失败', 422, errors);
}

/**
 * 未授权响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
function unauthorized(res, message = '未授权访问') {
  return error(res, message, 401);
}

/**
 * 禁止访问响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
function forbidden(res, message = '没有权限访问') {
  return error(res, message, 403);
}

/**
 * 资源未找到响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
function notFound(res, message = '资源不存在') {
  return error(res, message, 404);
}

/**
 * 服务器内部错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 */
function serverError(res, message = '服务器内部错误') {
  return error(res, message, 500);
}

/**
 * 创建响应处理中间件
 * @param {Function} asyncFn - 异步处理函数
 */
function asyncHandler(asyncFn) {
  return (req, res, next) => {
    Promise.resolve(asyncFn(req, res, next)).catch(next);
  };
}

module.exports = {
  success,
  error,
  paginated,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  asyncHandler
};