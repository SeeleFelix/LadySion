/**
 * JPA查询方法解析器测试
 * 验证严格的字段和操作符验证
 */

/// <reference lib="deno.ns" />

import { assert, assertEquals, assertThrows } from "std/assert/mod.ts";
import { QueryMethodParser, QUERY_OPERATORS, QUERY_PREFIXES } from "../queryMethodParser.ts";

// 测试用户实体字段
const USER_FIELDS = ["id", "username", "email", "age", "status", "createdAt", "isActive"];

let parser: QueryMethodParser;

Deno.test("解析器初始化 - 应该正确设置实体字段", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  assert(parser instanceof QueryMethodParser);
});

Deno.test("解析有效的findBy方法 - findByUsername", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("findByUsername");
  
  assertEquals(result.prefix, "findBy");
  assertEquals(result.conditions.length, 1);
  assertEquals(result.conditions[0].field, "username");
  assertEquals(result.conditions[0].operator, "eq");
  assertEquals(result.conditions[0].parameterCount, 1);
  assertEquals(result.expectedParameterCount, 1);
});

Deno.test("解析带操作符的方法 - findByAgeGreaterThan", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("findByAgeGreaterThan");
  
  assertEquals(result.prefix, "findBy");
  assertEquals(result.conditions[0].field, "age");
  assertEquals(result.conditions[0].operator, "gt");
  assertEquals(result.expectedParameterCount, 1);
});

Deno.test("解析AND连接的条件 - findByUsernameAndEmail", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("findByUsernameAndEmail");
  
  assertEquals(result.conditions.length, 2);
  assertEquals(result.conditions[0].field, "username");
  assertEquals(result.conditions[1].field, "email");
  assertEquals(result.logicalOperators[0], "And");
  assertEquals(result.expectedParameterCount, 2);
});

Deno.test("解析OR连接的条件 - findByUsernameOrEmail", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("findByUsernameOrEmail");
  
  assertEquals(result.conditions.length, 2);
  assertEquals(result.logicalOperators[0], "Or");
  assertEquals(result.expectedParameterCount, 2);
});

Deno.test("解析Between操作符 - findByAgeBetween", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("findByAgeBetween");
  
  assertEquals(result.conditions[0].operator, "between");
  assertEquals(result.conditions[0].parameterCount, 2);
  assertEquals(result.expectedParameterCount, 2);
});

Deno.test("解析In操作符 - findByStatusIn", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("findByStatusIn");
  
  assertEquals(result.conditions[0].operator, "in");
  assertEquals(result.expectedParameterCount, 1);
});

Deno.test("解析无参数操作符 - findByIsActiveTrue", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("findByIsActiveTrue");
  
  assertEquals(result.conditions[0].field, "isActive");
  assertEquals(result.conditions[0].operator, "true");
  assertEquals(result.conditions[0].parameterCount, 0);
  assertEquals(result.expectedParameterCount, 0);
});

Deno.test("解析复杂组合 - findByUsernameAndAgeGreaterThanOrStatusIn", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("findByUsernameAndAgeGreaterThanOrStatusIn");
  
  assertEquals(result.conditions.length, 3);
  assertEquals(result.conditions[0].field, "username");
  assertEquals(result.conditions[1].field, "age");
  assertEquals(result.conditions[1].operator, "gt");
  assertEquals(result.conditions[2].field, "status");
  assertEquals(result.conditions[2].operator, "in");
  assertEquals(result.logicalOperators, ["And", "Or"]);
  assertEquals(result.expectedParameterCount, 3);
});

Deno.test("不同查询前缀 - countByStatus", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const result = parser.parseMethodName("countByStatus");
  
  assertEquals(result.prefix, "countBy");
  assertEquals(result.conditions[0].field, "status");
});

Deno.test("参数验证 - 正确的参数个数", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const parsedQuery = parser.parseMethodName("findByUsernameAndAge");
  
  // 不应该抛出异常
  parser.validateParameters(parsedQuery, ["john", 25]);
});

Deno.test("参数验证 - Between操作需要2个参数", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const parsedQuery = parser.parseMethodName("findByAgeBetween");
  
  // 不应该抛出异常
  parser.validateParameters(parsedQuery, [18, 65]);
});

// 错误情况测试
Deno.test("错误 - 不支持的前缀", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  assertThrows(
    () => parser.parseMethodName("getByUsername"),
    Error,
    "不支持的查询方法"
  );
});

Deno.test("错误 - 不存在的字段", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  assertThrows(
    () => parser.parseMethodName("findByInvalidField"),
    Error,
    "字段 'invalidField' 不存在于实体中"
  );
});

Deno.test("错误 - 缺少查询条件", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  assertThrows(
    () => parser.parseMethodName("findBy"),
    Error,
    "缺少查询条件"
  );
});

Deno.test("错误 - 参数个数不匹配", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const parsedQuery = parser.parseMethodName("findByUsername");
  
  assertThrows(
    () => parser.validateParameters(parsedQuery, []),
    Error,
    "参数个数不匹配"
  );
});

Deno.test("错误 - Between操作参数不足", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const parsedQuery = parser.parseMethodName("findByAgeBetween");
  
  assertThrows(
    () => parser.validateParameters(parsedQuery, [18]),
    Error,
    "参数个数不匹配: 期望 2 个，实际 1 个"
  );
});

Deno.test("字段名大小写转换", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  // 现在首字母会自动转换：Username -> username
  const result1 = parser.parseMethodName("findByUsername");
  assertEquals(result1.conditions[0].field, "username");
  
  // 小写开头的字段名保持不变
  const result2 = parser.parseMethodName("findByusername");
  assertEquals(result2.conditions[0].field, "username");
  
  // 但是不存在的字段仍然会报错
  assertThrows(
    () => parser.parseMethodName("findByInvalidField"),
    Error,
    "字段 'invalidField' 不存在于实体中"
  );
});

Deno.test("复杂嵌套组合验证", () => {
  parser = new QueryMethodParser(USER_FIELDS);
  
  const methodName = "findByUsernameContainingAndAgeBetweenAndStatusInOrIsActiveTrue";
  const result = parser.parseMethodName(methodName);
  
  assertEquals(result.conditions.length, 4);
  assertEquals(result.conditions[0].operator, "containing");  // 1个参数
  assertEquals(result.conditions[1].operator, "between");     // 2个参数
  assertEquals(result.conditions[2].operator, "in");          // 1个参数  
  assertEquals(result.conditions[3].operator, "true");        // 0个参数
  assertEquals(result.expectedParameterCount, 4);
  assertEquals(result.logicalOperators, ["And", "And", "Or"]);
}); 