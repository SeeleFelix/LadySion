# AnimaWeave BDD测试规范

## 📋 测试文件组织原则

每个数学定义对应一个BDD测试文件，采用以下命名规范：

- `definition_XX_<name>_test.ts` - 对应数学定义XX的BDD测试
- 每个测试文件包含：哲学理念、数学定义、验证场景、测试实现

## 🗂️ 测试文件分组

### 🔤 基础数据结构 (定义1-4)

- `definition_01_semantic_labels_test.ts` - 语义标签集合
- `definition_02_control_signals_test.ts` - 控制信号语义标签集合
- `definition_03_port_definition_test.ts` - 端口定义
- `definition_04_label_compatibility_test.ts` - 语义标签兼容性关系

### 🔧 节点形式化表示 (定义5-6)

- `definition_05_node_tuple_test.ts` - 节点七元组
- `definition_06_node_computation_test.ts` - 节点计算函数

### 🔗 连接集合 (定义7-8)

- `definition_07_data_connections_test.ts` - 数据连接集合
- `definition_08_control_connections_test.ts` - 控制连接集合

### 📊 节点集合 (定义9)

- `definition_09_node_set_test.ts` - 节点集合

### 🌐 AnimaWeave图 (定义10-15)

- `definition_10_graph_tuple_test.ts` - AnimaWeave图三元组
- `definition_11_connection_validity_test.ts` - 连接有效性约束
- `definition_12_boundary_ports_test.ts` - 图的边界端口
- `definition_13_dag_constraints_test.ts` - 必选端口DAG约束
- `definition_14_output_immutability_test.ts` - 输出端口不可变性约束
- `definition_15_execution_uniqueness_test.ts` - 节点执行唯一性约束

### 🌊 双流系统 (定义16)

- `definition_16_dual_flow_system_test.ts` - 双流AnimaWeave系统六元组

### 🔄 执行状态空间 (定义17-24)

- `definition_17_global_state_test.ts` - 全局执行状态
- `definition_18_control_port_state_test.ts` - 控制端口状态空间
- `definition_19_activation_predicates_test.ts` - 节点控制模式与激活谓词
- `definition_20_data_ready_test.ts` - 数据就绪谓词
- `definition_21_control_activation_test.ts` - 控制激活谓词
- `definition_22_execution_ready_test.ts` - 节点执行就绪谓词
- `definition_23_state_transition_test.ts` - 控制状态转换函数
- `definition_24_state_relation_test.ts` - 状态转换关系

### 🔍 子图理论 (定义25-27)

- `definition_25_subgraph_relation_test.ts` - 子图关系
- `definition_26_encapsulation_test.ts` - 子图可封装条件
- `definition_27_isomorphism_test.ts` - 同构关系

### ⚡ 控制信号传播 (定义28-32)

- `definition_28_control_port_extension_test.ts` - 控制输入端口扩展
- `definition_29_signal_transmission_test.ts` - 信号传输函数
- `definition_30_port_value_computation_test.ts` - 端口值计算函数
- `definition_31_control_port_usage_test.ts` - 控制端口值使用说明
- `definition_32_global_state_transition_test.ts` - 全局状态转换

## 🎯 BDD测试模板

每个测试文件遵循以下模板：

```typescript
/**
 * # 定义XX：<数学定义名称>
 *
 * ## 哲学理念
 * <对应的哲学思想>
 *
 * ## 数学定义
 * <完整的数学公式和定义>
 *
 * ## 验证场景
 * <需要验证的具体场景>
 *
 * @module
 */

import { beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertThrows } from "jsr:@std/assert";
import { awakening } from "@/core/awakening.ts";

describe("定义XX：<数学定义名称>", () => {
  // 测试用例实现
});
```

## 🚀 实施计划

1. **第一阶段**：基础数据结构 (定义1-4)
2. **第二阶段**：节点和连接 (定义5-9)
3. **第三阶段**：图结构约束 (定义10-15)
4. **第四阶段**：执行语义 (定义16-24)
5. **第五阶段**：高级理论 (定义25-32)

每个阶段完成后，运行 `deno doc --html` 生成文档验证。
