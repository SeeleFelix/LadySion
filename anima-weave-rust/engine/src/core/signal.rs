use crate::semantic_label;

semantic_label! {
    /// Signal语义标签 - 控制流的核心
    ///
    /// 根据数学定义2：𝒞 = {Signal}
    /// Signal是控制信号语义标签集合中的唯一元素
    ///
    /// Signal的特点：
    /// - 只传递激活/非激活信息，不携带具体数据
    /// - 用于控制节点的执行时机和条件
    /// - 支持激活模式：AND, OR, XOR
    ///
    /// # 字段
    ///
    /// * `active` - 信号是否处于激活状态
    ///
    /// # 示例
    ///
    /// ```rust
    /// use anima_weave_core::SignalLabel;
    ///
    /// let active_signal = SignalLabel::active();
    /// let inactive_signal = SignalLabel::inactive();
    ///
    /// assert!(active_signal.is_active());
    /// assert!(inactive_signal.is_inactive());
    /// ```
    SignalLabel(active: bool) {
        // Signal是控制流的核心类型，通常不需要转换到其他类型
        // 转换功能留给vessels层的具体实现
    }
}

impl SignalLabel {
    /// 创建激活信号
    pub fn active() -> Self {
        SignalLabel { active: true }
    }

    /// 创建非激活信号
    pub fn inactive() -> Self {
        SignalLabel { active: false }
    }

    /// 检查是否为激活状态
    pub fn is_active(&self) -> bool {
        self.active
    }

    /// 检查是否为非激活状态
    pub fn is_inactive(&self) -> bool {
        !self.active
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::label::SemanticLabel;

    #[test]
    fn test_signal_creation() {
        let active_signal = SignalLabel::active();
        let inactive_signal = SignalLabel::inactive();

        assert!(active_signal.is_active());
        assert!(!active_signal.is_inactive());

        assert!(inactive_signal.is_inactive());
        assert!(!inactive_signal.is_active());
    }

    #[test]
    fn test_signal_type_name() {
        let signal = SignalLabel::active();
        assert_eq!(signal.get_semantic_label_type(), "SignalLabel");
    }
}
