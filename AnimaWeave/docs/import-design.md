# AnimaWeave Import 系统设计 (极简版)

## 📋 设计原则

1. **极简结构**：一个插件一个anima文件
2. **命名一致**：插件名 = anima文件名
3. **后缀区分**：`.anima` 插件，`.weave` 本地子图
4. **别名机制**：通过别名解决命名冲突
5. **自动生成**：anima文件由插件代码自动生成

## 🏗️ 架构设计

### 目录结构

```
sanctum/
├── basic.anima          # basic插件的anima文件
├── custom.anima         # custom插件的anima文件
├── ml.anima            # ml插件的anima文件
├── ui.anima            # ui插件的anima文件
└── advanced.anima      # advanced插件的anima文件

subgraphs/              # 本地子图目录
├── common.weave
├── utils.weave
└── workflows/
    ├── data_process.weave
    └── ui_flow.weave
```

### 生成流程

```
plugins/basic/src/lib.rs    →  [编译+生成]  →  sanctum/basic.anima
plugins/custom/src/lib.rs   →  [编译+生成]  →  sanctum/custom.anima
plugins/ml/src/lib.rs       →  [编译+生成]  →  sanctum/ml.anima
```

## 🎯 Import 语法

### 基本语法

```weave
-- imports
plugin.anima                    // 插件导入
plugin.anima {                  // 带别名的插件导入
    alias_name node_name
}
subgraph.weave                  // 本地子图导入
subgraph.weave {                // 带别名的子图导入
    alias_name node_name
}
--
```

### 使用示例

```weave
-- imports
basic.anima                     // 导入 sanctum/basic.anima
custom.anima {                  // 导入 sanctum/custom.anima 并设置别名
    my_basic basic              // 将 basic 节点别名为 my_basic
    my_start start              // 将 start 节点别名为 my_start
}
ml.anima                        // 导入 sanctum/ml.anima
common.weave                    // 导入 subgraphs/common.weave
--

nodes {
    // 插件节点引用
    starter basic.Start          // basic插件中的Start节点
    processor custom.basic       // custom插件中的basic节点
    enhanced my_basic            // 使用别名
    ai_module ml.NeuralNet       // ml插件中的NeuralNet节点
    
    // 子图节点引用
    utility common.Logger        // common子图中的Logger节点
}
```

## 🔧 解析规则

### 1. 插件导入
```weave
basic.anima  →  sanctum/basic.anima
```

### 2. 子图导入
```weave
common.weave  →  subgraphs/common.weave
```

### 3. 带别名导入
```weave
custom.anima {
    my_basic basic
}
```
- 创建别名映射：`my_basic` → `custom.basic`
- 原路径仍然可用：`custom.basic`

### 4. 节点引用方式
1. **完整路径**：`plugin.node` (如 `basic.Start`)
2. **别名引用**：`alias` (如 `my_basic`)

## 📖 详细示例

### 场景：混合使用插件和子图

```weave
-- imports
basic.anima                     // 基础插件
custom.anima {                  // 自定义插件
    enhanced_start start        
    enhanced_proc processor     
}
ml.anima
ui.anima
common.weave                    // 通用工具子图
data_flow.weave {               // 数据流子图
    data_in input_node
    data_out output_node
}
--

nodes {
    // 基础组件 (插件)
    input basic.Input
    starter basic.Start
    
    // 自定义增强组件 (插件 + 别名)
    custom_starter enhanced_start     
    custom_proc enhanced_proc         
    
    // AI组件 (插件)
    network ml.NeuralNetwork
    display ui.Display
    
    // 工具组件 (子图)
    logger common.Logger
    validator common.Validator
    
    // 数据流组件 (子图 + 别名)
    data_input data_in
    data_output data_out
}

datas {
    input.signal -> starter.input
    starter.output -> custom_starter.input
    custom_starter.result -> network.input
    network.output -> display.data
    
    // 日志和验证
    starter.log -> logger.input
    network.output -> validator.input
    
    // 数据流
    data_input.stream -> network.data_input
    network.data_output -> data_output.stream
}
```

## 🚀 优势

1. **语义清晰**：`.anima` vs `.weave` 一目了然
2. **极简结构**：`plugin.anima` 直接对应文件
3. **灵活组合**：插件和子图可以混合使用
4. **别名支持**：解决命名冲突
5. **易于管理**：每个插件一个anima文件

## 🔄 迁移路径

### 当前结构
```
src/plugins/basic/sanctum/basic.anima
tests/sanctums/basic/genesis.weave
```

### 目标结构  
```
sanctum/basic.anima
subgraphs/genesis.weave
```

### 迁移步骤

#### 步骤1：修复当前包名匹配问题
```rust
// 当前问题：basic.anima vs basic
// 解决：统一为 basic
```

#### 步骤2：支持新语法
```weave
-- imports  
basic.anima
--
```

#### 步骤3：重构目录结构
- 移动anima文件到 `sanctum/`
- 移动weave文件到 `subgraphs/`

#### 步骤4：添加别名功能
```weave
-- imports
custom.anima { my_node node }
--
```

## 🎯 实现要点

### 解析器修改
```rust
// 解析import语句
fn parse_import_section(pair: Pair<Rule>) -> Vec<ImportStatement> {
    // basic.anima  →  ImportStatement { 
    //     file_type: Anima, 
    //     name: "basic", 
    //     aliases: None 
    // }
    // common.weave  →  ImportStatement { 
    //     file_type: Weave, 
    //     name: "common", 
    //     aliases: None 
    // }
}

#[derive(Debug)]
enum ImportFileType {
    Anima,  // 插件
    Weave,  // 子图
}
```

### 文件路径解析
```rust
fn resolve_import_path(name: &str, file_type: ImportFileType) -> PathBuf {
    match file_type {
        ImportFileType::Anima => PathBuf::from(format!("sanctum/{}.anima", name)),
        ImportFileType::Weave => PathBuf::from(format!("subgraphs/{}.weave", name)),
    }
}
```

### 当前问题的解决

**现在的解决方案**：
- import: `basic.anima` 
- 解析包名: `basic` (去掉.anima后缀)
- 包名匹配: `basic` ✅

**清晰的语义区分**：
- `.anima` = 插件类型定义
- `.weave` = 用户图文件

这样既解决了当前的包名问题，又为将来的功能扩展提供了清晰的语义基础！

现在让我们开始按步骤实现吧！ 