# Markmap 渲染服务

将 Markdown 思维导图渲染为 PNG/JPEG 图片的 HTTP API 服务。

## 📚 文档导航

- [工具脚本说明](./scripts/README.md) - Docker 构建、推送和依赖下载脚本
- [测试说明](./tests/README.md) - API 测试指南

## 功能特性

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

## 快速开始

### 本地运行

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
  -d '{"markdown": "# 测试标题\n## 分支1\n- 内容1"}' \
  --output mindmap.png
```

**Python:**
```python
import requests

response = requests.post('http://localhost:3000/api/render', json={
    'markdown': '# 测试标题\n## 分支1\n- 内容1',
    'width': 2400,
    'height': 1800
})

if response.status_code == 200:
    with open('mindmap.png', 'wb') as f:
        f.write(response.content)
```

#### 健康检查

```
GET /api/health
```

返回服务状态信息。

## Docker 部署

### 构建镜像

```bash
# 使用脚本构建并推送（推荐）
./scripts/docker_build_and_push.sh

# 或手动构建
docker build -t markmap-renderer .
```

### 运行容器

```bash
# 拉取并运行
docker run -d \
  --name markmap-renderer \
  -p 3000:3000 \
  registry.cn-hangzhou.aliyuncs.com/ychy7001/markmap-renderer:latest

# 测试
curl http://localhost:3000/api/health
```

> 📖 更多 Docker 相关说明，请查看 [scripts/README.md](./scripts/README.md)

## 🧪 测试

### 快速测试

```bash
# 1. 启动服务器
npm start &

# 2. 等待启动（约 3 秒）
sleep 3

# 3. 运行 API 测试
python tests/test_api.py

# 4. 停止服务器
pkill -f "node js/server.js"
```

### 健康检查

```bash
curl http://localhost:3000/api/health
```

> 📖 更多测试说明，请查看 [tests/README.md](./tests/README.md)

### 环境变量

- `NODE_ENV`: 运行环境（默认: production）
- `PORT`: 服务端口（默认: 3000）

### Docker 注意事项

1. 首次启动可能需要一些时间来初始化
2. 容器需要足够的内存来运行 Puppeteer（建议至少 1GB）
3. 渲染大图片时可能需要较长时间