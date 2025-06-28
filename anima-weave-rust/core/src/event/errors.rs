/// 标签转换错误
#[derive(Debug, Clone)]
pub enum LabelConversionError {
    /// 不支持的转换类型
    UnsupportedConversion { from: String, to: String },
    /// 转换过程中的数据错误
    ConversionFailed {
        from: String,
        to: String,
        reason: String,
    },
}
