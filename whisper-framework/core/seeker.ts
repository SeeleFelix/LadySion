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
import { WhisperError } from "../types/core.ts";
import { getDoctrine } from "./config.ts";

/**
 * 🎯 Grace处理器 - 自动解包返回eidolon
 */
function handleGraceResponse<T>(grace: Grace<T>): any {
  if (grace.omen.status === 'error') {
    const error = new WhisperError(grace.omen.message, grace.omen);
    throw error;
  }
  
  if (grace.omen.status === 'warning') {
    console.warn(`⚠️ Whisper Warning: ${grace.omen.message}`);
  }
  
  return grace.eidolon;
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
): Promise<any> {
  const url = `${doctrine.baseUrl}${doctrine.whisperPath}/${whisper.eidolon}/${whisper.ritual}`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: doctrine.headers,
      body: JSON.stringify({ spell: whisper.spell }),
      signal: AbortSignal.timeout(doctrine.timeout),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorGrace: Grace<null> = {
        eidolon: null,
        omen: {
          code: response.status,
          status: 'error',
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          signal: errorData.signal
        },
        timestamp: Date.now()
      };
      
      return handleGraceResponse(errorGrace);
    }

    const grace: Grace<T> = await response.json();
    return handleGraceResponse(grace);
  } catch (error) {
    if (error instanceof WhisperError) {
      throw error;
    }
    
    const errorGrace: Grace<null> = {
      eidolon: null,
      omen: {
        code: 0,
        status: 'error',
        message: error instanceof Error ? error.message : "Unknown network error",
        signal: "connection_failed"
      },
      timestamp: Date.now()
    };
    
    return handleGraceResponse(errorGrace);
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