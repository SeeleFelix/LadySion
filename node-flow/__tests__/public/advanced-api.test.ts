/**
 * 🧪 高级API测试 - 输入输出系统
 */

import { describe, it } from '@std/testing/bdd';
import { assertExists, assertEquals, assertThrows } from '@std/assert';
import { createNodeFlow, NodeType } from '../../public/index.ts';

describe('NodeFlow高级功能', () => {
  describe('节点输入输出系统', () => {
    it('应该能定义节点的输入和输出端口', () => {
      const nodeFlow = createNodeFlow();
      const factory = nodeFlow.createNodeFactory();
      
      // 创建有多个输入输出的节点
      const node = factory.createAdvancedNode('merge', 'Merge Node', {
        inputs: [
          { name: 'input1', type: 'string' },
          { name: 'input2', type: 'number' }
        ],
        outputs: [
          { name: 'result', type: 'object' },
          { name: 'metadata', type: 'object' }
        ],
        process: (inputs: any) => {
          return {
            result: { merged: `${inputs.input1}_${inputs.input2}` },
            metadata: { timestamp: Date.now() }
          };
        }
      });
      
      assertExists(node);
      assertEquals(node.getInputPorts().length, 2);
      assertEquals(node.getOutputPorts().length, 2);
      assertEquals(node.getInputPorts()[0].name, 'input1');
      assertEquals(node.getOutputPorts()[0].name, 'result');
    });

    it('应该支持端口到端口的精确连接', () => {
      const nodeFlow = createNodeFlow();
      const graph = nodeFlow.createGraph();
      const factory = nodeFlow.createNodeFactory();
      
      // 创建节点
      const sourceNode = factory.createAdvancedNode('source', 'Source', {
        outputs: [
          { name: 'data', type: 'string' },
          { name: 'count', type: 'number' }
        ]
      });
      
      const targetNode = factory.createAdvancedNode('target', 'Target', {
        inputs: [
          { name: 'text', type: 'string' },
          { name: 'num', type: 'number' }
        ]
      });
      
      graph.addNode(sourceNode);
      graph.addNode(targetNode);
      
      // 端口到端口的连接
      graph.addPortConnection('source', 'data', 'target', 'text');
      graph.addPortConnection('source', 'count', 'target', 'num');
      
      const connections = graph.getPortConnections();
      assertEquals(connections.length, 2);
      assertEquals(connections[0].fromPort, 'data');
      assertEquals(connections[0].toPort, 'text');
    });

    it('应该验证一个输入只能连接一个输出', () => {
      const nodeFlow = createNodeFlow();
      const graph = nodeFlow.createGraph();
      const factory = nodeFlow.createNodeFactory();
      
      const node1 = factory.createAdvancedNode('node1', 'Node 1', {
        outputs: [{ name: 'out', type: 'string' }]
      });
      
      const node2 = factory.createAdvancedNode('node2', 'Node 2', {
        outputs: [{ name: 'out', type: 'string' }]
      });
      
      const node3 = factory.createAdvancedNode('node3', 'Node 3', {
        inputs: [{ name: 'in', type: 'string' }]
      });
      
      graph.addNode(node1);
      graph.addNode(node2);
      graph.addNode(node3);
      
      // 第一个连接应该成功
      graph.addPortConnection('node1', 'out', 'node3', 'in');
      
      // 第二个连接到同一个输入应该失败
      assertThrows(() => {
        graph.addPortConnection('node2', 'out', 'node3', 'in');
      }, Error, '输入端口已被占用');
    });

    it('应该支持一个输出连接多个输入', () => {
      const nodeFlow = createNodeFlow();
      const graph = nodeFlow.createGraph();
      const factory = nodeFlow.createNodeFactory();
      
      const sourceNode = factory.createAdvancedNode('source', 'Source', {
        outputs: [{ name: 'data', type: 'string' }]
      });
      
      const target1 = factory.createAdvancedNode('target1', 'Target 1', {
        inputs: [{ name: 'input', type: 'string' }]
      });
      
      const target2 = factory.createAdvancedNode('target2', 'Target 2', {
        inputs: [{ name: 'input', type: 'string' }]
      });
      
      graph.addNode(sourceNode);
      graph.addNode(target1);
      graph.addNode(target2);
      
      // 一个输出连接多个输入
      graph.addPortConnection('source', 'data', 'target1', 'input');
      graph.addPortConnection('source', 'data', 'target2', 'input');
      
      const connections = graph.getPortConnections();
      assertEquals(connections.length, 2);
      assertEquals(connections[0].fromNode, 'source');
      assertEquals(connections[1].fromNode, 'source');
    });
  });

  describe('自定义节点类型', () => {
    it('应该支持注册自定义节点类型', () => {
      const nodeFlow = createNodeFlow();
      const factory = nodeFlow.createNodeFactory();
      
      // 注册自定义节点类型
      factory.registerNodeType('custom-processor', {
        defaultInputs: [
          { name: 'data', type: 'any' }
        ],
        defaultOutputs: [
          { name: 'processed', type: 'any' }
        ],
        process: (inputs: any) => {
          return { processed: `Processed: ${JSON.stringify(inputs.data)}` };
        }
      });
      
      // 使用自定义类型创建节点
      const node = factory.createNode('test', 'Test Custom', 'custom-processor' as NodeType);
      
      assertExists(node);
      assertEquals(node.type, 'custom-processor');
      assertEquals(node.getInputPorts().length, 1);
      assertEquals(node.getOutputPorts().length, 1);
    });

    it('应该支持继承和扩展已有节点类型', () => {
      const nodeFlow = createNodeFlow();
      const factory = nodeFlow.createNodeFactory();
      
      // 继承PureNode并扩展
      factory.registerNodeType('enhanced-pure', {
        extends: NodeType.PURE,
        additionalInputs: [
          { name: 'config', type: 'object' }
        ],
        additionalOutputs: [
          { name: 'logs', type: 'array' }
        ],
        process: (inputs: any) => {
          const logs: string[] = [];
          logs.push(`Processing with config: ${JSON.stringify(inputs.config)}`);
          
          return {
            result: inputs.data,
            logs
          };
        }
      });
      
      const node = factory.createNode('enhanced', 'Enhanced Pure', 'enhanced-pure' as NodeType);
      
      assertExists(node);
      assertEquals(node.getInputPorts().length, 2); // data + config
      assertEquals(node.getOutputPorts().length, 2); // result + logs
    });
  });

  describe('复合节点和节点组', () => {
    it('应该能创建复合节点包含子图', () => {
      const nodeFlow = createNodeFlow();
      const factory = nodeFlow.createNodeFactory();
      const graph = nodeFlow.createGraph();
      
      // 创建子图
      const subGraph = nodeFlow.createGraph();
      const input = factory.createAdvancedNode('input', 'Input', {
        outputs: [{ name: 'data', type: 'string' }]
      });
      const processor = factory.createAdvancedNode('processor', 'Processor', {
        inputs: [{ name: 'data', type: 'string' }],
        outputs: [{ name: 'result', type: 'string' }]
      });
      const output = factory.createAdvancedNode('output', 'Output', {
        inputs: [{ name: 'result', type: 'string' }]
      });
      
      subGraph.addNode(input);
      subGraph.addNode(processor);
      subGraph.addNode(output);
      subGraph.addPortConnection('input', 'data', 'processor', 'data');
      subGraph.addPortConnection('processor', 'result', 'output', 'result');
      
      // 创建复合节点
      const compositeNode = factory.createCompositeNode('composite', 'Composite Processing', {
        subGraph,
        exposedInputs: [
          { internalNode: 'input', internalPort: 'data', externalName: 'input' }
        ],
        exposedOutputs: [
          { internalNode: 'output', internalPort: 'result', externalName: 'output' }
        ]
      });
      
      assertExists(compositeNode);
      assertEquals(compositeNode.type, NodeType.COMPOSITE);
      assertEquals(compositeNode.getInputPorts().length, 1);
      assertEquals(compositeNode.getOutputPorts().length, 1);
      assertEquals(compositeNode.getSubGraph(), subGraph);
    });

    it('应该支持复合节点的递归执行', async () => {
      const nodeFlow = createNodeFlow();
      const factory = nodeFlow.createNodeFactory();
      const graph = nodeFlow.createGraph();
      
      // 创建简单的复合节点
      const subGraph = nodeFlow.createGraph();
      
      const processor = factory.createAdvancedNode('processor', 'Internal Processor', {
        inputs: [{ name: 'data', type: 'string' }],
        outputs: [{ name: 'result', type: 'string' }],
        process: (inputs: any) => ({ result: `Processed: ${inputs.data}` })
      });
      
      subGraph.addNode(processor);
      
      const compositeNode = factory.createCompositeNode('composite', 'Composite', {
        subGraph,
        exposedInputs: [
          { internalNode: 'processor', internalPort: 'data', externalName: 'input' }
        ],
        exposedOutputs: [
          { internalNode: 'processor', internalPort: 'result', externalName: 'output' }
        ]
      });
      
      const inputNode = factory.createAdvancedNode('input', 'Input', {
        outputs: [{ name: 'data', type: 'string' }],
        process: () => ({ data: 'test data' })
      });
      
      const outputNode = factory.createAdvancedNode('output', 'Output', {
        inputs: [{ name: 'result', type: 'string' }]
      });
      
      graph.addNode(inputNode);
      graph.addNode(compositeNode);
      graph.addNode(outputNode);
      
      graph.addPortConnection('input', 'data', 'composite', 'input');
      graph.addPortConnection('composite', 'output', 'output', 'result');
      
      // 执行包含复合节点的工作流
      const result = await nodeFlow.executeWorkflow(graph);
      
      assertEquals(result.success, true);
      assertEquals(result.totalNodes, 3); // input + composite + output
    });
  });

  describe('节点组同构性', () => {
    it('应该能将节点组打包为复合节点', () => {
      const nodeFlow = createNodeFlow();
      const graph = nodeFlow.createGraph();
      const factory = nodeFlow.createNodeFactory();
      
      // 创建一组相关节点
      const nodes = [
        factory.createAdvancedNode('filter', 'Filter', {
          inputs: [{ name: 'data', type: 'array' }],
          outputs: [{ name: 'filtered', type: 'array' }]
        }),
        factory.createAdvancedNode('transform', 'Transform', {
          inputs: [{ name: 'data', type: 'array' }],
          outputs: [{ name: 'transformed', type: 'array' }]
        }),
        factory.createAdvancedNode('aggregate', 'Aggregate', {
          inputs: [{ name: 'data', type: 'array' }],
          outputs: [{ name: 'result', type: 'object' }]
        })
      ];
      
      nodes.forEach(node => graph.addNode(node));
      graph.addPortConnection('filter', 'filtered', 'transform', 'data');
      graph.addPortConnection('transform', 'transformed', 'aggregate', 'data');
      
      // 将节点组打包为复合节点
      const nodeGroup = ['filter', 'transform', 'aggregate'];
      const compositeNode = graph.packNodesAsComposite(nodeGroup, 'data-pipeline', {
        exposedInputs: [
          { internalNode: 'filter', internalPort: 'data', externalName: 'input' }
        ],
        exposedOutputs: [
          { internalNode: 'aggregate', internalPort: 'result', externalName: 'output' }
        ]
      });
      
      assertExists(compositeNode);
      assertEquals(compositeNode.type, NodeType.COMPOSITE);
      
      // 原始节点应该被移除，复合节点被添加
      assertEquals(graph.getAllNodes().length, 1);
      assertEquals(graph.getNode('data-pipeline'), compositeNode);
    });
  });
}); 