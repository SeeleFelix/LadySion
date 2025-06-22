package SeeleFelix.AnimaWeave.framework.vessel;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;

/**
 * 语义标签抽象基类 - 天然带值的不可变设计
 *
 * <p>每个Label实例直接承载具体的数据值，天然不可变 使用@Converter注解自动发现转换方法，外部只需要问：能转吗？转给我！ 标签名称直接从类名获取，无需额外存储
 *
 * @param <T> 标签承载的值类型
 */
@Slf4j
public abstract class SemanticLabel<T> {

  private final T value;

  // 🚀 性能优化：缓存所有反射操作结果
  private static final Map<Class<?>, Map<Class<? extends SemanticLabel<?>>, Method>>
      CONVERTER_CACHE = new ConcurrentHashMap<>();
      
  // 缓存构造函数，避免重复查找
  private static final Map<Class<?>, Constructor<?>> CONSTRUCTOR_CACHE = new ConcurrentHashMap<>();
  
  // 缓存value字段，所有SemanticLabel子类共享同一个字段
  private static volatile Field VALUE_FIELD;
  
  // 缓存标签名称，避免重复字符串处理
  private static final Map<Class<?>, String> LABEL_NAME_CACHE = new ConcurrentHashMap<>();

  /** 默认构造函数 - 用于反射创建实例 */
  protected SemanticLabel() {
    this.value = null;
  }

  /** 构造函数 - 创建带值的标签实例 */
  protected SemanticLabel(T value) {
    this.value = value; // 允许null值，如Signal标签
  }

  /** 获取标签名称 - 从类名推导，带缓存优化 */
  public final String getLabelName() {
    Class<?> clazz = getClass();
    
    // 🚀 优化：检查缓存
    String cachedName = LABEL_NAME_CACHE.get(clazz);
    if (cachedName != null) {
      return cachedName;
    }
    
    // 计算标签名称
    String className = clazz.getSimpleName();
    String labelName;
    if (className.endsWith("Label")) {
      labelName = className.substring(0, className.length() - 5);
    } else if (className.endsWith("SemanticLabel")) {
      labelName = className.substring(0, className.length() - 14);
    } else {
      labelName = className;
    }
    
    // 🚀 优化：缓存结果
    LABEL_NAME_CACHE.put(clazz, labelName);
    return labelName;
  }

  /** 获取标签承载的值 */
  public final T getValue() {
    return value;
  }

  /** 创建相同类型但不同值的新标签实例 - 使用反射通用实现 */
  @SuppressWarnings("unchecked")
  public final SemanticLabel<T> withValue(T newValue) {
    return (SemanticLabel<T>) withValue(getClass(), newValue);
  }

  /** 🚀 优化版本：通用的static工厂方法 - 缓存反射操作 */
  @SuppressWarnings("unchecked")
  public static <L extends SemanticLabel<V>, V> L withValue(Class<L> labelClass, V value) {
    try {
      // 🚀 优化：缓存构造函数查找
      Constructor<L> constructor = (Constructor<L>) CONSTRUCTOR_CACHE.computeIfAbsent(
          labelClass, 
          clazz -> {
            try {
              Constructor<?> ctor = clazz.getDeclaredConstructor();
              ctor.setAccessible(true);
              return ctor;
            } catch (Exception e) {
              throw new RuntimeException("无法获取构造函数: " + clazz.getSimpleName(), e);
            }
          });
      
      L instance = constructor.newInstance();
      
      // 🚀 优化：缓存value字段查找（双重检查锁定）
      Field valueField = VALUE_FIELD;
      if (valueField == null) {
        synchronized (SemanticLabel.class) {
          valueField = VALUE_FIELD;
          if (valueField == null) {
            valueField = SemanticLabel.class.getDeclaredField("value");
            valueField.setAccessible(true);
            VALUE_FIELD = valueField;
          }
        }
      }
      
      valueField.set(instance, value);
      return instance;
      
    } catch (Exception e) {
      throw new RuntimeException("无法创建实例: " + labelClass.getSimpleName() + 
                               " with value: " + value, e);
    }
  }

  /** 🚀 优化版本：通用的static空值工厂方法 */
  @SuppressWarnings("unchecked")
  public static <L extends SemanticLabel<?>> L empty(Class<L> labelClass) {
    try {
      // 🚀 优化：复用缓存的构造函数
      Constructor<L> constructor = (Constructor<L>) CONSTRUCTOR_CACHE.computeIfAbsent(
          labelClass, 
          clazz -> {
            try {
              Constructor<?> ctor = clazz.getDeclaredConstructor();
              ctor.setAccessible(true);
              return ctor;
            } catch (Exception e) {
              throw new RuntimeException("无法获取构造函数: " + clazz.getSimpleName(), e);
            }
          });
      
      return constructor.newInstance();
    } catch (Exception e) {
      throw new RuntimeException("无法创建空实例: " + labelClass.getSimpleName(), e);
    }
  }

  /** 检查是否有实际值（非null） */
  public final boolean hasValue() {
    return value != null;
  }

  /** 检查是否为空值 */
  public final boolean isEmpty() {
    return value == null;
  }

  /**
   * 检查是否能转换到目标类型
   *
   * @param targetType 目标标签类型
   * @return 是否可以转换
   */
  public final boolean canConvertTo(Class<? extends SemanticLabel<?>> targetType) {
    // 相同类型直接可以
    if (this.getClass().equals(targetType)) {
      return true;
    }

    // 检查自己是否有转换到目标类型的方法
    return getConverterMethods().containsKey(targetType);
  }

  /**
   * 转换到目标类型
   *
   * @param targetType 目标标签类型
   * @return 转换后的标签实例
   */
  @SuppressWarnings("unchecked")
  public final <R> SemanticLabel<R> convertTo(Class<? extends SemanticLabel<R>> targetType) {
    // 相同类型直接返回
    if (this.getClass().equals(targetType)) {
      return (SemanticLabel<R>) this;
    }

    // 查找自己的转换方法
    Method converterMethod = getConverterMethods().get(targetType);
    if (converterMethod == null) {
      throw new IllegalArgumentException(
          "无法从 " + getClass().getSimpleName() + " 转换到 " + targetType.getSimpleName());
    }

    try {
      return (SemanticLabel<R>) converterMethod.invoke(this);
    } catch (Exception e) {
      throw new RuntimeException(
          "转换失败: " + getClass().getSimpleName() + " -> " + targetType.getSimpleName(), e);
    }
  }

  /** 🚀 优化版本：获取转换器方法映射 - 使用ConcurrentHashMap提升并发性能 */
  @SuppressWarnings("unchecked")
  private Map<Class<? extends SemanticLabel<?>>, Method> getConverterMethods() {
    Class<?> clazz = getClass();

    // 🚀 优化：使用computeIfAbsent，线程安全且简洁
    return (Map<Class<? extends SemanticLabel<?>>, Method>) 
        CONVERTER_CACHE.computeIfAbsent(clazz, this::scanConverterMethods);
  }
  
  /** 🚀 优化：提取转换器扫描逻辑，便于测试和维护 */
  private Map<Class<? extends SemanticLabel<?>>, Method> scanConverterMethods(Class<?> clazz) {
    Map<Class<? extends SemanticLabel<?>>, Method> converters = new HashMap<>();

    // 遍历所有方法，查找@Converter注解
    for (Method method : clazz.getDeclaredMethods()) {
      Converter annotation = method.getAnnotation(Converter.class);
      if (annotation != null) {
        // 验证方法签名：应该无参数（转换自己）
        Class<?>[] paramTypes = method.getParameterTypes();
        Class<?> returnType = method.getReturnType();

        if (paramTypes.length == 0
            && SemanticLabel.class.isAssignableFrom(returnType)
            && annotation.to().isAssignableFrom(returnType)) {
          converters.put(annotation.to(), method);
          method.setAccessible(true); // 允许访问私有方法
        } else {
          log.warn("@Converter方法 {} 签名不正确: 必须无参数且返回SemanticLabel子类", method.getName());
        }
      }
    }

    return converters;
  }

  /** 基于标签名称和值的相等性判断 */
  @Override
  public boolean equals(Object obj) {
    if (this == obj) return true;
    if (obj == null || getClass() != obj.getClass()) return false;
    SemanticLabel<?> that = (SemanticLabel<?>) obj;
    return Objects.equals(getLabelName(), that.getLabelName()) && Objects.equals(value, that.value);
  }

  /** 基于标签名称和值的哈希码 */
  @Override
  public int hashCode() {
    return Objects.hash(getLabelName(), value);
  }

  /** 默认的toString实现 */
  @Override
  public String toString() {
    return String.format(
        "%s[%s=%s]",
        getClass().getSimpleName(), getLabelName(), value != null ? value.toString() : "null");
  }
}
