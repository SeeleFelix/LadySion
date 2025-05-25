import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 天气查询工具 - 这是一个示例工具
 * 在实际应用中，你可以连接到真实的API
 */
export const weatherTool = new DynamicStructuredTool({
  name: 'getWeather',
  description: '获取指定城市的天气信息',
  schema: z.object({
    location: z.string().describe('要查询天气的城市，例如"北京"或"上海"'),
  }),
  func: async ({ location }) => {
    // 这里只是模拟返回，实际应用中应该调用真实的天气API
    const weatherData: Record<string, string> = {
      '北京': '晴天，26°C',
      '上海': '多云，24°C',
      '广州': '小雨，29°C',
      '深圳': '阵雨，28°C',
    };
    
    return weatherData[location] || `没有找到${location}的天气信息`;
  },
});

/**
 * 搜索工具 - 模拟信息搜索
 */
export const searchTool = new DynamicStructuredTool({
  name: 'search',
  description: '搜索特定主题的信息',
  schema: z.object({
    query: z.string().describe('搜索查询字符串'),
  }),
  func: async ({ query }) => {
    // 模拟搜索结果
    return `关于"${query}"的搜索结果：这是一个模拟的搜索结果，在实际应用中可以连接到真实的搜索API。`;
  },
});

// 导出所有工具
export const tools = [weatherTool, searchTool]; 