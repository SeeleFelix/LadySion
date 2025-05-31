/**
 * TRA 查询方法名解析器 - Spring Data JPA风格
 * 解析类似 findByUsernameAndAge、findByEmailOrName 的方法名
 */

export interface QueryMethodInfo {
  operation: string; // 'findBy', 'countBy', 'deleteBy'
  fields: string[]; // 字段名数组
  operators: string[]; // 操作符数组 ['And', 'Or', 'GreaterThan', etc.]
  isValid: boolean; // 是否是有效的查询方法
}

/**
 * 支持的查询操作符
 */
const QUERY_OPERATORS = [
  'And',
  'Or',
  'GreaterThan',
  'LessThan',
  'GreaterThanEqual',
  'LessThanEqual',
  'Like',
  'NotLike',
  'In',
  'NotIn',
  'IsNull',
  'IsNotNull',
  'True',
  'False',
  'StartingWith',
  'EndingWith',
  'Containing',
  'Between',
] as const;

/**
 * 支持的查询前缀
 */
const QUERY_PREFIXES = ['findBy', 'findAllBy', 'countBy', 'deleteBy'] as const;

/**
 * 解析查询方法名
 * 例如: findByUsernameAndAgeGreaterThan
 * 返回: { operation: 'findBy', fields: ['username', 'age'], operators: ['And', 'GreaterThan'] }
 */
export function parseQueryMethodName(methodName: string): QueryMethodInfo {
  // 检查是否以支持的前缀开头
  const prefix = QUERY_PREFIXES.find(p => methodName.startsWith(p));
  if (!prefix) {
    return {
      operation: '',
      fields: [],
      operators: [],
      isValid: false,
    };
  }

  // 移除前缀，获取查询条件部分
  const queryPart = methodName.substring(prefix.length);
  if (!queryPart) {
    return {
      operation: '',
      fields: [],
      operators: [],
      isValid: false,
    };
  }

  // 解析字段和操作符
  const { fields, operators } = parseQueryPart(queryPart);

  return {
    operation: prefix,
    fields,
    operators,
    isValid: fields.length > 0,
  };
}

/**
 * 解析查询条件部分
 * 例如: "UsernameAndAgeGreaterThan" -> fields: ['username', 'age'], operators: ['And', 'GreaterThan']
 */
function parseQueryPart(queryPart: string): { fields: string[], operators: string[] } {
  const fields: string[] = [];
  const operators: string[] = [];
  
  let currentField = '';
  let i = 0;
  
  while (i < queryPart.length) {
    // 检查是否匹配操作符
    let foundOperator = false;
    
    for (const operator of QUERY_OPERATORS) {
      if (queryPart.substring(i).startsWith(operator)) {
        // 找到操作符，保存当前字段
        if (currentField) {
          fields.push(camelCaseToSnakeCase(currentField));
          currentField = '';
        }
        operators.push(operator);
        i += operator.length;
        foundOperator = true;
        break;
      }
    }
    
    if (!foundOperator) {
      // 没有找到操作符，继续构建字段名
      currentField += queryPart[i];
      i++;
    }
  }
  
  // 添加最后一个字段
  if (currentField) {
    fields.push(camelCaseToSnakeCase(currentField));
  }
  
  return { fields, operators };
}

/**
 * 将驼峰命名转换为蛇形命名
 * 例如: "UserName" -> "username", "firstName" -> "firstName"
 */
function camelCaseToSnakeCase(str: string): string {
  // 首字母小写
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * 验证查询方法是否有效
 */
export function isValidQueryMethod(methodName: string): boolean {
  const info = parseQueryMethodName(methodName);
  return info.isValid;
}

/**
 * 获取查询方法的参数数量
 * 根据解析的字段和操作符确定需要多少个参数
 */
export function getExpectedParameterCount(methodName: string): number {
  const info = parseQueryMethodName(methodName);
  if (!info.isValid) {
    return 0;
  }
  
  let paramCount = 0;
  
  for (let i = 0; i < info.fields.length; i++) {
    const nextOperator = info.operators[i];
    
    if (nextOperator === 'Between') {
      paramCount += 2; // Between需要两个参数
    } else if (nextOperator === 'IsNull' || nextOperator === 'IsNotNull' || 
               nextOperator === 'True' || nextOperator === 'False') {
      // 这些操作符不需要参数
      paramCount += 0;
    } else {
      paramCount += 1; // 大多数操作符需要一个参数
    }
  }
  
  // 如果没有操作符，就是简单的等值查询
  if (info.operators.length === 0) {
    paramCount = info.fields.length;
  }
  
  return paramCount;
} 