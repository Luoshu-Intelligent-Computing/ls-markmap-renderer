#!/bin/bash
# 下载 markmap 文件脚本

MARKMAP_DIR="$(dirname "$0")"
cd "$MARKMAP_DIR" || exit 1

echo "正在下载 markmap 文件到: $MARKMAP_DIR"

# 下载 markmap-lib.js
echo "下载 markmap-lib.js..."
curl -L -o markmap-lib.js "https://unpkg.com/markmap-lib@0.18.12/dist/browser/index.iife.js"

if [ $? -eq 0 ]; then
    echo "✓ markmap-lib.js 下载成功"
else
    echo "✗ markmap-lib.js 下载失败"
    exit 1
fi

# 下载 markmap-view.js
echo "下载 markmap-view.js..."
curl -L -o markmap-view.js "https://unpkg.com/markmap-view@0.18.12/dist/browser/index.js"

if [ $? -eq 0 ]; then
    echo "✓ markmap-view.js 下载成功"
else
    echo "✗ markmap-view.js 下载失败"
    exit 1
fi

# 下载 d3.js (markmap-view 的依赖)
echo "下载 d3.min.js..."
curl -L -o d3.min.js "https://unpkg.com/d3@7/dist/d3.min.js"

if [ $? -eq 0 ]; then
    echo "✓ d3.min.js 下载成功"
else
    echo "✗ d3.min.js 下载失败"
    exit 1
fi

echo ""
echo "所有文件下载完成！"
echo "文件位置："
ls -lh d3.min.js markmap-*.js

