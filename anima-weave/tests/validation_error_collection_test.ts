/**
 * # ValidationError错误收集和详细报告测试
 * 
 * 验证静态检查器能够：
 * 1. 收集所有验证错误，而不是遇到第一个就停止
 * 2. 提供详细的错误信息，包括具体的端口和连接
 * 3. 对错误进行分类和结构化报告
 * 
 * @module
 */

import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertExists, assertStringIncludes } from "jsr:@std/assert";
import { awakening } from "../src/mod.ts";
import { ExecutionStatus, type ValidationErrorContext } from "../src/framework/core.ts";

describe("ValidationError错误收集和详细报告", () => {
  
  describe("多错误收集测试", () => {
    it("应该收集所有验证错误而不是遇到第一个就停止", async () => {
      // 🤔 Think: 当前的验证器遇到第一个错误就抛出异常停止了
      // 一个好的静态检查器应该收集所有错误，一次性报告给用户
      
      // Given: 执行包含多个验证错误的图
      const result = await awakening("./sanctums/validation_errors", "multiple_errors_test");

      // Then: 验证是ValidationError
      assertEquals(result.status, ExecutionStatus.ValidationError, "应该是验证错误");

      // 🎯 核心验证：错误信息应该包含所有问题
      const errorDetails = result.getErrorDetails();
      assertExists(errorDetails, "应该有详细的错误信息");
      assertExists(errorDetails.context, "应该有错误上下文");
      
      const validationContext = errorDetails.context as unknown as ValidationErrorContext;
      assertExists(validationContext.validationErrors, "应该有验证错误列表");
      
      const validationErrors = validationContext.validationErrors;
      
      // 应该收集到多个错误
      assertEquals(validationErrors.length >= 2, true, "应该收集到至少2个错误");
      
      // 验证每个错误都有详细信息
      for (const error of validationErrors) {
        assertExists(error.type, "每个错误应该有类型");
        assertExists(error.message, "每个错误应该有消息");
        assertExists(error.connection, "每个错误应该有连接信息");
        assertExists(error.connection.from, "应该有源端口信息");
        assertExists(error.connection.to, "应该有目标端口信息");
      }
      
      console.log("🔍 收集到的验证错误:");
      console.log(JSON.stringify(validationErrors, null, 2));
      
      console.log("✅ 多错误收集验证通过:");
      console.log(`  - 收集到 ${validationErrors.length} 个错误 ✓`);
      console.log("  - 每个错误都有详细信息 ✓");
    });
  });

  describe("详细错误信息测试", () => {
    it("应该提供具体的端口和连接错误信息", async () => {
      // 🤔 Think: 用户需要知道具体是哪个节点的哪个端口连到哪个节点的哪个端口有问题
      
      // Given: 执行包含类型不匹配的图
      const result = await awakening("./sanctums/validation_errors", "detailed_error_info_test");

      // Then: 验证错误信息的详细程度
      assertEquals(result.status, ExecutionStatus.ValidationError, "应该是验证错误");

      const errorDetails = result.getErrorDetails();
      assertExists(errorDetails, "应该有详细的错误信息");
      
      const validationContext = errorDetails.context as unknown as ValidationErrorContext;
      assertExists(validationContext.validationErrors, "应该有验证错误列表");
      
      const validationErrors = validationContext.validationErrors;
      const firstError = validationErrors[0];
      
      // 验证错误信息的具体性
      assertStringIncludes(firstError.message, "Cannot connect", "应该说明连接问题");
      assertStringIncludes(firstError.message, "to", "应该说明源和目标类型");
      
      // 验证连接信息的完整性
      assertExists(firstError.connection.from.node, "应该有源节点名");
      assertExists(firstError.connection.from.port, "应该有源端口名");
      assertExists(firstError.connection.to.node, "应该有目标节点名");
      assertExists(firstError.connection.to.port, "应该有目标端口名");
      
      // 验证类型信息
      assertExists(firstError.sourceType, "应该有源类型信息");
      assertExists(firstError.targetType, "应该有目标类型信息");
      
      console.log("🔍 详细错误信息:");
      console.log(JSON.stringify(firstError, null, 2));
      
      console.log("✅ 详细错误信息验证通过:");
      console.log("  - 包含具体的端口信息 ✓");
      console.log("  - 包含类型不匹配详情 ✓");
      console.log("  - 包含连接路径信息 ✓");
    });
  });

  describe("错误分类测试", () => {
    it("应该对不同类型的验证错误进行分类", async () => {
      // 🤔 Think: 不同类型的错误应该有不同的分类，便于用户理解和修复
      
      // Given: 执行包含多种错误类型的图
      const result = await awakening("./sanctums/validation_errors", "error_classification_test");

      // Then: 验证错误分类
      assertEquals(result.status, ExecutionStatus.ValidationError, "应该是验证错误");

      const errorDetails = result.getErrorDetails();
      assertExists(errorDetails, "应该有详细的错误信息");
      
      const validationContext = errorDetails.context as unknown as ValidationErrorContext;
      assertExists(validationContext.validationErrors, "应该有验证错误列表");
      
      const validationErrors = validationContext.validationErrors;
      
      // 验证错误类型分类
      const errorTypes = new Set(validationErrors.map(e => e.type));
      
      // 应该包含不同类型的错误
      const expectedTypes = ["TYPE_MISMATCH", "PORT_NOT_FOUND", "NODE_NOT_FOUND"] as const;
      for (const expectedType of expectedTypes) {
        assertEquals(errorTypes.has(expectedType), true, `应该包含 ${expectedType} 类型的错误`);
      }
      
      console.log("🔍 错误类型分类:");
      for (const error of validationErrors) {
        console.log(`  - ${error.type}: ${error.message}`);
      }
      
      console.log("✅ 错误分类验证通过:");
      console.log(`  - 识别出 ${errorTypes.size} 种错误类型 ✓`);
      console.log("  - 每种错误都有明确分类 ✓");
    });
  });
}); 