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

// ==================== MCP 端点 ====================

// MCP 工具发现端点
app.get('/mcp/discover', (req, res) => {
    res.json({
        name: 'markmap',
        version: '1.0.0',
        description: 'Markmap 渲染服务 - 将 Markdown 思维导图渲染为图片',
        tools: [
            {
                name: 'render_markmap',
                description: '渲染 Markdown 思维导图为图片',
                parameters: [
                    {
                        name: 'markdown',
                        type: 'string',
                        description: 'Markdown 格式的思维导图内容',
                        required: true
                    },
                    {
                        name: 'width',
                        type: 'number',
                        description: '图片宽度（像素），默认 1920',
                        required: false,
                        default: 1920
                    },
                    {
                        name: 'height',
                        type: 'number',
                        description: '图片高度（像素），默认 1080',
                        required: false,
                        default: 1080
                    },
                    {
                        name: 'format',
                        type: 'string',
                        description: '图片格式，可选值：png, jpeg，默认 png',
                        required: false,
                        default: 'png'
                    }
                ]
            }
        ]
    });
});

// MCP 工具调用端点
app.post('/mcp/call', async (req, res) => {
    try {
        const { tool, arguments: args } = req.body;
        
        // 验证工具名称
        if (tool !== 'render_markmap') {
            return res.status(400).json({
                success: false,
                error: `未知的工具: ${tool}`,
                data: null
            });
        }
        
        // 参数验证
        if (!args || !args.markdown) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败: markdown 参数不能为空',
                data: null
            });
        }
        
        const width = args.width || 1920;
        const height = args.height || 1080;
        const format = args.format || 'png';
        
        // 验证参数值
        if (width <= 0 || height <= 0) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败: width 和 height 必须大于 0',
                data: null
            });
        }
        
        if (!['png', 'jpeg'].includes(format)) {
            return res.status(400).json({
                success: false,
                error: '参数验证失败: format 必须是 png 或 jpeg',
                data: null
            });
        }
        
        // 验证 markdown 长度
        if (args.markdown.length > config.MAX_MARKDOWN_LENGTH) {
            return res.status(400).json({
                success: false,
                error: `参数验证失败: markdown 内容超过最大长度 ${config.MAX_MARKDOWN_LENGTH} 字节`,
                data: null
            });
        }
        
        // 验证 width 和 height 范围
        const widthNum = parseInt(width);
        const heightNum = parseInt(height);
        if (isNaN(widthNum) || widthNum < config.MIN_WIDTH || widthNum > config.MAX_WIDTH) {
            return res.status(400).json({
                success: false,
                error: `参数验证失败: width 必须在 ${config.MIN_WIDTH} 和 ${config.MAX_WIDTH} 之间`,
                data: null
            });
        }
        if (isNaN(heightNum) || heightNum < config.MIN_HEIGHT || heightNum > config.MAX_HEIGHT) {
            return res.status(400).json({
                success: false,
                error: `参数验证失败: height 必须在 ${config.MIN_HEIGHT} 和 ${config.MAX_HEIGHT} 之间`,
                data: null
            });
        }
        
        console.log(`[MCP] 收到渲染请求: ${widthNum}x${heightNum}, 格式: ${format}`);
        
        // 调用渲染函数
        const imageBuffer = await renderMarkmap(args.markdown, null, { 
            width: widthNum, 
            height: heightNum,
            format: format
        });
        
        // 转换为 Base64
        const imageBase64 = imageBuffer.toString('base64');
        
        console.log(`[MCP] 渲染完成，图片大小: ${imageBuffer.length} 字节`);
        
        res.json({
            success: true,
            data: {
                image: imageBase64
            },
            metadata: {
                width: widthNum,
                height: heightNum,
                format: format,
                size_bytes: imageBuffer.length
            }
        });
    } catch (error) {
        console.error('[MCP] 渲染失败:', error);
        res.status(500).json({
            success: false,
            error: `渲染失败: ${error.message}`,
            data: null
        });
    }
});

// MCP 健康检查端点
app.get('/mcp/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ==================== 原有端点 ====================

// 启动服务器
const server = app.listen(PORT, () => {
    console.log(`✓ Markmap 渲染服务已启动`);
    console.log(`  访问地址: http://localhost:${PORT}`);
    console.log(`  健康检查: http://localhost:${PORT}/api/health`);
    console.log(`  渲染 API: http://localhost:${PORT}/api/render`);
    console.log(`  MCP 发现: http://localhost:${PORT}/mcp/discover`);
    console.log(`  MCP 调用: http://localhost:${PORT}/mcp/call`);
    console.log(`  MCP 健康: http://localhost:${PORT}/mcp/health`);
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

