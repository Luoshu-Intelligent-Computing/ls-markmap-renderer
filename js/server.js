/**
 * Markmap 渲染服务 - Express 服务器
 * 使用本地 js 文件提供渲染 API
 */
const express = require('express');
const { renderMarkmap } = require('./renderer');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || config.DEFAULT_PORT;

// 解析 JSON 请求体
app.use(express.json({ limit: config.REQUEST_BODY_LIMIT }));

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: config.SERVICE_NAME,
        timestamp: new Date().toISOString()
    });
});

// 渲染端点
app.post('/api/render', async (req, res) => {
    try {
        console.log('收到渲染请求');
        const { 
            markdown, 
            width = config.DEFAULT_WIDTH, 
            height = config.DEFAULT_HEIGHT, 
            format = config.DEFAULT_FORMAT 
        } = req.body;

        // 验证 markdown 参数
        if (!markdown || typeof markdown !== 'string' || !markdown.trim()) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'markdown is required and must be a non-empty string'
            });
        }

        // 验证 markdown 长度
        if (markdown.length > config.MAX_MARKDOWN_LENGTH) {
            return res.status(400).json({
                error: 'Bad request',
                message: `markdown content exceeds maximum length of ${config.MAX_MARKDOWN_LENGTH} bytes`
            });
        }

        // 验证 width 参数
        const widthNum = parseInt(width);
        if (isNaN(widthNum) || widthNum < config.MIN_WIDTH || widthNum > config.MAX_WIDTH) {
            return res.status(400).json({
                error: 'Bad request',
                message: `width must be a number between ${config.MIN_WIDTH} and ${config.MAX_WIDTH}`
            });
        }

        // 验证 height 参数
        const heightNum = parseInt(height);
        if (isNaN(heightNum) || heightNum < config.MIN_HEIGHT || heightNum > config.MAX_HEIGHT) {
            return res.status(400).json({
                error: 'Bad request',
                message: `height must be a number between ${config.MIN_HEIGHT} and ${config.MAX_HEIGHT}`
            });
        }

        // 验证 format 参数
        if (!config.SUPPORTED_FORMATS.includes(format)) {
            return res.status(400).json({
                error: 'Bad request',
                message: `format must be one of: ${config.SUPPORTED_FORMATS.join(', ')}`
            });
        }

        console.log(`开始渲染: ${widthNum}x${heightNum}, 格式: ${format}`);

        // 使用渲染函数，直接返回图片 Buffer
        console.log('调用 renderMarkmap...');
        const image = await renderMarkmap(markdown, null, { 
            width: widthNum, 
            height: heightNum,
            format: format
        });

        console.log(`渲染完成，图片大小: ${image.length} 字节`);

        // 返回图片
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('Content-Length', image.length);
        res.setHeader('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}`);
        return res.status(200).send(image);

    } catch (error) {
        console.error('渲染错误:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message || 'Failed to render mindmap'
        });
    }
});

// 启动服务器
const server = app.listen(PORT, () => {
    console.log(`✓ Markmap 渲染服务已启动`);
    console.log(`  访问地址: http://localhost:${PORT}`);
    console.log(`  健康检查: http://localhost:${PORT}/api/health`);
    console.log(`  渲染 API: http://localhost:${PORT}/api/render`);
});

// 处理端口占用错误
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\n✗ 错误: 端口 ${PORT} 已被占用`);
        console.error(`\n解决方案:`);
        console.error(`  1. 停止占用端口的进程:`);
        console.error(`     sudo lsof -ti :${PORT} | xargs kill -9`);
        console.error(`  2. 或使用其他端口:`);
        console.error(`     PORT=3001 npm start`);
        console.error(`\n当前占用端口的进程信息:`);
        console.error(`  运行以下命令查看: sudo lsof -i :${PORT}\n`);
        process.exit(1);
    } else {
        console.error('服务器启动错误:', error);
        process.exit(1);
    }
});

