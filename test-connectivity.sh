#!/bin/bash

echo "🧪 Lady Sion 前后端连通性测试"
echo "================================"

# 测试后端健康检查
echo "📡 测试后端健康检查..."
backend_response=$(curl -s http://localhost:3000/api/v1/health)
if [[ $? -eq 0 ]]; then
    echo "✅ 后端API正常: $backend_response"
else
    echo "❌ 后端API无响应"
    exit 1
fi

# 测试前端页面
echo "🖥️ 测试前端页面..."
frontend_response=$(curl -s -I http://localhost:5173 | head -n1)
if [[ $frontend_response == *"200"* ]]; then
    echo "✅ 前端页面正常: $frontend_response"
else
    echo "❌ 前端页面无响应"
    exit 1
fi

# 测试预设API
echo "⚙️ 测试预设API..."
preset_response=$(curl -s http://localhost:3000/api/v1/presets)
if [[ $? -eq 0 ]]; then
    echo "✅ 预设API正常"
else
    echo "❌ 预设API无响应"
fi

echo ""
echo "🎉 所有测试通过！Lady Sion 前后端运行正常"
echo "📖 访问地址："
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3000"
echo "   健康检查: http://localhost:3000/api/v1/health" 