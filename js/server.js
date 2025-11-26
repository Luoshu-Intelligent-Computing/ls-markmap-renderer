/**
 * Markmap 渲染服务 - Express 服务器
 * 使用本地 js 文件提供渲染 API
 */
const express = require('express');
const { renderMarkmap } = require('./renderer');

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'markmap-renderer',
        version: '2.0.0',
        timestamp: new Date().toISOString()
    });
});

// 渲染端点
app.post('/api/render', async (req, res) => {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are supported'
        });
    }

    try {
        console.log('收到渲染请求');
        const { markdown, width = 2400, height = 1800, format = 'png' } = req.body;

        // 验证参数
        if (!markdown || !markdown.trim()) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'markdown is required'
            });
        }

        console.log(`开始渲染: ${width}x${height}, 格式: ${format}`);

        if (width && (isNaN(width) || width < 100 || width > 10000)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'width must be a number between 100 and 10000'
            });
        }

        if (height && (isNaN(height) || height < 100 || height > 10000)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'height must be a number between 100 and 10000'
            });
        }

        if (format && !['png', 'jpeg'].includes(format)) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'format must be "png" or "jpeg"'
            });
        }

        // 使用渲染函数，直接返回图片 Buffer
        console.log('调用 renderMarkmap...');
        const image = await renderMarkmap(markdown, null, { 
            width: parseInt(width), 
            height: parseInt(height),
            format: format
        });

        console.log(`渲染完成，图片大小: ${image.length} 字节`);

        // 返回图片
        res.setHeader('Content-Type', `image/${format}`);
        res.setHeader('Content-Length', image.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 缓存1小时
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
app.listen(PORT, () => {
    console.log(`✓ Markmap 渲染服务已启动`);
    console.log(`  访问地址: http://localhost:${PORT}`);
    console.log(`  健康检查: http://localhost:${PORT}/api/health`);
    console.log(`  渲染 API: http://localhost:${PORT}/api/render`);
});

