import { PresetType, InstructPreset, ContextPreset, SystemPromptPreset } from '../../domain/entities/Preset';
import { PresetUseCases } from '../../application/usecases/PresetUseCases';

/**
 * 创建默认预设
 */
export async function createDefaultPresets(presetUseCases: PresetUseCases): Promise<void> {
  await createDefaultInstructPresets(presetUseCases);
  await createDefaultContextPresets(presetUseCases);
  await createDefaultSystemPromptPresets(presetUseCases);
}

/**
 * 创建默认指令预设
 */
async function createDefaultInstructPresets(presetUseCases: PresetUseCases): Promise<void> {
  const defaultInstructs: Partial<InstructPreset>[] = [
    {
      id: 'default-alpaca',
      name: 'Alpaca',
      description: 'Alpaca指令模式预设',
      inputSequence: '### Instruction:\n',
      inputSuffix: '\n\n### Response:\n',
      outputSequence: '',
      outputSuffix: '',
      systemSequence: '### Instruction:\n',
      systemSuffix: '\n\n### Response:\n',
      firstInputSequence: '### Instruction:\n',
      firstOutputSequence: '### Response:\n',
      stopSequence: '\n### Instruction:',
      wrap: true,
      macro: true,
      activationRegex: '.*',
      systemSameAsUser: false,
      systemInstruction: false
    },
    {
      id: 'default-chatml',
      name: 'ChatML',
      description: 'ChatML格式指令模式预设',
      inputSequence: '<|im_start|>user\n',
      inputSuffix: '<|im_end|>\n<|im_start|>assistant\n',
      outputSequence: '',
      outputSuffix: '<|im_end|>\n',
      systemSequence: '<|im_start|>system\n',
      systemSuffix: '<|im_end|>\n',
      firstInputSequence: '<|im_start|>user\n',
      firstOutputSequence: '<|im_start|>assistant\n',
      stopSequence: '<|im_end|>',
      wrap: false,
      macro: true,
      activationRegex: '.*',
      systemSameAsUser: false,
      systemInstruction: false
    }
  ];

  for (const preset of defaultInstructs) {
    const existing = await presetUseCases.getPresetById(PresetType.INSTRUCT, preset.id!);
    if (!existing) {
      const now = new Date();
      const completePreset: InstructPreset = {
        ...preset as InstructPreset,
        createdAt: now,
        updatedAt: now
      } as InstructPreset;
      
      await presetUseCases.savePreset(PresetType.INSTRUCT, completePreset);
      console.log(`已添加默认指令预设: ${preset.name}`);
    }
  }
}

/**
 * 创建默认上下文预设
 */
async function createDefaultContextPresets(presetUseCases: PresetUseCases): Promise<void> {
  const defaultContexts: Partial<ContextPreset>[] = [
    {
      id: 'default-simple',
      name: '简单对话',
      description: '简单的对话上下文模板',
      contextTemplate: '{{char}}是一个有用的AI助手。\n\n对话开始：\n{{chatStart}}\n\n{{exampleSeparator}}',
      exampleSeparator: '\n---\n',
      chatStart: '{{user}}: 你好\n{{char}}: 你好！有什么我可以帮助你的吗？',
      useStoryString: false,
      usePersonality: true,
      useScenario: true,
      useSystemInstruction: false,
      enableMacros: true
    },
    {
      id: 'default-roleplay',
      name: '角色扮演',
      description: '角色扮演专用上下文模板',
      contextTemplate: '角色：{{char}}\n\n{{char}}的描述：\n{{personality}}\n\n场景：{{scenario}}\n\n对话开始：\n{{chatStart}}\n\n{{exampleSeparator}}',
      exampleSeparator: '\n---\n',
      chatStart: '{{user}}走进了房间...',
      useStoryString: true,
      usePersonality: true,
      useScenario: true,
      useSystemInstruction: false,
      enableMacros: true
    }
  ];

  for (const preset of defaultContexts) {
    const existing = await presetUseCases.getPresetById(PresetType.CONTEXT, preset.id!);
    if (!existing) {
      const now = new Date();
      const completePreset: ContextPreset = {
        ...preset as ContextPreset,
        createdAt: now,
        updatedAt: now
      } as ContextPreset;
      
      await presetUseCases.savePreset(PresetType.CONTEXT, completePreset);
      console.log(`已添加默认上下文预设: ${preset.name}`);
    }
  }
}

/**
 * 创建默认系统提示词预设
 */
async function createDefaultSystemPromptPresets(presetUseCases: PresetUseCases): Promise<void> {
  const defaultSystemPrompts: Partial<SystemPromptPreset>[] = [
    {
      id: 'default-helpful',
      name: '有用助手',
      description: '通用有用助手系统提示词',
      content: '你是一个有用、无害、诚实的AI助手。请尽力回答用户的问题，提供准确和有用的信息。如果你不确定某个答案，请诚实地说明。',
      category: 'general',
      tags: ['通用', '助手'],
      enabled: true,
      priority: 1,
      formatBeforeContext: false,
      formatAfterContext: false,
      enableMacros: true
    },
    {
      id: 'default-creative',
      name: '创意助手',
      description: '创意写作和想象力系统提示词',
      content: '你是一个富有创意和想象力的AI助手。你擅长创意写作、故事创作、诗歌和其他创意任务。请发挥你的创造力，为用户提供独特和有趣的内容。',
      category: 'creative',
      tags: ['创意', '写作'],
      enabled: false,
      priority: 2,
      formatBeforeContext: false,
      formatAfterContext: false,
      enableMacros: true
    },
    {
      id: 'default-technical',
      name: '技术专家',
      description: '技术问题解答系统提示词',
      content: '你是一个技术专家AI助手。你在编程、软件开发、系统管理和技术问题解决方面有深厚的知识。请提供准确、详细的技术解答和建议。',
      category: 'technical',
      tags: ['技术', '编程'],
      enabled: false,
      priority: 3,
      formatBeforeContext: false,
      formatAfterContext: false,
      enableMacros: true
    }
  ];

  for (const preset of defaultSystemPrompts) {
    const existing = await presetUseCases.getPresetById(PresetType.SYSTEM_PROMPT, preset.id!);
    if (!existing) {
      const now = new Date();
      const completePreset: SystemPromptPreset = {
        ...preset as SystemPromptPreset,
        createdAt: now,
        updatedAt: now
      } as SystemPromptPreset;
      
      await presetUseCases.savePreset(PresetType.SYSTEM_PROMPT, completePreset);
      console.log(`已添加默认系统提示词预设: ${preset.name}`);
    }
  }
} 