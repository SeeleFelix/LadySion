import { v4 as uuidv4 } from 'uuid';
import { InstructPreset, ContextPreset, SystemPromptPreset, PresetType } from '../domain/models/preset/Preset';
import { PresetUseCases } from '../domain/usecases/preset/PresetUseCases';

/**
 * 创建默认预设
 * @param presetUseCases 预设用例
 */
export async function createDefaultPresets(presetUseCases: PresetUseCases): Promise<void> {
  // 创建默认指令模式预设
  await createDefaultInstructPresets(presetUseCases);
  
  // 创建默认上下文模板预设
  await createDefaultContextPresets(presetUseCases);
  
  // 创建默认系统提示词预设
  await createDefaultSystemPromptPresets(presetUseCases);
}

/**
 * 创建默认指令模式预设
 * @param presetUseCases 预设用例
 */
async function createDefaultInstructPresets(presetUseCases: PresetUseCases): Promise<void> {
  const now = new Date();
  
  const defaultInstructPresets: Partial<InstructPreset>[] = [
    {
      name: 'Alpaca',
      description: '适用于Alpaca系列模型',
      inputSequence: '### Instruction:',
      inputSuffix: '',
      outputSequence: '### Response:',
      outputSuffix: '',
      systemSequence: '### System:',
      systemSuffix: '',
      firstInputSequence: '',
      firstOutputSequence: '',
      stopSequence: '',
      wrap: true,
      macro: true,
      activationRegex: '(?i)alpaca|wizard|vicuna|longllama',
    },
    {
      name: 'ChatML',
      description: '适用于OpenAI ChatGPT系列模型',
      inputSequence: '<|im_start|>user',
      inputSuffix: '<|im_end|>',
      outputSequence: '<|im_start|>assistant',
      outputSuffix: '<|im_end|>',
      systemSequence: '<|im_start|>system',
      systemSuffix: '<|im_end|>',
      firstInputSequence: '',
      firstOutputSequence: '',
      stopSequence: '<|im_start|>',
      wrap: true,
      macro: true,
      activationRegex: '(?i)chatml|gpt|claude',
    },
    {
      name: 'Llama-2',
      description: '适用于Meta的Llama 2系列模型',
      inputSequence: '[INST]',
      inputSuffix: '[/INST]',
      outputSequence: '',
      outputSuffix: '',
      systemSequence: '[INST] <<SYS>>\n',
      systemSuffix: '\n<</SYS>>\n',
      firstInputSequence: '',
      firstOutputSequence: '',
      stopSequence: '[INST]',
      wrap: false,
      macro: true,
      activationRegex: '(?i)llama-?2',
    },
    {
      name: 'Baichuan-2',
      description: '适用于百川Baichuan-2系列模型',
      inputSequence: '<reserved_102>',
      inputSuffix: '<reserved_103>',
      outputSequence: '',
      outputSuffix: '',
      systemSequence: '',
      systemSuffix: '',
      firstInputSequence: '',
      firstOutputSequence: '',
      stopSequence: '<reserved_102>',
      wrap: false,
      macro: true,
      activationRegex: '(?i)baichuan',
    }
  ];
  
  // 检查并创建默认预设
  for (const presetData of defaultInstructPresets) {
    // 检查是否已存在
    const existingPreset = await presetUseCases.getPresetByName(
      PresetType.INSTRUCT,
      presetData.name || ''
    );
    
    if (!existingPreset) {
      // 创建新预设
      const preset: InstructPreset = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        ...presetData
      } as InstructPreset;
      
      await presetUseCases.savePreset(PresetType.INSTRUCT, preset);
      console.log(`创建默认指令模式预设: ${preset.name}`);
    }
  }
}

/**
 * 创建默认上下文模板预设
 * @param presetUseCases 预设用例
 */
async function createDefaultContextPresets(presetUseCases: PresetUseCases): Promise<void> {
  const now = new Date();
  
  const defaultContextPresets: Partial<ContextPreset>[] = [
    {
      name: 'Default',
      description: '默认上下文模板',
      contextTemplate: '{{char}}的人物设定: {{persona}}\n\n{{#if scenario}}场景: {{scenario}}{{/if}}\n{{#if personality}}{{char}}的性格: {{personality}}{{/if}}\n\n',
      chatStart: '<开始对话>',
      exampleSeparator: '\n---\n',
      useStoryString: true
    },
    {
      name: 'ChatML',
      description: '与ChatML指令模式配合使用的上下文模板',
      contextTemplate: '{{char}}的人物设定: {{persona}}\n\n{{#if scenario}}场景: {{scenario}}{{/if}}\n{{#if personality}}{{char}}的性格: {{personality}}{{/if}}\n\n',
      chatStart: '',
      exampleSeparator: '\n',
      useStoryString: false
    },
    {
      name: 'Alpaca',
      description: '与Alpaca指令模式配合使用的上下文模板',
      contextTemplate: '{{char}}的人物设定: {{persona}}\n\n{{#if scenario}}场景: {{scenario}}{{/if}}\n{{#if personality}}{{char}}的性格: {{personality}}{{/if}}\n\n',
      chatStart: '### 对话开始:',
      exampleSeparator: '\n\n',
      useStoryString: true
    },
    {
      name: 'Llama-2',
      description: '与Llama-2指令模式配合使用的上下文模板',
      contextTemplate: '{{char}}的人物设定: {{persona}}\n\n{{#if scenario}}场景: {{scenario}}{{/if}}\n{{#if personality}}{{char}}的性格: {{personality}}{{/if}}\n\n',
      chatStart: '',
      exampleSeparator: '\n\n',
      useStoryString: false
    }
  ];
  
  // 检查并创建默认预设
  for (const presetData of defaultContextPresets) {
    // 检查是否已存在
    const existingPreset = await presetUseCases.getPresetByName(
      PresetType.CONTEXT,
      presetData.name || ''
    );
    
    if (!existingPreset) {
      // 创建新预设
      const preset: ContextPreset = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        ...presetData
      } as ContextPreset;
      
      await presetUseCases.savePreset(PresetType.CONTEXT, preset);
      console.log(`创建默认上下文模板预设: ${preset.name}`);
    }
  }
}

/**
 * 创建默认系统提示词预设
 * @param presetUseCases 预设用例
 */
async function createDefaultSystemPromptPresets(presetUseCases: PresetUseCases): Promise<void> {
  const now = new Date();
  
  const defaultSystemPromptPresets: Partial<SystemPromptPreset>[] = [
    {
      name: '中性对话',
      description: '通用的中性对话系统提示词',
      content: '用自然、真实的方式回复{{user}}。你是{{char}}，创造性地回答所有问题。',
      category: '通用',
      tags: ['对话', '中性']
    },
    {
      name: 'RPG模式',
      description: '适合角色扮演游戏的系统提示词',
      content: '这是一个角色扮演对话。你扮演{{char}}，严格按照角色设定进行回复。你的回答应该简洁明了，展现角色的个性和特点。在描述动作时使用*星号*。',
      category: '角色扮演',
      tags: ['RPG', '角色扮演', '游戏']
    },
    {
      name: '创作助手',
      description: '适合创意写作的系统提示词',
      content: '你是一位创意写作助手，名为{{char}}。帮助{{user}}进行创意写作，提供有价值的建议和灵感。你的回复应该富有想象力和灵感，使用丰富的描述和生动的语言。',
      category: '创作',
      tags: ['写作', '创意', '助手']
    },
    {
      name: '小说风格',
      description: '以小说形式回复的系统提示词',
      content: '以小说的风格回复{{user}}。你是{{char}}，以第三人称描述场景和对话，使用丰富的描述和细节。对话使用引号，内心独白使用斜体。保持小说的连贯性和情节发展。',
      category: '创作',
      tags: ['小说', '文学', '叙事']
    },
    {
      name: '技术顾问',
      description: '适合技术讨论的系统提示词',
      content: '你是一位专业的技术顾问{{char}}，以专业、准确、简洁的方式回答{{user}}的技术问题。提供实用的建议和示例代码（如适用）。避免过度解释基础概念，除非被要求。',
      category: '工作',
      tags: ['技术', '编程', '顾问']
    }
  ];
  
  // 检查并创建默认预设
  for (const presetData of defaultSystemPromptPresets) {
    // 检查是否已存在
    const existingPreset = await presetUseCases.getPresetByName(
      PresetType.SYSTEM_PROMPT,
      presetData.name || ''
    );
    
    if (!existingPreset) {
      // 创建新预设
      const preset: SystemPromptPreset = {
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        ...presetData
      } as SystemPromptPreset;
      
      await presetUseCases.savePreset(PresetType.SYSTEM_PROMPT, preset);
      console.log(`创建默认系统提示词预设: ${preset.name}`);
    }
  }
} 