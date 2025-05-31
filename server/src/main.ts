import { Application, Router } from "oak/mod.ts";
// @deno-types="https://deno.land/std@0.203.0/path/mod.ts"
import { join } from "std/path/mod.ts";

// 声明Deno为全局对象（Deno项目下自动可用）
// @ts-ignore
declare const Deno: typeof globalThis.Deno;

import { DIContainer } from "@/infrastructure/config/DIContainer.ts";
import { OpenRouterAdapter } from "@/infrastructure/adapters/OpenRouterAdapter.ts";
import { SQLiteChatRepository } from "@/infrastructure/repositories/SQLiteChatRepository.ts";
import { SQLitePresetRepository } from "@/infrastructure/repositories/SQLitePresetRepository.ts";
import { createDefaultPresets } from "@/infrastructure/config/DefaultPresets.ts";
import { ChatOrchestrationService } from "@/domain/services/ChatOrchestrationService.ts";
import { MacroSystem } from "@/domain/services/MacroSystem.ts";
import { SendMessageUseCase } from "@/application/usecases/SendMessageUseCase.ts";
import { ChatApplicationService } from "@/application/services/ChatApplicationService.ts";
import { PresetUseCases } from "@/application/usecases/PresetUseCases.ts";
import { PresetApplicationService } from "@/application/services/PresetApplicationService.ts";
import { ChatController } from "@/presentation/controllers/ChatController.ts";
import { PresetController } from "@/presentation/controllers/PresetController.ts";
import { createPresetRoutes } from "@/presentation/routes/presetRoutes.ts";
import { errorHandlingMiddleware } from "@/presentation/middleware/errorHandling.ts";
import { validationMiddleware } from "@/presentation/middleware/validation.ts";

async function main() {
  const app = new Application();
  const router = new Router();
  const container = DIContainer.getInstance();

  // 依赖注册（环境变量用Deno.env.get）
  const openRouterAdapter = new OpenRouterAdapter(
    Deno.env.get("OPENROUTER_API_KEY") ?? "dummy-key",
    "https://openrouter.ai/api/v1",
    Deno.env.get("OPENROUTER_MODEL") ?? "meta-llama/llama-3.1-8b-instruct:free",
  );
  await openRouterAdapter.initialize();
  container.registerInstance("LLMAdapter", openRouterAdapter);

  const chatRepository = new SQLiteChatRepository(
    join(Deno.cwd(), "data", "chats.db"),
  );
  await chatRepository.initialize();
  container.registerInstance("ChatRepository", chatRepository);

  const presetRepository = new SQLitePresetRepository(
    join(Deno.cwd(), "data", "presets.db"),
  );
  await presetRepository.initialize();
  container.registerInstance("PresetRepository", presetRepository);

  container.registerInstance("CharacterRepository", {
    findById: async () => null,
    findByName: async () => null,
    findAll: async () => [],
    save: async () => {},
    delete: async () => false,
    exists: async () => false,
  });

  container.registerSingleton(
    "ChatOrchestrationService",
    () => new ChatOrchestrationService(),
  );
  const macroSystem = new MacroSystem();
  container.registerInstance("MacroSystem", macroSystem);

  container.registerSingleton(
    "SendMessageUseCase",
    () =>
      new SendMessageUseCase(
        container.resolve("ChatRepository"),
        container.resolve("CharacterRepository"),
        container.resolve("ChatOrchestrationService"),
        container.resolve("LLMAdapter"),
      ),
  );
  container.registerSingleton(
    "PresetUseCases",
    () => new PresetUseCases(container.resolve("PresetRepository")),
  );
  container.registerSingleton(
    "ChatApplicationService",
    () =>
      new ChatApplicationService(
        container.resolve("SendMessageUseCase"),
        container.resolve("ChatRepository"),
        container.resolve("CharacterRepository"),
        container.resolve("ChatOrchestrationService"),
      ),
  );
  container.registerSingleton(
    "PresetApplicationService",
    () =>
      new PresetApplicationService(
        container.resolve("PresetUseCases"),
        container.resolve("MacroSystem"),
      ),
  );
  container.registerSingleton(
    "ChatController",
    () => new ChatController(container.resolve("ChatApplicationService")),
  );
  container.registerSingleton(
    "PresetController",
    () => new PresetController(container.resolve("PresetApplicationService")),
  );
  await createDefaultPresets(container.resolve("PresetUseCases"));

  const chatController = container.resolve<ChatController>("ChatController");
  const presetController = container.resolve<PresetController>(
    "PresetController",
  );

  // 全局中间件和预设路由挂载
  app.use(errorHandlingMiddleware);
  app.use(validationMiddleware);
  const presetRouter = createPresetRoutes(presetController);
  router.use("/api/v1", presetRouter.routes(), presetRouter.allowedMethods());

  // 聊天相关路由
  router.post("/api/v1/conversations", (ctx) => chatController.createChat(ctx));
  router.get("/api/v1/conversations", (ctx) => chatController.getChats(ctx));
  router.post(
    "/api/v1/conversations/:id/messages",
    (ctx) => chatController.sendMessage(ctx),
  );
  router.get(
    "/api/v1/conversations/:id/messages",
    (ctx) => chatController.getChatHistory(ctx),
  );
  router.delete(
    "/api/v1/conversations/:id",
    (ctx) => chatController.deleteChat(ctx),
  );

  // 健康检查
  router.get("/api/v1/health", (ctx) => {
    ctx.response.body = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  const port = Number(Deno.env.get("PORT") ?? 3000);
  console.log(`Lady Sion 服务器已启动，端口: ${port}`);
  console.log(`健康检查: http://localhost:${port}/api/v1/health`);
  console.log("新架构迁移完成 ✅");
  await app.listen({ port });
}

// Deno和import.meta.main类型兼容性修正
// @ts-ignore
if ((import.meta as any).main) {
  main();
}
