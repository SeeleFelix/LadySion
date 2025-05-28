/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度（至少8位，包含字母和数字）
 */
export function isValidPassword(password: string): boolean {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

/**
 * 验证用户名（3-20位，只能包含字母、数字、下划线）
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[A-Za-z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 验证角色名称
 */
export function isValidCharacterName(name: string): boolean {
  return name.trim().length >= 1 && name.trim().length <= 50
}

/**
 * 验证角色描述
 */
export function isValidCharacterDescription(description: string): boolean {
  return description.trim().length >= 10 && description.trim().length <= 500
}

/**
 * 验证对话标题
 */
export function isValidConversationTitle(title: string): boolean {
  return title.trim().length >= 1 && title.trim().length <= 100
}

/**
 * 验证消息内容
 */
export function isValidMessageContent(content: string): boolean {
  return content.trim().length >= 1 && content.trim().length <= 2000
}

/**
 * 验证URL格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证手机号格式（中国）
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 去除HTML标签
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * 验证文件类型
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * 验证文件大小
 */
export function isValidFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

/**
 * 表单验证规则生成器
 */
export const createValidationRules = {
  required: (message: string = '此字段为必填项') => ({
    required: true,
    message,
    trigger: 'blur'
  }),

  email: (message: string = '请输入有效的邮箱地址') => ({
    validator: (_: any, value: string, callback: Function) => {
      if (!value || isValidEmail(value)) {
        callback()
      } else {
        callback(new Error(message))
      }
    },
    trigger: 'blur'
  }),

  password: (message: string = '密码至少8位，包含字母和数字') => ({
    validator: (_: any, value: string, callback: Function) => {
      if (!value || isValidPassword(value)) {
        callback()
      } else {
        callback(new Error(message))
      }
    },
    trigger: 'blur'
  }),

  minLength: (min: number, message?: string) => ({
    min,
    message: message || `至少输入${min}个字符`,
    trigger: 'blur'
  }),

  maxLength: (max: number, message?: string) => ({
    max,
    message: message || `最多输入${max}个字符`,
    trigger: 'blur'
  })
} 