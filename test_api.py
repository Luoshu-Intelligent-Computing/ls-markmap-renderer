import requests
import sys
import time

# 配置
API_URL = "http://localhost:3000/api/render"
HEALTH_URL = "http://localhost:3000/api/health"

def check_server():
    """检查服务器是否运行"""
    try:
        response = requests.get(HEALTH_URL, timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✓ 服务器运行正常 (版本: {health_data.get('version', 'unknown')})")
            return True
        else:
            print(f"✗ 服务器响应异常: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ 无法连接到服务器")
        print("  请确保服务器正在运行:")
        print("  - 本地运行: npm start")
        print("  - Docker: docker-compose up -d")
        return False
    except Exception as e:
        print(f"✗ 检查服务器时出错: {e}")
        return False

def test_render():
    """测试渲染功能"""
    data = {
        "markdown": "# 测试标题\n## 分支1\n- 内容1\n- 内容2\n## 分支2\n- 内容3",
        "width": 1920,
        "height": 1080,
        "format": "png"
    }
    
    print(f"\n正在发送渲染请求到 {API_URL}...")
    print(f"Markdown 内容: {data['markdown'][:50]}...")
    print(f"图片尺寸: {data['width']}x{data['height']}")
    
    start_time = time.time()
    
    try:
        # 设置较长的超时时间（Puppeteer 渲染需要时间）
        response = requests.post(API_URL, json=data, timeout=180)
        
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            output_file = "mindmap.png"
            with open(output_file, "wb") as f:
                f.write(response.content)
            file_size = len(response.content)
            print(f"\n✓ 渲染成功！")
            print(f"  - 耗时: {elapsed_time:.2f} 秒")
            print(f"  - 文件: {output_file}")
            print(f"  - 大小: {file_size:,} 字节 ({file_size/1024:.2f} KB)")
            return True
        else:
            print(f"\n✗ 渲染失败 (状态码: {response.status_code})")
            try:
                error_data = response.json()
                print(f"  错误信息: {error_data}")
            except:
                print(f"  响应内容: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"\n✗ 请求超时（超过180秒）")
        print("  可能原因:")
        print("  - 服务器资源不足")
        print("  - Markdown 内容过大")
        print("  - 网络连接问题")
        return False
    except requests.exceptions.ConnectionError:
        print(f"\n✗ 连接错误：无法连接到服务器")
        print("  请检查:")
        print("  - 服务器是否正在运行")
        print("  - 端口是否正确（默认 3000）")
        return False
    except Exception as e:
        print(f"\n✗ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Markmap 渲染服务测试")
    print("=" * 60)
    
    # 检查服务器
    if not check_server():
        sys.exit(1)
    
    # 测试渲染
    if test_render():
        print("\n" + "=" * 60)
        print("测试完成！")
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("测试失败！")
        sys.exit(1)