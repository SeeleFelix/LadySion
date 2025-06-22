package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.Converter;
import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;

/**
 * 时间戳语义标签 - Basic Vessel定义
 * 继承SemanticLabel抽象类，天然不可变，承载Instant值
 * 标签名称自动从类名推导为"Timestamp"
 */
public class TimestampLabel extends SemanticLabel<Instant> {

    /** 转换到StringLabel：格式化为ISO时间字符串 */
    @Converter(to = StringLabel.class)
    private StringLabel convertToString() {
        Instant value = this.getValue();
        if (value == null) {
            return SemanticLabel.withValue(StringLabel.class, null);
        }
        
        try {
            return SemanticLabel.withValue(StringLabel.class, 
                DateTimeFormatter.ISO_INSTANT.format(value));
        } catch (Exception e) {
            return SemanticLabel.withValue(StringLabel.class, value.toString());
        }
    }

    /** 转换到NumberLabel：时间戳毫秒数作为数字 */
    @Converter(to = NumberLabel.class)
    private NumberLabel convertToNumber() {
        Instant value = this.getValue();
        if (value == null) {
            return SemanticLabel.withValue(NumberLabel.class, null);
        }
        return SemanticLabel.withValue(NumberLabel.class, 
            BigDecimal.valueOf(value.toEpochMilli()));
    }
} 