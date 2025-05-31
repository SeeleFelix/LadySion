/**
 * JPA风格查询方法解析器
 * 严格按照Spring Data JPA规范解析方法名，验证字段和操作符
 */

/**
 * 支持的查询操作符
 */
export const QUERY_OPERATORS = {
  // 比较操作
  'GreaterThan': 'gt',
  'LessThan': 'lt', 
  'GreaterThanEqual': 'gte',
  'LessThanEqual': 'lte',
  'Between': 'between',
  'In': 'in',
  'NotIn': 'notIn',
  
  // 字符串操作
  'Like': 'like',
  'NotLike': 'notLike',
  'Containing': 'containing',
  'StartingWith': 'startingWith',
  'EndingWith': 'endingWith',
  
  // 空值检查
  'IsNull': 'isNull',
  'IsNotNull': 'isNotNull',
  'IsEmpty': 'isEmpty',
  'IsNotEmpty': 'isNotEmpty',
  
  // 布尔值
  'True': 'true',
  'False': 'false',
} as const;

/**
 * 支持的查询前缀
 */
export const QUERY_PREFIXES = [
  'findBy',
  'findAllBy', 
  'findFirstBy',
  'findTopBy',
  'countBy',
  'existsBy',
  'deleteBy',
  'removeBy'
] as const;

/**
 * 逻辑连接符
 */
export const LOGICAL_OPERATORS = ['And', 'Or'] as const;

/**
 * 解析后的查询条件
 */
export interface QueryCondition {
  field: string;
  operator: string;
  parameterIndex: number;
  parameterCount: number; // between需要2个参数
}

/**
 * 解析后的查询结构
 */
export interface ParsedQuery {
  prefix: string;        // 查询前缀：findBy, countBy等
  conditions: QueryCondition[];
  logicalOperators: string[]; // ['And', 'Or'] 连接条件
  expectedParameterCount: number;
}

/**
 * JPA查询方法解析器
 */
export class QueryMethodParser<T = any> {
  private entityFields: Set<string>;
  
  constructor(entityFields: string[]) {
    this.entityFields = new Set(entityFields);
  }
  
  /**
   * 解析JPA风格的方法名
   * @param methodName 方法名，如 findByUsernameAndAgeGreaterThan
   * @returns 解析后的查询结构
   */
  parseMethodName(methodName: string): ParsedQuery {
    // 1. 检查是否有有效的查询前缀
    const prefix = this.extractPrefix(methodName);
    if (!prefix) {
      throw new Error(`不支持的查询方法: ${methodName}. 支持的前缀: ${QUERY_PREFIXES.join(', ')}`);
    }
    
    // 2. 提取查询条件部分
    const conditionPart = methodName.substring(prefix.length);
    if (!conditionPart) {
      throw new Error(`缺少查询条件: ${methodName}`);
    }
    
    // 3. 解析查询条件
    const { conditions, logicalOperators } = this.parseConditions(conditionPart);
    
    // 4. 计算期望的参数个数
    const expectedParameterCount = conditions.reduce(
      (count, condition) => count + condition.parameterCount, 
      0
    );
    
    return {
      prefix,
      conditions,
      logicalOperators,
      expectedParameterCount
    };
  }
  
  /**
   * 验证方法调用的参数
   */
  validateParameters(parsedQuery: ParsedQuery, args: any[]): void {
    if (args.length !== parsedQuery.expectedParameterCount) {
      throw new Error(
        `参数个数不匹配: 期望 ${parsedQuery.expectedParameterCount} 个，实际 ${args.length} 个`
      );
    }
  }
  
  /**
   * 提取查询前缀
   */
  private extractPrefix(methodName: string): string | null {
    for (const prefix of QUERY_PREFIXES) {
      if (methodName.startsWith(prefix)) {
        return prefix;
      }
    }
    return null;
  }
  
  /**
   * 解析查询条件
   */
  private parseConditions(conditionPart: string): {
    conditions: QueryCondition[];
    logicalOperators: string[];
  } {
    const conditions: QueryCondition[] = [];
    const logicalOperators: string[] = [];
    
    // 按And/Or分割条件
    const segments = this.splitByLogicalOperators(conditionPart);
    let parameterIndex = 0;
    
    for (let i = 0; i < segments.conditions.length; i++) {
      const condition = this.parseCondition(segments.conditions[i], parameterIndex);
      conditions.push(condition);
      parameterIndex += condition.parameterCount;
      
      if (i < segments.logicalOperators.length) {
        logicalOperators.push(segments.logicalOperators[i]);
      }
    }
    
    return { conditions, logicalOperators };
  }
  
  /**
   * 按逻辑操作符分割条件
   */
  private splitByLogicalOperators(text: string): {
    conditions: string[];
    logicalOperators: string[];
  } {
    const conditions: string[] = [];
    const logicalOperators: string[] = [];
    
    let current = '';
    let i = 0;
    
    while (i < text.length) {
      let foundOperator = false;
      
      // 检查是否匹配逻辑操作符
      for (const op of LOGICAL_OPERATORS) {
        if (text.substring(i, i + op.length) === op) {
          conditions.push(current);
          logicalOperators.push(op);
          current = '';
          i += op.length;
          foundOperator = true;
          break;
        }
      }
      
      if (!foundOperator) {
        current += text[i];
        i++;
      }
    }
    
    if (current) {
      conditions.push(current);
    }
    
    return { conditions, logicalOperators };
  }
  
  /**
   * 解析单个条件
   */
  private parseCondition(conditionText: string, parameterIndex: number): QueryCondition {
    // 检查是否有操作符
    for (const [operatorName, operatorCode] of Object.entries(QUERY_OPERATORS)) {
      if (conditionText.endsWith(operatorName)) {
        const fieldNameRaw = conditionText.substring(0, conditionText.length - operatorName.length);
        const fieldName = this.capitalizeToLowerCase(fieldNameRaw);
        
        // 验证字段是否存在
        if (!this.entityFields.has(fieldName)) {
          throw new Error(`字段 '${fieldName}' 不存在于实体中. 可用字段: ${Array.from(this.entityFields).join(', ')}`);
        }
        
        // 确定参数个数
        const parameterCount = operatorCode === 'between' ? 2 : 
                              (operatorCode === 'isNull' || operatorCode === 'isNotNull' || 
                               operatorCode === 'isEmpty' || operatorCode === 'isNotEmpty' ||
                               operatorCode === 'true' || operatorCode === 'false') ? 0 : 1;
        
        return {
          field: fieldName,
          operator: operatorCode,
          parameterIndex,
          parameterCount
        };
      }
    }
    
    // 如果没有操作符，默认是等值查询
    const fieldName = this.capitalizeToLowerCase(conditionText);
    if (!this.entityFields.has(fieldName)) {
      throw new Error(`字段 '${fieldName}' 不存在于实体中. 可用字段: ${Array.from(this.entityFields).join(', ')}`);
    }
    
    return {
      field: fieldName,
      operator: 'eq',
      parameterIndex,
      parameterCount: 1
    };
  }

  /**
   * 将首字母大写的字段名转换为小写
   * 例如：Username -> username, Age -> age
   */
  private capitalizeToLowerCase(text: string): string {
    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
} 