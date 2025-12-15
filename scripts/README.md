# Scripts 工具脚本

本目录包含项目开发和部署相关的工具脚本。

## 📋 脚本列表

### 1. `docker_build_and_push.sh`

Docker 镜像构建和推送脚本，用于将项目构建为 Docker 镜像并推送到阿里云 Container Registry。

#### 功能特性

- ✅ 自动检测 Docker 登录状态
- ✅ 支持 BuildKit 构建（性能优化）
- ✅ 支持版本标签管理
- ✅ 支持交互式和非交互式密码输入
- ✅ 自动保存登录凭证

#### 使用方法

```bash
# 基本用法（使用 latest 版本，交互式输入密码）
./scripts/docker_build_and_push.sh

# 指定版本号
./scripts/docker_build_and_push.sh v2.0.0

# 指定版本号和密码（非交互式）
./scripts/docker_build_and_push.sh v2.0.0 mypassword

# 使用环境变量传递密码
DOCKER_PASSWORD=mypassword ./scripts/docker_build_and_push.sh v2.0.0
```

#### 参数说明

- `VERSION`（可选）：镜像版本标签，默认为 `latest`
- `PASSWORD`（可选）：Docker 登录密码，可通过命令行参数或环境变量 `DOCKER_PASSWORD` 提供

#### 配置说明

脚本中的配置变量（可根据需要修改）：

```bash
REGISTRY="registry.cn-hangzhou.aliyuncs.com"  # 镜像仓库地址
USERNAME="ychy7001"                           # 用户名
IMAGE_NAME="ls-markmap-renderer"              # 镜像名称
```

#### 注意事项

- 首次运行需要输入 Docker 登录密码
- 登录凭证会自动保存到 `~/.docker/config.json`
- 后续运行会自动检测并使用保存的凭证
- 如果凭证过期，脚本会自动提示重新登录

#### 输出示例

```
==========================================
Docker 镜像构建和推送
==========================================
镜像名称: ls-markmap-renderer
版本: v2.0.0
完整地址: registry.cn-hangzhou.aliyuncs.com/ychy7001/ls-markmap-renderer:v2.0.0

1. 构建 Docker 镜像（使用 BuildKit）...
✅ 镜像构建成功

2. 标记镜像...
✅ 镜像标记成功

3. 检查 Docker 登录状态...
✅ 已登录（使用保存的凭证）

4. 推送镜像到 registry.cn-hangzhou.aliyuncs.com...
✅ 镜像推送成功
```

---

### 2. `download_markmap.sh`

下载 Markmap 相关 JS 文件脚本，用于下载运行所需的依赖库文件。

#### 功能特性

- ✅ 自动下载 markmap-lib.js、markmap-view.js 和 d3.min.js
- ✅ 下载到 `js/` 目录（运行时使用）
- ✅ 显示下载进度和文件大小

#### 使用方法

```bash
# 运行下载脚本
./scripts/download_markmap.sh
```

#### 下载的文件

脚本会将以下文件下载到 `js/` 目录：

- `d3.min.js` - D3.js 库（markmap-view 的依赖）
- `markmap-lib.js` - Markmap 核心库
- `markmap-view.js` - Markmap 视图库

#### 版本信息

当前下载的版本：
- markmap-lib: `0.18.12`
- markmap-view: `0.18.12`
- d3: `7.x`

#### 注意事项

- 需要网络连接（从 unpkg.com CDN 下载）
- 如果文件已存在，会被覆盖
- 下载的文件是运行时必需的，确保下载成功后再运行服务

#### 输出示例

```
正在下载 markmap 文件到: /path/to/js

下载 markmap-lib.js...
✓ markmap-lib.js 下载成功

下载 markmap-view.js...
✓ markmap-view.js 下载成功

下载 d3.min.js...
✓ d3.min.js 下载成功

所有文件下载完成！
文件位置：
-rw-r--r-- 1 user user 662K d3.min.js
-rw-r--r-- 1 user user 274K markmap-lib.js
-rw-r--r-- 1 user user  49K markmap-view.js
```

---

## 📝 使用场景

### 开发环境设置

```bash
# 1. 下载 Markmap 依赖文件
./scripts/download_markmap.sh

# 2. 安装 Node.js 依赖
npm install

# 3. 启动开发服务器
npm start
```

### 生产环境部署

```bash
# 1. 构建并推送 Docker 镜像
./scripts/docker_build_and_push.sh v2.0.0

# 2. 在服务器上拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/ychy7001/ls-markmap-renderer:v2.0.0

# 3. 运行容器
docker run -d -p 3000:3000 \
  --name markmap-renderer \
  registry.cn-hangzhou.aliyuncs.com/ychy7001/ls-markmap-renderer:v2.0.0
```

## 🐛 故障排除

**Docker 登录失败**
```bash
docker login --username=ychy7001 registry.cn-hangzhou.aliyuncs.com
```

**下载失败**
- 检查网络连接
- 检查 `js/` 目录权限
- 确保 curl 命令可用

**权限问题**
```bash
chmod +x scripts/*.sh
```

