package SeeleFelix.AnimaWeave.vessels.basic.labels;

import SeeleFelix.AnimaWeave.framework.vessel.SemanticLabel;
import java.util.UUID;
import SeeleFelix.AnimaWeave.framework.vessel.Converter;

/**
 * UUID语义标签 - Basic Vessel定义
 * 继承SemanticLabel抽象类，天然不可变，承载UUID值
 * 标签名称自动从类名推导为"UUID"
 */
public class UUIDLabel extends SemanticLabel<UUID> {

    /** 转换到StringLabel */
    @Converter(to = StringLabel.class)
    private StringLabel convertToString() {
        UUID value = this.getValue();
        if (value == null) {
            return SemanticLabel.withValue(StringLabel.class, null);
        }
        return SemanticLabel.withValue(StringLabel.class, value.toString());
    }

    public static UUIDLabel random() {
        return SemanticLabel.withValue(UUIDLabel.class, UUID.randomUUID());
    }
}
