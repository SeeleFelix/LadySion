// AnimaWeave Weave File Grammar for PEG.js
// 基于最佳实践：简单、宽容的空白符处理

start
  = weaveFile

weaveFile
  = __ import_section:importSection? __ graph_section:graphSection? __
    { return { import: import_section, graph: graph_section }; }

// ===== Import Section =====
importSection
  = "--" __ "import" __ 
    imports:importList
    sectionEnd
    { return { type: 'import', imports }; }

importList
  = statements:importStatement*
    { return statements; }

importStatement
  = __ name:qualifiedName __
    { return { name }; }

// ===== Graph Section =====
graphSection
  = "--" __ "graph" __
    body:graphBody
    sectionEnd?
    { return { type: 'graph', ...body }; }

sectionEnd
  = "--" __

graphBody
  = __
    nodes:nodesSection? __
    datas:dataSection? __
    controls:controlSection? __
    { return { nodes: nodes?.nodes || [], datas: datas?.connections || [], controls: controls?.connections || [] }; }

// ===== Nodes Section =====
nodesSection
  = "nodes" __ "{" __
    instances:nodeInstances
    "}" __
    { return { nodes: instances }; }

nodeInstances
  = instances:nodeInstance*
    { return instances; }

nodeInstance
  = __ id:identifier __ type:qualifiedName __
    { return { id, type }; }

// ===== Data Section =====
dataSection
  = "datas" __ "{" __
    connections:dataConnections
    "}" __
    { return { connections }; }

dataConnections
  = connections:dataConnection*
    { return connections; }

dataConnection
  = __ from:portReference __ "->" __ to:portReference __ ";" __
    { return { from, to, type: 'data' }; }

// ===== Control Section =====
controlSection
  = "controls" __ "{" __
    connections:controlConnections
    "}" __
    { return { connections }; }

controlConnections
  = connections:controlConnection*
    { return connections; }

controlConnection
  = __ from:portReference __ "->" __ to:portReference __ ";" __
    { return { from, to, type: 'control' }; }

// ===== Basic Elements =====
portReference
  = node:identifier "." port:identifier
    { return { node, port }; }

qualifiedName
  = first:identifier rest:("." identifier)*
    { return first + rest.map(r => r[0] + r[1]).join(''); }

identifier
  = [a-zA-Z_][a-zA-Z0-9_]*
    { return text(); }

// ===== Whitespace and Comments =====
// 统一的空白符处理：包含空格、制表符、换行符和注释
__
  = ([ \t\r\n] / comment)*

comment
  = "//" [^\r\n]* 