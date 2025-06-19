grammar AnimaWeaveDSL;

@header {
package SeeleFelix.AnimaWeave.parser;
}

// ========== 顶层结构 ==========
program         : fileContent EOF ;

fileContent     : graphFile | definitionFile ;

definitionFile  : (importSection | semanticLabelsSection | nodesSection)+ ;
graphFile       : importSection? graphSection ;

// ========== Import Section ==========
importSection   : SECTION_HEADER_IMPORT importList? SECTION_END ;
importList      : importStatement* ;
importStatement : qualifiedName aliasMap? ;
aliasMap        : '{' aliasMapping* '}' ;
aliasMapping    : IDENTIFIER IDENTIFIER ;

// ========== Semantic Labels Section ==========
semanticLabelsSection : SECTION_HEADER_SEMANTIC_LABELS semanticLabelDefinition* SECTION_END ;
semanticLabelDefinition : semanticLabelName ('{' convertibleSemanticLabels '}')? ;
semanticLabelName : qualifiedName ;
convertibleSemanticLabels : qualifiedName* ;

// ========== Nodes Section ==========
nodesSection    : SECTION_HEADER_NODES nodeDefinition* SECTION_END ;
nodeDefinition  : IDENTIFIER '{' modeDeclaration? portSections '}' ;

modeDeclaration : 'mode' concurrentMode ;
concurrentMode  : 'Concurrent' | 'Sequential' ;

portSections    : (inSection | outSection)+ ;
inSection       : 'in' '{' portList? '}' ;
outSection      : 'out' '{' portList? '}' ;

portList        : portDefinition* ;
portDefinition  : IDENTIFIER qualifiedName portModifiers? ;
portModifiers   : 'optional' | activationMode ;
activationMode  : 'mode=' ('AND' | 'OR' | 'XOR') ;

// ========== Graph Section ==========
graphSection    : SECTION_HEADER_GRAPH IDENTIFIER? graphBody SECTION_END ;
graphBody       : nodesInstanceSection? dataConnectionSection? controlConnectionSection? ;

// Nodes Instance Section
nodesInstanceSection : 'nodes' '{' nodeInstances '}' ;
nodeInstances   : nodeInstance* ;
nodeInstance    : IDENTIFIER qualifiedName instanceOverride? ;
instanceOverride : '{' overrideDeclaration* '}' ;
overrideDeclaration : (modeOverride | portOverride) ;
modeOverride    : 'mode' concurrentMode ;
portOverride    : IDENTIFIER activationMode ;

// Data Connection Section  
dataConnectionSection : 'datas' '{' dataConnection* '}' ;
dataConnection  : connectionSource '->' connectionTarget ';' ;

// Control Connection Section
controlConnectionSection : 'controls' '{' controlConnection* '}' ;
controlConnection : connectionSource '->' connectionTarget ';' ;

// Connection Components
connectionSource : portReference ;
connectionTarget : portReference ;
portReference   : nodeIdentifier '.' portIdentifier ;

// ========== 基础类型 ==========
qualifiedName   : IDENTIFIER ('.' IDENTIFIER)* ;
nodeIdentifier  : IDENTIFIER ;
portIdentifier  : IDENTIFIER ;

// ========== 词法规则 ==========
SECTION_HEADER_IMPORT : '--' WS* 'import' ;
SECTION_HEADER_SEMANTIC_LABELS : '--' WS* 'semantic_labels' ;
SECTION_HEADER_NODES : '--' WS* 'nodes' ;
SECTION_HEADER_GRAPH : '--' WS* 'graph' ;
SECTION_END     : '--' ;

IDENTIFIER      : [a-zA-Z_][a-zA-Z0-9_]* ;
NUMBER          : '-'? [0-9]+ ('.' [0-9]+)? ;
STRING_LITERAL  : '"' (~["])* '"' ;

LINE_COMMENT    : '//' ~[\r\n]* -> skip ;
BLOCK_COMMENT   : '/*' .*? '*/' -> skip ;
WS              : [ \t\r\n]+ -> skip ;

// ========== 符号 ==========
ARROW           : '->' ;
DOT             : '.' ;
LBRACE          : '{' ;
RBRACE          : '}' ;
SEMICOLON       : ';' ;
EQUALS          : '=' ; 