/**
 * 🙏 Seeker（祈祷者）核心实现
 * 简洁的工厂函数，在scripture中创建seeker实例
 */

import type { 
  Seeker, 
  Eidolon, 
  Grace, 
  Whisper, 
  Spell, 
  Doctrine, 
  CreateSeeker
} from "../types/core.ts";
import { WrathError, OmenError } from "../types/core.ts";
import { getDoctrine } from "./config.ts";

/**
 * 🎯 Grace处理器 - 正确的错误架构
 * 只有omen.code === 200才是真正成功，其他都抛OmenError
 */
function handleGraceResponse<T>(grace: Grace<T>): T | T[] | null {
  // 🌟 只有200才是真正成功
  if (grace.omen.code === 200) {
    return grace.eidolon;
  }
  
  // 📋 所有非200的omen.code都是业务错误，抛出OmenError
  // 业务代码可以catch这些异常并处理
  throw new OmenError(grace.omen.message, grace.omen);
}

/**
 * 🎭 多参数转Spell - 支持任意参数列表
 */
function argsToSpell(args: any[]): Spell {
  return {
    args: args
  };
}

/**
 * 🌐 执行Whisper请求
 */
async function executeWhisper<T>(
  whisper: Whisper,
  doctrine: Required<Doctrine>
): Promise<T | T[] | null> {
  const url = `${doctrine.baseUrl}${doctrine.whisperPath}/${whisper.eidolon}/${whisper.ritual}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: doctrine.headers,
      body: JSON.stringify({ spell: whisper.spell }),
      signal: AbortSignal.timeout(doctrine.timeout),
    });

    if (!response.ok) {
      // 🔥 HTTP错误属于Wrath（系统异常），直接抛出WrathError
      const errorData = await response.json().catch(() => ({}));
      const error = new WrathError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        {
          code: response.status,
          status: 'error',
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          signal: 'http_error'
        }
      );
      throw error;
    }

    const grace: Grace<T> = await response.json();
    return handleGraceResponse(grace);
  } catch (error) {
    if (error instanceof WrathError || error instanceof OmenError) {
      throw error;
    }
    
    // 🔥 系统异常都属于Wrath，抛出WrathError
    let signal = 'unknown_error';
    let message = 'Unknown error';
    
    if (error instanceof Error) {
      message = error.message;
      
      // 根据错误类型设置不同的signal
      if (error.name === 'AbortError' || message.includes('timeout')) {
        signal = 'timeout_error';
      } else if (message.includes('JSON') || message.includes('parse')) {
        signal = 'parse_error';
      } else if (message.includes('Network') || message.includes('connection') || message.includes('fetch')) {
        signal = 'network_error';
      }
    }
    
    const wrathError = new WrathError(message, {
      code: 0,
      status: 'error',
      message: message,
      signal: signal
    });
    
    throw wrathError;
  }
}

/**
 * 🔮 createSeeker工厂函数
 * 在scripture中使用，创建具体的seeker实例
 */
export const createSeeker: CreateSeeker = <TSeeker extends Seeker<any>>(
  eidolonName: string,
  doctrineOverrides?: Doctrine,
): TSeeker => {
  const doctrine = getDoctrine(doctrineOverrides);
  
  // 使用Proxy动态为接口方法生成实现
  return new Proxy({} as TSeeker, {
    get(target: any, ritualName: string | symbol) {
      // 忽略Symbol属性和特殊属性
      if (typeof ritualName === 'symbol' || ritualName.startsWith('_')) {
        return undefined;
      }
      
      // 为每个方法调用生成实现，支持多参数
      return async (...args: any[]) => {
        const spell = argsToSpell(args);
        
        const whisper: Whisper = {
          eidolon: eidolonName,
          ritual: ritualName,
          spell
        };

        return executeWhisper(whisper, doctrine);
      };
    },
    
    // 防止属性设置
    set() {
      return false;
    },
  });
}; 