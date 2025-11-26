# Markmap 渲染服务

将 Markdown 思维导图渲染为 PNG/JPEG 图片的服务，支持命令行和 HTTP API 两种使用方式。

## 功能特性

- ✅ 命令行工具：本地渲染 Markdown 为图片
- ✅ RESTful API：HTTP 接口服务，支持远程调用
- ✅ 支持 PNG/JPEG 格式输出
- ✅ 支持自定义尺寸和样式
- ✅ 完美支持中文字体渲染
- ✅ Docker 容器化部署
- ✅ 使用本地 JS 文件，无需 CDN

## 安装

```bash
npm install
```

## 使用方法

### 方式一：HTTP API 服务

#### 本地运行

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

访问：`http://localhost:3000/api/render`

#### API 端点

```
POST /api/render
GET /api/health
```

#### 请求格式

```json
{
  "markdown": "# 标题\n## 子标题\n- 内容1\n- 内容2",
  "width": 2400,
  "height": 1800,
  "format": "png"
}
```

**参数说明：**
- `markdown` (必需): Markdown 格式的思维导图内容
- `width` (可选): 图片宽度，默认 2400
- `height` (可选): 图片高度，默认 1800
- `format` (可选): 图片格式，`png` 或 `jpeg`，默认 `png`

#### 响应

**成功（200）**:
- Content-Type: `image/png` 或 `image/jpeg`
- Body: 图片二进制数据

**错误（400/500）**:
```json
{
  "error": "错误类型",
  "message": "错误描述"
}
```

#### 使用示例

**cURL:**
```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "# 测试标题\n## 分支1\n- 内容1",
    "width": 2400,
    "height": 1800
  }' \
  --output mindmap.png
```

**Python:**
```python
import requests

url = "http://localhost:3000/api/render"
data = {
    "markdown": "# 测试标题\n## 分支1\n- 内容1",
    "width": 2400,
    "height": 1800
}

response = requests.post(url, json=data)
if response.status_code == 200:
    with open("mindmap.png", "wb") as f:
        f.write(response.content)
    print("图片已保存")
else:
    print(f"错误: {response.json()}")
```

**JavaScript/Node.js:**
```javascript
const fetch = require('node-fetch');
const fs = require('fs');

async function renderMarkmap() {
    const response = await fetch('http://localhost:3000/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            markdown: '# 测试标题\n## 分支1\n- 内容1',
            width: 2400,
            height: 1800
        })
    });

    if (response.ok) {
        const buffer = await response.buffer();
        fs.writeFileSync('mindmap.png', buffer);
        console.log('图片已保存');
    } else {
        const error = await response.json();
        console.error('错误:', error);
    }
}

renderMarkmap();
```

#### 健康检查

```
GET /api/health
```

返回服务状态信息。

## Docker 部署

### 构建镜像

```bash
docker build -t markmap-renderer .
```

### 运行容器

#### 方式一：使用 docker run

```bash
docker run -d \
  --name markmap-renderer \
  -p 3000:3000 \
  markmap-renderer
```

#### 方式二：使用 docker-compose（推荐）

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 测试容器

容器启动后，可以通过以下方式测试：

```bash
# 健康检查
curl http://localhost:3000/api/health

# 使用测试脚本（需要修改端口或使用容器 IP）
python test_api.py
```

### 环境变量

- `NODE_ENV`: 运行环境（默认: production）
- `PORT`: 服务端口（默认: 3000）

### Docker 注意事项

1. 首次启动可能需要一些时间来初始化
2. 容器需要足够的内存来运行 Puppeteer（建议至少 1GB）
3. 渲染大图片时可能需要较长时间