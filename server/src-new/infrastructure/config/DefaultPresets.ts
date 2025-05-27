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
  const defaultInstructPresets: Partial<InstructPreset>[] = [
    {
      id: 'alpaca',
      name: 'Alpaca',
      description: 'Alpaca指令格式',
      inputSequence: '### Instruction:\n',
      inputSuffix: '\n',
      outputSequence: '### Response:\n',
      outputSuffix: '\n',
      systemSequence: '### System:\n',
      systemSuffix: '\n',
      firstInputSequence: '### Instruction:\n',
      firstOutputSequence: '### Response:\n',
      stopSequence: '###',
      wrap: true,
      macro: true,
      activationRegex: 'alpaca|instruction',
    },
    {
      id: 'chatml',
      name: 'ChatML',
      description: 'ChatML格式',
      inputSequence: '<|im_start|>user\n',
      inputSuffix: '<|im_end|>\n',
      outputSequence: '<|im_start|>assistant\n',
      outputSuffix: '<|im_end|>\n',
      systemSequence: '<|im_start|>system\n',
      systemSuffix: '<|im_end|>\n',
      firstInputSequence: '<|im_start|>user\n',
      firstOutputSequence: '<|im_start|>assistant\n',
      stopSequence: '<|im_end|>',
      wrap: true,
      macro: true,
      activationRegex: 'chatml|gpt',
    }
  ];

  for (const presetData of defaultInstructPresets) {
    const existing = await presetUseCases.getPresetByName(PresetType.INSTRUCT, presetData.name!);
    if (!existing) {
      const preset: InstructPreset = {
        ...presetData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as InstructPreset;
      
      await presetUseCases.savePreset(PresetType.INSTRUCT, preset);
      console.log(`已添加默认指令预设: ${preset.name}`);
    }
  }
}

/**
 * 创建默认上下文预设
 */
async function createDefaultContextPresets(presetUseCases: PresetUseCases): Promise<void> {
  const defaultContextPresets: Partial<ContextPreset>[] = [
    {
      id: 'default',
      name: '默认上下文',
      description: '默认上下文模板',
      contextTemplate: '{{systemPrompt}}\n\n{{chatStart}}',
      exampleSeparator: '\n---\n',
      chatStart: '对话开始：',
      useStoryString: true,
      usePersonality: true,
      useScenario: true,
      enableMacros: true,
    }
  ];

  for (const presetData of defaultContextPresets) {
    const existing = await presetUseCases.getPresetByName(PresetType.CONTEXT, presetData.name!);
    if (!existing) {
      const preset: ContextPreset = {
        ...presetData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as ContextPreset;
      
      await presetUseCases.savePreset(PresetType.CONTEXT, preset);
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
      id: 'assistant',
      name: '助手',
      description: '通用AI助手',
      content: '你是一个有帮助的AI助手。请友好、准确地回答用户的问题。',
      enabled: true,
      priority: 1,
      enableMacros: true,
    },
    {
      id: 'creative',
      name: '创意助手',
      description: '创意写作助手',
      content: '你是一个富有创意的写作助手。请发挥想象力，帮助用户创作有趣的内容。',
      enabled: false,
      priority: 2,
      enableMacros: true,
    }
  ];

  for (const presetData of defaultSystemPrompts) {
    const existing = await presetUseCases.getPresetByName(PresetType.SYSTEM_PROMPT, presetData.name!);
    if (!existing) {
      const preset: SystemPromptPreset = {
        ...presetData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as SystemPromptPreset;
      
      await presetUseCases.savePreset(PresetType.SYSTEM_PROMPT, preset);
      console.log(`已添加默认系统提示词预设: ${preset.name}`);
    }
  }
} 