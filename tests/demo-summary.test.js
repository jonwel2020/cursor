/**
 * 测试用例总结和使用说明
 * 
 * 本文件展示了如何为后端API脚手架项目编写测试用例
 */

describe('测试框架使用说明', () => {
  test('测试环境验证', () => {
    // 验证测试环境变量
    expect(process.env.NODE_ENV).toBe('test');
    
    // 验证Jest测试框架正常工作
    expect(jest).toBeDefined();
    expect(expect).toBeDefined();
  });

  test('数学计算测试示例', () => {
    // 基本断言
    expect(2 + 2).toBe(4);
    expect('hello world').toContain('world');
    expect([1, 2, 3]).toHaveLength(3);
    
    // 对象属性检查
    const user = { id: 1, name: 'test', email: 'test@example.com' };
    expect(user).toHaveProperty('id', 1);
    expect(user).toHaveProperty('email');
    expect(user).not.toHaveProperty('password');
  });

  test('异步操作测试示例', async () => {
    // Promise 测试
    const asyncFunction = () => Promise.resolve('success');
    await expect(asyncFunction()).resolves.toBe('success');
    
    // 超时测试
    const slowFunction = () => new Promise(resolve => 
      setTimeout(() => resolve('done'), 100)
    );
    const result = await slowFunction();
    expect(result).toBe('done');
  });

  test('错误处理测试示例', () => {
    // 同步错误
    const throwError = () => { throw new Error('Test error'); };
    expect(throwError).toThrow('Test error');
    
    // 异步错误
    const asyncError = () => Promise.reject(new Error('Async error'));
    return expect(asyncError()).rejects.toThrow('Async error');
  });
});

describe('测试最佳实践示例', () => {
  // 测试数据
  let testData;
  
  beforeEach(() => {
    // 每个测试前初始化数据
    testData = {
      users: [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' }
      ]
    };
  });

  afterEach(() => {
    // 每个测试后清理数据
    testData = null;
  });

  test('数据操作测试', () => {
    expect(testData.users).toHaveLength(2);
    
    // 添加用户
    testData.users.push({ id: 3, name: 'Charlie', role: 'user' });
    expect(testData.users).toHaveLength(3);
    
    // 查找用户
    const admin = testData.users.find(u => u.role === 'admin');
    expect(admin).toBeDefined();
    expect(admin.name).toBe('Alice');
  });

  test('数组操作测试', () => {
    const userNames = testData.users.map(u => u.name);
    expect(userNames).toEqual(['Alice', 'Bob']);
    
    const adminUsers = testData.users.filter(u => u.role === 'admin');
    expect(adminUsers).toHaveLength(1);
  });
});

/**
 * 可用的测试命令：
 * 
 * npm test                    # 运行所有测试
 * npm run test:watch         # 监听模式
 * npm run test:coverage      # 生成覆盖率报告
 * npm test -- demo-summary   # 运行特定测试文件
 * 
 * Jest 常用断言：
 * 
 * expect(value).toBe(expected)              # 精确相等
 * expect(value).toEqual(expected)           # 深度相等
 * expect(value).toBeTruthy()                # 真值
 * expect(value).toBeFalsy()                 # 假值
 * expect(value).toBeNull()                  # null
 * expect(value).toBeUndefined()             # undefined
 * expect(value).toBeDefined()               # 已定义
 * expect(value).toContain(item)             # 包含
 * expect(value).toHaveLength(number)        # 长度
 * expect(object).toHaveProperty(key)        # 属性存在
 * expect(fn).toThrow()                      # 抛出错误
 * expect(promise).resolves.toBe(value)      # Promise 成功
 * expect(promise).rejects.toThrow()         # Promise 失败
 */
