#!/bin/bash

# Markmap 渲染器测试脚本
# 测试 markmap_renderer.js 的各种功能

echo "=========================================="
echo "Markmap 渲染器测试"
echo "=========================================="
echo ""

# 设置测试目录
TEST_DIR="test_output"
mkdir -p "$TEST_DIR"

# 测试1: 基本功能测试（使用默认尺寸）
echo "测试1: 基本功能测试（默认尺寸 2400x1800）"
echo "----------------------------------------"
node markmap_renderer.js test_input.md "$TEST_DIR/test1_default.png"
if [ $? -eq 0 ]; then
    echo "✓ 测试1通过: 输出文件 $TEST_DIR/test1_default.png"
else
    echo "✗ 测试1失败"
fi
echo ""

# 测试2: 自定义尺寸测试
echo "测试2: 自定义尺寸测试（1920x1080）"
echo "----------------------------------------"
node markmap_renderer.js test_input.md "$TEST_DIR/test2_custom.png" 1920 1080
if [ $? -eq 0 ]; then
    echo "✓ 测试2通过: 输出文件 $TEST_DIR/test2_custom.png"
else
    echo "✗ 测试2失败"
fi
echo ""

# 测试3: 大尺寸测试
echo "测试3: 大尺寸测试（3200x2400）"
echo "----------------------------------------"
node markmap_renderer.js test_input.md "$TEST_DIR/test3_large.png" 3200 2400
if [ $? -eq 0 ]; then
    echo "✓ 测试3通过: 输出文件 $TEST_DIR/test3_large.png"
else
    echo "✗ 测试3失败"
fi
echo ""

# 测试4: 标准输入测试
echo "测试4: 标准输入测试"
echo "----------------------------------------"
echo "# 标准输入测试

## 节点1
- 子节点1.1
- 子节点1.2

## 节点2
- 子节点2.1
- 子节点2.2" | node markmap_renderer.js - "$TEST_DIR/test4_stdin.png" 1600 1200
if [ $? -eq 0 ]; then
    echo "✓ 测试4通过: 输出文件 $TEST_DIR/test4_stdin.png"
else
    echo "✗ 测试4失败"
fi
echo ""

# 测试5: 错误处理测试（不存在的文件）
echo "测试5: 错误处理测试（不存在的文件）"
echo "----------------------------------------"
node markmap_renderer.js nonexistent.md "$TEST_DIR/test5_error.png" 2>&1
if [ $? -ne 0 ]; then
    echo "✓ 测试5通过: 正确检测到文件不存在错误"
else
    echo "✗ 测试5失败: 应该返回错误但没有"
fi
echo ""

# 测试6: 参数不足测试
echo "测试6: 参数不足测试"
echo "----------------------------------------"
node markmap_renderer.js 2>&1
if [ $? -ne 0 ]; then
    echo "✓ 测试6通过: 正确检测到参数不足错误"
else
    echo "✗ 测试6失败: 应该返回错误但没有"
fi
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo ""
echo "生成的测试文件位于: $TEST_DIR/"
ls -lh "$TEST_DIR"/*.png 2>/dev/null || echo "没有生成PNG文件"

