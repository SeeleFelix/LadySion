// API相关常量
export const API_ENDPOINTS = {
  CHARACTERS: "/characters",
  CONVERSATIONS: "/conversations",
  MESSAGES: "/messages",
} as const;

// 路由常量
export const ROUTES = {
  HOME: "/",
  CHARACTERS: "/characters",
  CONVERSATIONS: "/conversations",
  SETTINGS: "/settings",
  CHAT: "/chat",
} as const;

// 存储键名
export const STORAGE_KEYS = {
  THEME: "theme",
  SIDEBAR_COLLAPSED: "sidebarCollapsed",
  USER_PREFERENCES: "userPreferences",
  RECENT_CHARACTERS: "recentCharacters",
} as const;

// 主题选项
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
} as const;

// 文件类型限制
export const FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  DOCUMENTS: ["application/pdf", "text/plain", "application/msword"],
  AUDIO: ["audio/mp3", "audio/wav", "audio/ogg"],
} as const;

// 文件大小限制（MB）
export const FILE_SIZE_LIMITS = {
  AVATAR: 2,
  DOCUMENT: 10,
  AUDIO: 50,
} as const;

// 消息角色
export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

// 表单验证常量
export const VALIDATION_LIMITS = {
  CHARACTER_NAME: { MIN: 1, MAX: 50 },
  CHARACTER_DESCRIPTION: { MIN: 10, MAX: 500 },
  CONVERSATION_TITLE: { MIN: 1, MAX: 100 },
  MESSAGE_CONTENT: { MIN: 1, MAX: 2000 },
  USERNAME: { MIN: 3, MAX: 20 },
  PASSWORD: { MIN: 8, MAX: 128 },
} as const;

// UI常量
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 60,
  PAGINATION_SIZE: 20,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "网络连接错误，请检查网络设置",
  SERVER_ERROR: "服务器错误，请稍后重试",
  UNAUTHORIZED: "未授权访问，请先登录",
  FORBIDDEN: "没有权限执行此操作",
  NOT_FOUND: "请求的资源不存在",
  VALIDATION_ERROR: "数据验证失败，请检查输入",
  UNKNOWN_ERROR: "未知错误，请稍后重试",
} as const;

// 成功消息
export const SUCCESS_MESSAGES = {
  CHARACTER_CREATED: "角色创建成功",
  CHARACTER_UPDATED: "角色更新成功",
  CHARACTER_DELETED: "角色删除成功",
  CONVERSATION_CREATED: "对话创建成功",
  CONVERSATION_DELETED: "对话删除成功",
  MESSAGE_SENT: "消息发送成功",
  SETTINGS_SAVED: "设置保存成功",
} as const;
