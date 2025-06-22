package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;

/**
 * 字符串语义标签 - Basic Vessel定义
 * 继承SemanticLabel抽象类，天然不可变，承载String值
 * 标签名称自动从类名推导为"String"
 */
public class StringLabel extends SemanticLabel<String> {
}