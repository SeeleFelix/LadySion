# LangGraph集成指南

## 🎯 概述

LangGraph是一个用于构建多代理(multi-agent)和有状态AI应用的框架。它提供了循环执行、条件分支、持久状态等高级功能，非常适合构建复杂的AI工作流。

## 🏗️ 核心概念

### 图（Graph）
LangGraph的核心是状态图（StateGraph），其中：
- **节点（Nodes）**：执行特定功能的函数
- **边（Edges）**：连接节点的路径，可以是条件性的
- **状态（State）**：在整个工作流中持久保存的数据

### 状态管理
```python
from typing import TypedDict, List
from langgraph.graph import StateGraph

class GraphState(TypedDict):
    messages: List[str]
    current_step: str
    user_input: str
    ai_response: str
    metadata: dict
```

## 🚀 在Lady Sion中的应用

### 1. 多轮对话管理
```python
# 对话状态定义
class ConversationState(TypedDict):
    conversation_id: str
    messages: List[dict]
    character_context: str
    user_preferences: dict
    current_mood: str

def process_user_message(state: ConversationState) -> ConversationState:
    """处理用户消息"""
    # 分析用户输入
    user_input = state["messages"][-1]["content"]
    
    # 更新对话状态
    state["current_mood"] = analyze_mood(user_input)
    
    return state

def generate_character_response(state: ConversationState) -> ConversationState:
    """生成角色响应"""
    # 基于状态生成响应
    response = llm.generate(
        character_context=state["character_context"],
        conversation_history=state["messages"],
        user_mood=state["current_mood"]
    )
    
    # 更新消息历史
    state["messages"].append({
        "role": "assistant",
        "content": response
    })
    
    return state
```

### 2. 角色切换工作流
```python
def character_switch_workflow():
    """角色切换工作流"""
    workflow = StateGraph(ConversationState)
    
    # 添加节点
    workflow.add_node("validate_switch", validate_character_switch)
    workflow.add_node("save_context", save_current_context)
    workflow.add_node("load_character", load_new_character)
    workflow.add_node("transition_message", generate_transition_message)
    
    # 添加边
    workflow.add_edge("validate_switch", "save_context")
    workflow.add_edge("save_context", "load_character")
    workflow.add_edge("load_character", "transition_message")
    
    # 设置入口点
    workflow.set_entry_point("validate_switch")
    
    return workflow.compile()
```

### 3. 预设应用工作流
```python
def preset_application_workflow():
    """预设应用工作流"""
    workflow = StateGraph(PresetState)
    
    def should_merge_presets(state) -> str:
        """决定是否需要合并多个预设"""
        if len(state["selected_presets"]) > 1:
            return "merge"
        return "apply_single"
    
    # 条件分支
    workflow.add_conditional_edges(
        "analyze_presets",
        should_merge_presets,
        {
            "merge": "merge_presets",
            "apply_single": "apply_preset"
        }
    )
    
    return workflow.compile()
```

## 🔧 集成实现

### 后端集成
```typescript
// src/infrastructure/adapters/langgraph/LangGraphAdapter.ts
export class LangGraphAdapter {
    private pythonProcess: ChildProcess;
    
    constructor(private config: LangGraphConfig) {
        this.initializePythonProcess();
    }
    
    async executeWorkflow(
        workflowName: string, 
        state: any
    ): Promise<WorkflowResult> {
        const request = {
            workflow: workflowName,
            state: state,
            config: this.config
        };
        
        return this.sendToPython('execute_workflow', request);
    }
    
    async createDynamicWorkflow(
        definition: WorkflowDefinition
    ): Promise<string> {
        const request = {
            definition: definition
        };
        
        const result = await this.sendToPython('create_workflow', request);
        return result.workflow_id;
    }
    
    private async sendToPython(command: string, data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const message = JSON.stringify({ command, data });
            
            this.pythonProcess.stdin?.write(message + '\n');
            
            this.pythonProcess.stdout?.once('data', (response) => {
                try {
                    const result = JSON.parse(response.toString());
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
}
```

### Python工作流服务
```python
# workflows/conversation_flow.py
import sys
import json
from langgraph.graph import StateGraph
from typing import TypedDict, Dict, Any

class WorkflowManager:
    def __init__(self):
        self.workflows = {}
        self.register_default_workflows()
    
    def register_default_workflows(self):
        """注册默认工作流"""
        self.workflows['conversation'] = self.create_conversation_workflow()
        self.workflows['character_switch'] = self.create_character_switch_workflow()
    
    def create_conversation_workflow(self):
        """创建对话工作流"""
        workflow = StateGraph(ConversationState)
        
        workflow.add_node("process_input", self.process_user_input)
        workflow.add_node("generate_response", self.generate_ai_response)
        workflow.add_node("update_context", self.update_conversation_context)
        
        workflow.add_edge("process_input", "generate_response")
        workflow.add_edge("generate_response", "update_context")
        
        workflow.set_entry_point("process_input")
        workflow.set_finish_point("update_context")
        
        return workflow.compile()
    
    def execute_workflow(self, workflow_name: str, state: Dict[str, Any]) -> Dict[str, Any]:
        """执行指定工作流"""
        if workflow_name not in self.workflows:
            raise ValueError(f"Workflow {workflow_name} not found")
        
        workflow = self.workflows[workflow_name]
        result = workflow.invoke(state)
        
        return result

def main():
    """主循环，处理来自Node.js的请求"""
    manager = WorkflowManager()
    
    for line in sys.stdin:
        try:
            request = json.loads(line.strip())
            command = request.get('command')
            data = request.get('data')
            
            if command == 'execute_workflow':
                result = manager.execute_workflow(
                    data['workflow'], 
                    data['state']
                )
                print(json.dumps(result))
            
            elif command == 'create_workflow':
                # 动态创建工作流的逻辑
                workflow_id = manager.create_dynamic_workflow(data['definition'])
                print(json.dumps({'workflow_id': workflow_id}))
            
        except Exception as e:
            print(json.dumps({'error': str(e)}))

if __name__ == "__main__":
    main()
```

## 🎨 高级特性

### 1. 条件分支
```python
def create_adaptive_response_workflow():
    """创建自适应响应工作流"""
    workflow = StateGraph(ResponseState)
    
    def route_by_mood(state) -> str:
        mood = state.get("user_mood", "neutral")
        if mood in ["sad", "angry"]:
            return "empathetic_response"
        elif mood in ["happy", "excited"]:
            return "enthusiastic_response"
        else:
            return "neutral_response"
    
    workflow.add_conditional_edges(
        "analyze_mood",
        route_by_mood,
        {
            "empathetic_response": "generate_empathetic",
            "enthusiastic_response": "generate_enthusiastic",
            "neutral_response": "generate_neutral"
        }
    )
```

### 2. 循环执行
```python
def create_iterative_improvement_workflow():
    """创建迭代改进工作流"""
    workflow = StateGraph(ImprovementState)
    
    def should_continue(state) -> str:
        if state["iteration_count"] < state["max_iterations"]:
            if state["quality_score"] < state["target_quality"]:
                return "improve"
        return "finish"
    
    workflow.add_conditional_edges(
        "evaluate_quality",
        should_continue,
        {
            "improve": "refine_response",
            "finish": END
        }
    )
    
    # 创建循环
    workflow.add_edge("refine_response", "evaluate_quality")
```

### 3. 状态持久化
```python
# 使用SQLite持久化状态
from langgraph.checkpoint.sqlite import SqliteSaver

def create_persistent_workflow():
    """创建带持久化的工作流"""
    # 创建检查点保存器
    checkpointer = SqliteSaver.from_conn_string("conversation_state.db")
    
    workflow = StateGraph(ConversationState)
    # ... 添加节点和边
    
    # 编译时启用检查点
    app = workflow.compile(checkpointer=checkpointer)
    
    return app
```

## 📊 性能优化

### 1. 异步执行
```python
import asyncio
from langgraph.graph import StateGraph

async def async_node(state):
    """异步节点处理"""
    # 并行执行多个任务
    tasks = [
        analyze_sentiment(state["user_input"]),
        extract_entities(state["user_input"]),
        classify_intent(state["user_input"])
    ]
    
    results = await asyncio.gather(*tasks)
    
    state["sentiment"] = results[0]
    state["entities"] = results[1]
    state["intent"] = results[2]
    
    return state
```

### 2. 缓存机制
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_analysis(text: str) -> dict:
    """缓存分析结果"""
    # 昂贵的分析操作
    return expensive_analysis(text)
```

## 🔍 调试和监控

### 1. 工作流可视化
```python
# 生成工作流图像
def visualize_workflow(workflow):
    """可视化工作流"""
    try:
        import matplotlib.pyplot as plt
        import networkx as nx
        
        # 将LangGraph转换为NetworkX图
        graph = workflow.get_graph()
        
        # 可视化
        plt.figure(figsize=(12, 8))
        pos = nx.spring_layout(graph)
        nx.draw(graph, pos, with_labels=True, node_color='lightblue')
        plt.savefig('workflow_diagram.png')
    except ImportError:
        print("请安装matplotlib和networkx进行可视化")
```

### 2. 执行追踪
```python
def trace_workflow_execution(workflow, state):
    """追踪工作流执行"""
    trace = []
    
    def trace_node(node_name, input_state, output_state):
        trace.append({
            'node': node_name,
            'timestamp': datetime.now(),
            'input': input_state,
            'output': output_state
        })
    
    # 添加追踪钩子
    workflow.add_hook('before_node', trace_node)
    
    result = workflow.invoke(state)
    
    return result, trace
```

## 🚀 最佳实践

### 1. 模块化设计
- 将复杂工作流拆分为可复用的子图
- 使用清晰的状态定义和类型注解
- 实现错误处理和恢复机制

### 2. 性能考虑
- 合理使用缓存减少重复计算
- 实施超时机制避免无限循环
- 监控内存使用，及时清理不需要的状态

### 3. 可维护性
- 提供详细的工作流文档
- 使用版本控制管理工作流定义
- 实现工作流的测试框架

这个指南提供了LangGraph在Lady Sion项目中的完整集成方案，支持复杂的AI工作流编排和状态管理。 