import peggy from "peggy";
import { WeaveGraph, WeaveNode, WeaveConnection } from "../framework/core.ts";

export class WeaveParser {
  private parser: any;

  constructor() {
    // 延迟初始化parser
    this.parser = null;
  }

  private async initParser() {
    if (!this.parser) {
      const grammarPath = new URL('./weave_grammar.pegjs', import.meta.url);
      const grammarContent = await Deno.readTextFile(grammarPath);
      this.parser = peggy.generate(grammarContent);
    }
    return this.parser;
  }
  
  /**
   * 解析weave文件内容
   */
  async parseWeave(content: string): Promise<WeaveGraph> {
    console.log("🔍 使用PEG解析器解析weave文件...");
    
    try {
      // 初始化parser
      const parser = await this.initParser();
      
      // 使用peggy解析器解析
      const parseResult = parser.parse(content);
      console.log("📊 解析结果:", JSON.stringify(parseResult, null, 2));
      
      // 转换为WeaveGraph格式
      const weaveGraph = this.buildWeaveGraph(parseResult);
      
      console.log("✅ weave文件解析成功");
      return weaveGraph;
      
    } catch (error) {
      console.error("❌ weave文件解析失败:", error);
      throw new Error(`Failed to parse weave file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 将解析结果转换为WeaveGraph
   */
  private buildWeaveGraph(parseResult: any): WeaveGraph {
    const graph: WeaveGraph = {
      metadata: {
        name: "parsed_graph",
        entry_points: []
      },
      nodes: {},
      connections: [],
      imports: []
    };

    // 处理import section
    if (parseResult.import) {
      this.processImportSection(parseResult.import, graph);
    }

    // 处理graph section
    if (parseResult.graph) {
      this.processGraphSection(parseResult.graph, graph);
    }

    return graph;
  }

  private processImportSection(section: any, graph: WeaveGraph) {
    for (const importItem of section.imports) {
      // 只保存插件名，如 "basic.anima" -> "basic"
      const pluginName = importItem.name.replace('.anima', '');
      graph.imports.push(pluginName);
    }
  }

  private processGraphSection(section: any, graph: WeaveGraph) {
    // 处理nodes
    if (section.nodes) {
      this.processNodesData(section.nodes, graph);
    }

    // 处理data connections
    if (section.datas) {
      this.processConnectionsData(section.datas, graph);
    }

    // 处理control connections
    if (section.controls) {
      this.processConnectionsData(section.controls, graph);
    }
  }

  private processNodesData(nodes: any[], graph: WeaveGraph) {
    for (const node of nodes) {
      // 解析 "basic.Start" 格式：basic是plugin，Start是type
      const [plugin, type] = node.type.split('.');
      
      graph.nodes[node.id] = {
        id: node.id,
        type: type,
        plugin: plugin
      };
    }
  }

  private processConnectionsData(connections: any[], graph: WeaveGraph) {
    for (const connection of connections) {
      graph.connections.push({
        from: {
          node: connection.from.node,
          output: connection.from.port
        },
        to: {
          node: connection.to.node,
          input: connection.to.port
        }
      });
    }
  }
} 