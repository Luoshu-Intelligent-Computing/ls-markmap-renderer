# Markmap 文件说明

## 文件位置

将以下三个文件下载到 `tools/markmap/` 目录：

- `d3.min.js` (d3.js 库，markmap-view 的依赖)
- `markmap-lib.js`
- `markmap-view.js`

## 下载方式

### 方式1：从 CDN 下载（推荐）

```bash
# 创建目录
mkdir -p tools/markmap

# 下载 markmap-lib.js
curl -o tools/markmap/markmap-lib.js https://unpkg.com/markmap-lib@0.18.12/dist/browser/index.iife.js

# 下载 markmap-view.js
curl -o tools/markmap/markmap-view.js https://unpkg.com/markmap-view@0.18.12/dist/browser/index.js

# 下载 d3.js (markmap-view 的依赖)
curl -o tools/markmap/d3.min.js https://unpkg.com/d3@7/dist/d3.min.js
```

### 方式2：使用下载脚本（推荐）

```bash
# 使用 Python 脚本
python tools/markmap/download_markmap.py

# 或使用 Shell 脚本
bash tools/markmap/download_markmap.sh
```

### 方式3：从源码构建

如果你有 `ref/markmap-master` 源码，可以构建：

```bash
cd ref/markmap-master
pnpm install
pnpm build

# 复制构建产物
cp packages/markmap-lib/dist/browser/index.iife.js ../tools/markmap/markmap-lib.js
cp packages/markmap-view/dist/browser/index.js ../tools/markmap/markmap-view.js
```

**注意**：构建需要 Node.js >= 22 和 pnpm。

## 说明

- 如果本地文件不存在，代码会自动使用 CDN 加载（需要网络连接）
- 使用本地文件可以完全离线工作，无需网络连接
- 推荐使用本地文件以获得更好的性能和稳定性

