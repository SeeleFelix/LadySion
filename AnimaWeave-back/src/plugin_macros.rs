// AnimaWeave 插件注册宏系统

use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use crate::plugin_manager::{AnimaPlugin, PluginRegistry};

// ===== 全局插件注册表 =====

static GLOBAL_REGISTRY: OnceLock<Mutex<PluginRegistry>> = OnceLock::new();

/// 获取全局插件注册表
pub fn get_global_registry() -> &'static Mutex<PluginRegistry> {
    GLOBAL_REGISTRY.get_or_init(|| Mutex::new(PluginRegistry::new()))
}

// ===== 插件注册函数类型 =====

pub type PluginRegistrar = fn(&mut PluginRegistry) -> Result<(), String>;

// ===== 静态插件注册表 =====

static mut STATIC_PLUGINS: Vec<PluginRegistrar> = Vec::new();

/// 注册静态插件
pub fn register_static_plugin(registrar: PluginRegistrar) {
    unsafe {
        STATIC_PLUGINS.push(registrar);
    }
}

/// 加载所有静态插件
pub fn load_static_plugins(registry: &mut PluginRegistry) -> Result<(), String> {
    unsafe {
        for registrar in &STATIC_PLUGINS {
            registrar(registry)?;
        }
    }
    Ok(())
}

// ===== 插件注册宏 =====

/// 插件注册宏 - 自动注册插件到全局注册表
/// 
/// 用法：
/// ```rust
/// register_plugin!(MyPlugin, "my_plugin");
/// ```
#[macro_export]
macro_rules! register_plugin {
    ($plugin_type:ty, $plugin_name:expr) => {
        // 生成插件注册函数
        pub fn __register_plugin(registry: &mut $crate::plugin_manager::PluginRegistry) -> Result<(), String> {
            let plugin: Box<dyn $crate::plugin_manager::AnimaPlugin> = Box::new(<$plugin_type>::new());
            registry.register_plugin(plugin)
        }
        
        // 使用静态初始化注册插件
        #[used]
        #[link_section = ".init_array"]
        static __PLUGIN_INIT: fn() = || {
            $crate::plugin_macros::register_static_plugin(__register_plugin);
        };
    };
}

// ===== 动态库插件支持 =====

#[cfg(feature = "dynamic-plugins")]
pub mod dynamic {
    use super::*;
    use libloading::{Library, Symbol};
    use std::path::Path;

    pub type CreatePluginFn = unsafe extern "C" fn() -> *mut dyn AnimaPlugin;
    pub type DestroyPluginFn = unsafe extern "C" fn(*mut dyn AnimaPlugin);

    pub struct DynamicPlugin {
        _lib: Library,
        plugin: Box<dyn AnimaPlugin>,
        _destroy_fn: Symbol<'static, DestroyPluginFn>,
    }

    impl Drop for DynamicPlugin {
        fn drop(&mut self) {
            // 注意：这里实际的析构需要更仔细的处理
            // 因为Rust的trait object和C FFI的复杂性
        }
    }

    /// 从动态库加载插件
    pub fn load_dynamic_plugin<P: AsRef<Path>>(path: P) -> Result<DynamicPlugin, String> {
        unsafe {
            let lib = Library::new(path.as_ref())
                .map_err(|e| format!("Failed to load library: {}", e))?;
            
            let create_fn: Symbol<CreatePluginFn> = lib.get(b"anima_plugin_create")
                .map_err(|e| format!("Failed to load create function: {}", e))?;
            
            let destroy_fn: Symbol<DestroyPluginFn> = lib.get(b"anima_plugin_destroy")
                .map_err(|e| format!("Failed to load destroy function: {}", e))?;
            
            let plugin_ptr = create_fn();
            if plugin_ptr.is_null() {
                return Err("Plugin creation failed".to_string());
            }
            
            let plugin = Box::from_raw(plugin_ptr);
            
            Ok(DynamicPlugin {
                _lib: lib,
                plugin,
                _destroy_fn: destroy_fn,
            })
        }
    }
}

// ===== 插件工厂支持 =====

/// 插件工厂 trait
pub trait PluginFactory {
    fn create_plugin(&self) -> Box<dyn AnimaPlugin>;
    fn plugin_name(&self) -> &str;
}

/// 插件工厂注册表
pub struct PluginFactoryRegistry {
    factories: HashMap<String, Box<dyn PluginFactory>>,
}

impl PluginFactoryRegistry {
    pub fn new() -> Self {
        Self {
            factories: HashMap::new(),
        }
    }
    
    pub fn register_factory(&mut self, factory: Box<dyn PluginFactory>) {
        let name = factory.plugin_name().to_string();
        self.factories.insert(name, factory);
    }
    
    pub fn create_plugin(&self, name: &str) -> Option<Box<dyn AnimaPlugin>> {
        self.factories.get(name).map(|factory| factory.create_plugin())
    }
    
    pub fn list_available_plugins(&self) -> Vec<String> {
        self.factories.keys().cloned().collect()
    }
} 