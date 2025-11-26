#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载 markmap 文件脚本
"""
import os
import sys
import urllib.request
from pathlib import Path

MARKMAP_DIR = Path(__file__).parent
MARKMAP_LIB_URL = "https://unpkg.com/markmap-lib@0.18.12/dist/browser/index.iife.js"
MARKMAP_VIEW_URL = "https://unpkg.com/markmap-view@0.18.12/dist/browser/index.js"
D3_JS_URL = "https://unpkg.com/d3@7/dist/d3.min.js"

def download_file(url: str, output_path: Path) -> bool:
    """下载文件"""
    try:
        print(f"正在下载: {url}")
        urllib.request.urlretrieve(url, output_path)
        print(f"✓ 下载成功: {output_path}")
        return True
    except Exception as e:
        print(f"✗ 下载失败: {e}")
        return False

def main():
    """主函数"""
    print(f"正在下载 markmap 文件到: {MARKMAP_DIR}")
    print()
    
    # 下载 markmap-lib.js
    lib_path = MARKMAP_DIR / "markmap-lib.js"
    if not download_file(MARKMAP_LIB_URL, lib_path):
        sys.exit(1)
    
    print()
    
    # 下载 markmap-view.js
    view_path = MARKMAP_DIR / "markmap-view.js"
    if not download_file(MARKMAP_VIEW_URL, view_path):
        sys.exit(1)
    
    print()
    
    # 下载 d3.js (markmap-view 的依赖)
    d3_path = MARKMAP_DIR / "d3.min.js"
    if not download_file(D3_JS_URL, d3_path):
        sys.exit(1)
    
    print()
    print("所有文件下载完成！")
    print("文件位置：")
    for file in [lib_path, view_path, d3_path]:
        if file.exists():
            size = file.stat().st_size
            print(f"  - {file.name} ({size:,} 字节)")

if __name__ == "__main__":
    main()

