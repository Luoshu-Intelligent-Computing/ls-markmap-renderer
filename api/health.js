/**
 * Vercel Serverless Function: 健康检查 API
 * GET /api/health
 * 
 * 返回服务状态信息
 */
module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET requests are supported'
        });
    }

    try {
        // 检查核心依赖是否可用
        const { renderMarkmap } = require('../markmap_renderer');
        
        return res.status(200).json({
            status: 'ok',
            service: 'markmap-renderer',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            endpoints: {
                render: '/api/render',
                health: '/api/health'
            },
            features: {
                formats: ['png', 'jpeg'],
                maxWidth: 10000,
                maxHeight: 10000,
                defaultWidth: 2400,
                defaultHeight: 1800
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Service unavailable'
        });
    }
};

