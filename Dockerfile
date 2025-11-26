# 使用 Node.js 18 作为基础镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 配置 Debian 使用阿里云镜像源（加速 apt-get）
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    echo "deb https://mirrors.aliyun.com/debian/ bookworm main" > /etc/apt/sources.list && \
    echo "deb https://mirrors.aliyun.com/debian/ bookworm-updates main" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.aliyun.com/debian-security/ bookworm-security main" >> /etc/apt/sources.list

# 配置 npm 使用淘宝镜像源（加速 npm install）
RUN npm config set registry https://registry.npmmirror.com

# 设置 Puppeteer 环境变量，跳过 Chromium 下载（使用系统 Chromium）
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 安装 Puppeteer 所需的系统依赖和 Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装 Node.js 依赖（使用淘宝镜像源，跳过 Puppeteer 的 Chromium 下载）
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci --only=production --registry=https://registry.npmmirror.com

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动服务器
CMD ["npm", "start"]

