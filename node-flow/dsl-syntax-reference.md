# NodeFlow DSL 语法快速参考

## 📋 概述

NodeFlow DSL支持两种文件类型：
- **`.nodeflow`** - 节点和类型定义文件
- **`.grph.nodeflow`** - 图实例文件

---

## 🔤 文件类型

### 节点定义文件 (`.nodeflow`)

```nodeflow
-- import
basic.nodeflow
--

-- types 
int {
    double
    Basic.double
}
--

-- nodes
Add {
    mode Concurrent
    
    in {
        a int
        b int optional
        execute Basic.Signal mode=AND
    }
    
    out {
        result int
        done Basic.Signal
    }
}
--
```

### 图实例文件 (`.grph.nodeflow`)

```nodeflow
-- import
basic.nodeflow
add.nodeflow
--

-- graph
nodes {
    add1 add.Add
    add2 add.Add {
        mode Sequential
    }
}

datas {
    add1.result -> add2.a
}

controls {
    add1.done -> add2.execute
}
--
```

---

## 📐 语法结构

### Import 语法
```nodeflow
-- import
module.nodeflow
other.nodeflow {
    alias_name OriginalName
}
--
```

### Types 语法
```nodeflow
-- types
TypeName {
    CompatibleType1
    CompatibleType2
    Module.CompatibleType3
}
--
```

### Nodes 语法
```nodeflow
-- nodes
NodeName {
    mode Concurrent | Sequential
    
    in {
        port_name TypeName [optional | mode=AND|OR|XOR]
    }
    
    out {
        port_name TypeName
    }
}
--
```

**注意**：`optional` 与 `mode=` 修饰符互斥，不能同时使用。

### Graph 语法
```nodeflow
-- graph
nodes {
    instance_name NodeType [{ override_config }]
}

datas {
    source.port -> target.port;
}

controls {
    source.port -> target.port;
}
--
```

---

## 🔧 语法要素

### 标识符规则
- **字母开头**：`a-z A-Z _`
- **后续字符**：`a-z A-Z 0-9 _`
- **限定名**：`module.name`

### 关键字
- **文件结构**：`import`, `types`, `nodes`, `graph`
- **端口类型**：`in`, `out`
- **修饰符**：`optional`, `mode`
- **并发模式**：`Concurrent`, `Sequential`
- **激活模式**：`AND`, `OR`, `XOR`

### 区块结束标记
所有区块统一使用 `--` 结束，不使用 `---`。

### 连接语法
```nodeflow
source.port -> target.port;          // 基本连接
source.port -> target.port;  // 行末注释
```

### 注释使用规范
```nodeflow
// 单行注释，从//开始到行末
a int                    // 端口定义后的注释
source.port -> target.port;  // 连接语句后的注释
```

### 实例覆盖语法
```nodeflow
instance_name NodeType {
    mode Sequential
    port_name mode=OR
}
```

### 端口修饰符约束
- **数据端口**：可以使用 `optional`
- **控制端口**：可以使用 `mode=AND|OR|XOR`
- **互斥规则**：一个端口只能有一种修饰符

---

## 🎯 语法示例

### 完整示例：基础计算

#### 1. 基础类型定义 (`basic.nodeflow`)
```nodeflow
-- types
int
double {
    int
}
Signal

-- nodes
RandomInput {
    mode Concurrent
    in {
        trigger Signal
    }
    out {
        value int
        ready Signal
    }
}
--
```

#### 2. 算术节点定义 (`add.nodeflow`)
```nodeflow
-- import
basic.nodeflow
--

-- nodes
Add {
    mode Concurrent
    in {
        a int
        b int
        execute Signal mode=AND
    }
    out {
        result int
        done Signal
    }
}
--
```

#### 3. 计算图实例 (`sample.grph.nodeflow`)
```nodeflow
-- import
basic.nodeflow
add.nodeflow
--

-- graph
nodes {
    input1 basic.RandomInput
    add1 add.Add
    add2 add.Add
}

datas {
    input1.value -> add1.a
    input1.value -> add1.b
    add1.result -> add2.a
}

controls {
    input1.ready -> add1.execute
    add1.done -> add2.execute
}
--
```

---

## 🚨 语法约束

### 静态检查规则
1. **类型兼容性**：连接端口必须类型兼容
2. **DAG约束**：必选端口不能形成循环
3. **端口存在性**：引用的端口必须存在
4. **模块依赖**：import的模块必须存在

### 运行时约束
1. **输出不可变性**：已完成节点的输出不可修改
2. **执行唯一性**：节点同时最多一个实例在运行
3. **并发模式**：Sequential模式下全局最多一个节点运行

---

## 📚 相关文档

- [NodeFlow DSL设计文档](./nodeflow-dsl-design.md)
- [数学形式化定义](./nodeflow-mathematica-definition.md)
- [语法规范EBNF](./nodeflow-grammar.ebnf) 