grammar AnimaWeaveDSL;

// ========== 顶层规则 ==========
program         : (declaration | statement)* EOF ;

declaration     : semanticTypeDecl
                | nodeDecl  
                | graphDecl
                ;

statement       : assignment
                | comment
                ;

// ========== 语义类型声明 ==========
semanticTypeDecl : IDENTIFIER '{' compatibleTypeList? '}' ;
compatibleTypeList : IDENTIFIER (',' IDENTIFIER)* ;

// ========== 节点声明 ==========  
nodeDecl        : IDENTIFIER IDENTIFIER '{' 
                    ('in' '{' portList? '}')? 
                    ('out' '{' portList? '}')? 
                  '}' ;

portList        : port (',' port)* ;
port            : IDENTIFIER semanticType ;
semanticType    : IDENTIFIER ;

// ========== 图声明 ==========
graphDecl       : 'graph' IDENTIFIER? '{' 
                    ('nodes' '{' nodeInstances? '}')? 
                    ('data' '{' dataConnections? '}')? 
                    ('control' '{' controlConnections? '}')? 
                  '}' ;

// 节点实例
nodeInstances   : nodeInstance (',' nodeInstance)* ;
nodeInstance    : IDENTIFIER IDENTIFIER ;  // type name

// 数据连接  
dataConnections : dataConnection (';' dataConnection)* ;
dataConnection  : portRef '->' portRef ;

// 控制连接
controlConnections : controlConnection (';' controlConnection)* ;
controlConnection  : portRef '=>' portRef ;

// 端口引用
portRef         : IDENTIFIER ('.' IDENTIFIER)? ;

// ========== 赋值和基本语句 ==========
assignment      : IDENTIFIER '=' expression ';' ;
expression      : literal
                | IDENTIFIER
                | functionCall
                ;

functionCall    : IDENTIFIER '(' argumentList? ')' ;
argumentList    : expression (',' expression)* ;

literal         : INTEGER 
                | FLOAT
                | STRING
                | BOOLEAN
                | 'null'
                ;

// ========== 注释 ==========
comment         : LINE_COMMENT | BLOCK_COMMENT ;

// ========== 词法规则 ==========
IDENTIFIER      : [a-zA-Z_][a-zA-Z0-9_]* ;
INTEGER         : [0-9]+ ;
FLOAT           : [0-9]+ '.' [0-9]+ ;
STRING          : '"' (~["\r\n] | '\\' .)* '"' ;
BOOLEAN         : 'true' | 'false' ;

LINE_COMMENT    : '//' ~[\r\n]* -> skip ;
BLOCK_COMMENT   : '/*' .*? '*/' -> skip ;
WS              : [ \t\r\n]+ -> skip ;

// ========== 运算符和分隔符 ==========
ARROW           : '->' ;
CONTROL_ARROW   : '=>' ;
ASSIGN          : '=' ;
COMMA           : ',' ;
SEMICOLON       : ';' ;
LBRACE          : '{' ;
RBRACE          : '}' ;
LPAREN          : '(' ;
RPAREN          : ')' ;
DOT             : '.' ; 