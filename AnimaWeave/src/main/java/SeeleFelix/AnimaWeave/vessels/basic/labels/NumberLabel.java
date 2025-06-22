package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.Converter;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.math.BigDecimal;

/**
 * 数字语义标签 - Basic Vessel定义
 * 继承SemanticLabel抽象类，天然不可变，承载BigDecimal值
 * 标签名称自动从类名推导为"Number"
 */
public class NumberLabel extends SemanticLabel<BigDecimal> {

    /** 转换到StringLabel */
    @Converter(to = StringLabel.class)
    private StringLabel convertToString() {
        BigDecimal value = this.getValue();
        if (value == null) {
            return SemanticLabel.withValue(StringLabel.class, null);
        }
        return SemanticLabel.withValue(StringLabel.class, value.toString());
    }

    /** 转换到BoolLabel：0 -> false, 非0 -> true */
    @Converter(to = BoolLabel.class)
    private BoolLabel convertToBool() {
        BigDecimal value = this.getValue();
        if (value == null) {
            return SemanticLabel.withValue(BoolLabel.class, null);
        }
        return SemanticLabel.withValue(BoolLabel.class, value.compareTo(BigDecimal.ZERO) != 0);
    }
} 