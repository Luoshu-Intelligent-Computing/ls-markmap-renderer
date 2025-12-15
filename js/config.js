/**
 * 应用配置常量
 */
const packageJson = require('../package.json');

module.exports = {
    SERVICE_NAME: 'markmap-renderer',
    
    // 服务器配置
    DEFAULT_PORT: 3000,
    REQUEST_BODY_LIMIT: '10mb',
    
    // 渲染配置
    DEFAULT_WIDTH: 2400,
    DEFAULT_HEIGHT: 1800,
    DEFAULT_FORMAT: 'png',
    MIN_WIDTH: 100,
    MAX_WIDTH: 10000,
    MIN_HEIGHT: 100,
    MAX_HEIGHT: 10000,
    SUPPORTED_FORMATS: ['png', 'jpeg'],
    
    // Markdown 内容限制
    MAX_MARKDOWN_LENGTH: 10 * 1024 * 1024, // 10MB
    
    // 渲染超时配置
    RENDER_TIMEOUT: 120000, // 120秒
    RENDER_CHECK_TIMEOUT: 30000, // 30秒
    
    // Puppeteer 配置
    PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
    PUPPETEER_ARGS: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--font-render-hinting=none'
    ],
    
    // 缓存配置
    CACHE_MAX_AGE: 3600, // 1小时
    
    // 颜色方案
    COLOR_PALETTE: [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
        '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
        '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
    ]
};

