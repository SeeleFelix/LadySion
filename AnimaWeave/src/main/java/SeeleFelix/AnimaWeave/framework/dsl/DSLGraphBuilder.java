package SeeleFelix.AnimaWeave.framework.dsl;

import SeeleFelix.AnimaWeave.parser.AnimaWeaveDSLBaseVisitor;
import SeeleFelix.AnimaWeave.parser.AnimaWeaveDSLParser;
import SeeleFelix.AnimaWeave.framework.graph.GraphDefinition;
import SeeleFelix.AnimaWeave.framework.graph.NodeDefinition;
import SeeleFelix.AnimaWeave.framework.graph.Connection;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * DSL图构建器
 * 使用ANTLR Visitor模式来构建图定义，基于Pest语法转换的ANTLR4语法
 */
@Slf4j
public class DSLGraphBuilder extends AnimaWeaveDSLBaseVisitor<GraphDefinition> {
    
    private String graphName = "unknown";
    private final List<String> imports = new ArrayList<>();
    private final Map<String, NodeDefinition> nodeDefinitions = new HashMap<>();
    private final Map<String, String> nodeInstances = new HashMap<>(); // 实例名 -> 节点类型
    private final List<Connection> dataConnections = new ArrayList<>();
    private final List<Connection> controlConnections = new ArrayList<>();
    
    @Override
    public GraphDefinition visitProgram(AnimaWeaveDSLParser.ProgramContext ctx) {
        log.debug("开始构建图定义");
        
        // 访问文件内容
        if (ctx.fileContent() != null) {
            visit(ctx.fileContent());
        }
        
        // 构建最终的图定义
        return GraphDefinition.builder()
                .name(graphName)
                .imports(new ArrayList<>(imports))
                .nodeDefinitions(new HashMap<>(nodeDefinitions))
                .nodeInstances(new HashMap<>(nodeInstances))
                .dataConnections(new ArrayList<>(dataConnections))
                .controlConnections(new ArrayList<>(controlConnections))
                .build();
    }
    
    @Override
    public GraphDefinition visitFileContent(AnimaWeaveDSLParser.FileContentContext ctx) {
        if (ctx.graphFile() != null) {
            visit(ctx.graphFile());
        } else if (ctx.definitionFile() != null) {
            visit(ctx.definitionFile());
        }
        return null;
    }
    
    @Override
    public GraphDefinition visitDefinitionFile(AnimaWeaveDSLParser.DefinitionFileContext ctx) {
        // 处理节点定义文件
        for (var child : ctx.children) {
            if (child instanceof AnimaWeaveDSLParser.NodesSectionContext) {
                visit(child);
            } else if (child instanceof AnimaWeaveDSLParser.ImportSectionContext) {
                visit(child);
            } else if (child instanceof AnimaWeaveDSLParser.SemanticLabelsSectionContext) {
                visit(child);
            }
        }
        return null;
    }
    
    @Override
    public GraphDefinition visitGraphFile(AnimaWeaveDSLParser.GraphFileContext ctx) {
        // 处理导入部分
        if (ctx.importSection() != null) {
            visit(ctx.importSection());
        }
        
        // 处理图部分
        if (ctx.graphSection() != null) {
            visit(ctx.graphSection());
        }
        
        return null;
    }
    
    @Override
    public GraphDefinition visitNodesSection(AnimaWeaveDSLParser.NodesSectionContext ctx) {
        log.debug("处理节点定义段");
        
        // 访问所有节点定义
        for (var nodeDefinition : ctx.nodeDefinition()) {
            visitNodeDefinition(nodeDefinition);
        }
        
        return null;
    }
    
    @Override
    public GraphDefinition visitNodeDefinition(AnimaWeaveDSLParser.NodeDefinitionContext ctx) {
        String nodeType = ctx.IDENTIFIER().getText();
        log.debug("定义节点类型: {}", nodeType);
        
        // 解析模式声明
        String mode = "Sequential"; // 默认模式
        if (ctx.modeDeclaration() != null) {
            mode = ctx.modeDeclaration().concurrentMode().getText();
        }
        
        // 解析输入输出端口
        Map<String, String> inputPorts = new HashMap<>();
        Map<String, String> outputPorts = new HashMap<>();
        
        if (ctx.portSections() != null) {
            parsePortSections(ctx.portSections(), inputPorts, outputPorts);
        }
        
        NodeDefinition nodeDefinition = NodeDefinition.builder()
                .name(nodeType)
                .mode(mode)
                .inputPorts(inputPorts)
                .outputPorts(outputPorts)
                .build();
                
        nodeDefinitions.put(nodeType, nodeDefinition);
        return null;
    }
    
    private void parsePortSections(AnimaWeaveDSLParser.PortSectionsContext ctx, 
                                 Map<String, String> inputPorts, 
                                 Map<String, String> outputPorts) {
        for (var child : ctx.children) {
            if (child instanceof AnimaWeaveDSLParser.InSectionContext) {
                parseInSection((AnimaWeaveDSLParser.InSectionContext) child, inputPorts);
            } else if (child instanceof AnimaWeaveDSLParser.OutSectionContext) {
                parseOutSection((AnimaWeaveDSLParser.OutSectionContext) child, outputPorts);
            }
        }
    }
    
    private void parseInSection(AnimaWeaveDSLParser.InSectionContext ctx, Map<String, String> inputPorts) {
        if (ctx.portList() != null) {
            for (var portDef : ctx.portList().portDefinition()) {
                String portName = portDef.IDENTIFIER().getText();
                String portType = portDef.qualifiedName().getText();
                inputPorts.put(portName, portType);
                log.debug("添加输入端口: {} -> {}", portName, portType);
            }
        }
    }
    
    private void parseOutSection(AnimaWeaveDSLParser.OutSectionContext ctx, Map<String, String> outputPorts) {
        if (ctx.portList() != null) {
            for (var portDef : ctx.portList().portDefinition()) {
                String portName = portDef.IDENTIFIER().getText();
                String portType = portDef.qualifiedName().getText();
                outputPorts.put(portName, portType);
                log.debug("添加输出端口: {} -> {}", portName, portType);
            }
        }
    }
    
    @Override
    public GraphDefinition visitGraphSection(AnimaWeaveDSLParser.GraphSectionContext ctx) {
        log.debug("处理图定义段");
        
        // 检查是否有图名称
        if (ctx.IDENTIFIER() != null) {
            graphName = ctx.IDENTIFIER().getText();
            log.debug("设置图名称: {}", graphName);
        }
        
        if (ctx.graphBody() != null) {
            visit(ctx.graphBody());
        }
        
        return null;
    }
    
    @Override
    public GraphDefinition visitGraphBody(AnimaWeaveDSLParser.GraphBodyContext ctx) {
        // 处理节点实例
        if (ctx.nodesInstanceSection() != null) {
            visit(ctx.nodesInstanceSection());
        }
        
        // 处理数据连接
        if (ctx.dataConnectionSection() != null) {
            visit(ctx.dataConnectionSection());
        }
        
        // 处理控制连接
        if (ctx.controlConnectionSection() != null) {
            visit(ctx.controlConnectionSection());
        }
        
        return null;
    }
    
    @Override
    public GraphDefinition visitNodesInstanceSection(AnimaWeaveDSLParser.NodesInstanceSectionContext ctx) {
        if (ctx.nodeInstances() != null) {
            visit(ctx.nodeInstances());
        }
        return null;
    }
    
    @Override
    public GraphDefinition visitNodeInstances(AnimaWeaveDSLParser.NodeInstancesContext ctx) {
        // 访问所有节点实例
        for (var nodeInstance : ctx.nodeInstance()) {
            visitNodeInstance(nodeInstance);
        }
        return null;
    }
    
    @Override
    public GraphDefinition visitNodeInstance(AnimaWeaveDSLParser.NodeInstanceContext ctx) {
        String instanceName = ctx.IDENTIFIER().getText();
        String nodeType = ctx.qualifiedName().getText();
        
        log.debug("创建节点实例: {} : {}", instanceName, nodeType);
        nodeInstances.put(instanceName, nodeType);
        return null;
    }
    
    @Override
    public GraphDefinition visitDataConnectionSection(AnimaWeaveDSLParser.DataConnectionSectionContext ctx) {
        // 访问所有数据连接
        for (var dataConnection : ctx.dataConnection()) {
            visitDataConnection(dataConnection);
        }
        return null;
    }
    
    @Override
    public GraphDefinition visitDataConnection(AnimaWeaveDSLParser.DataConnectionContext ctx) {
        String sourceNode = ctx.connectionSource().portReference().nodeIdentifier().getText();
        String sourcePort = ctx.connectionSource().portReference().portIdentifier().getText();
        String targetNode = ctx.connectionTarget().portReference().nodeIdentifier().getText();
        String targetPort = ctx.connectionTarget().portReference().portIdentifier().getText();
        
        Connection connection = Connection.builder()
                .sourceNodeName(sourceNode)
                .sourcePortName(sourcePort)
                .targetNodeName(targetNode)
                .targetPortName(targetPort)
                .build();
                
        dataConnections.add(connection);
        log.debug("添加数据连接: {}.{} -> {}.{}", sourceNode, sourcePort, targetNode, targetPort);
        return null;
    }
    
    @Override
    public GraphDefinition visitControlConnectionSection(AnimaWeaveDSLParser.ControlConnectionSectionContext ctx) {
        // 访问所有控制连接
        for (var controlConnection : ctx.controlConnection()) {
            visitControlConnection(controlConnection);
        }
        return null;
    }
    
    @Override
    public GraphDefinition visitControlConnection(AnimaWeaveDSLParser.ControlConnectionContext ctx) {
        String sourceNode = ctx.connectionSource().portReference().nodeIdentifier().getText();
        String sourcePort = ctx.connectionSource().portReference().portIdentifier().getText();
        String targetNode = ctx.connectionTarget().portReference().nodeIdentifier().getText();
        String targetPort = ctx.connectionTarget().portReference().portIdentifier().getText();
        
        Connection connection = Connection.builder()
                .sourceNodeName(sourceNode)
                .sourcePortName(sourcePort)
                .targetNodeName(targetNode)
                .targetPortName(targetPort)
                .build();
                
        controlConnections.add(connection);
        log.debug("添加控制连接: {}.{} -> {}.{}", sourceNode, sourcePort, targetNode, targetPort);
        return null;
    }
} 