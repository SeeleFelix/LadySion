package SeeleFelix.AnimaWeave.framework.vessel;

import java.util.List;

/**
 * Vessel类型检查结果
 * 用于封装vessel中节点或标签类型的可用性检查结果
 */
public record ValidationResult(
    boolean isAvailable,
    String requestedType,
    String errorMessage
) {
    public static ValidationResult available(String type) {
        return new ValidationResult(true, type, "");
    }
    
    public static ValidationResult unavailable(String type, String reason) {
        return new ValidationResult(false, type, reason);
    }
} 