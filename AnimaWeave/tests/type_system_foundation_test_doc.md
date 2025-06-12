# 类型系统基础哲学验证测试用例

## 哲学基础
**数学定义1**: `𝒯 = {Int, Bool, String, Array[T], Record{...}, ...}`

**验证的哲学理念**: "类型是计算的基础" - 类型系统不是语法装饰，而是计算语义的根本约束。

**验证方法**: 通过awakening接口执行weave图文件，验证Int、Bool、String类型在实际计算链中的基础作用。

## 测试场景设计

### T1: 类型系统基础计算链
**目标**: 验证基础类型(Int, Bool, String)真的能支撑有意义的业务计算

**测试文件**: `type_system_foundation.weave`

**计算链设计**:
```
Start → GetTimestamp(Int) → IsEven(Bool) + FormatNumber(String)
                    ↓              ↓              ↓
                  Signal       Bool结果        String结果  
```

**验证场景**:
1. **Int类型计算**: GetTimestamp节点产生Int类型时间戳，证明Int不只是语法符号
2. **Bool类型逻辑**: IsEven节点进行逻辑计算，证明Bool支撑真实判断
3. **String类型处理**: FormatNumber节点进行格式化，证明String支撑文本计算
4. **类型约束作用**: 所有连接必须类型匹配，证明类型系统真正约束计算

**执行接口**: `awakening("./tests/sanctums", "type_system_foundation")`

**预期验证结果**:
- FateEcho.status = Success
- FateEcho.outputs包含:
  - `checker.result`: Bool类型(true/false)
  - `formatter.formatted`: String类型("timestamp_XXXX")
- 所有TypedValue类型信息正确
- 类型约束在计算过程中起到了实际作用

**失败案例验证**:
如果类型系统只是语法装饰，这个计算链应该无法正确执行。

## 所需basic插件扩展

### 新增类型实现:
- [ ] Int - 整数类型及其计算语义
- [ ] Bool - 布尔类型及其逻辑语义  
- [ ] String - 字符串类型及其文本处理语义

### 新增节点实现:
- [ ] GetTimestamp - 生成Int类型时间戳
- [ ] IsEven - Int→Bool逻辑计算
- [ ] FormatNumber - Int→String格式化计算

## 进度状态
- 📝 测试场景设计: 完成
- 📝 weave图文件: 完成
- 📝 测试文档: 完成
- 🔨 测试代码实现: 待实现
- 🔨 插件类型实现: 待实现
- 🔨 插件节点实现: 待实现 