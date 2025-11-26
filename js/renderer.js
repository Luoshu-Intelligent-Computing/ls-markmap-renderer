/**
 * Markmap 图片渲染工具
 * 使用本地 js 文件和 markmap-lib + markmap-view 渲染思维导图为 PNG 图片
 */
const fs = require('fs');
const path = require('path');
const { Transformer } = require('markmap-lib');
const nodeHtmlToImage = require('node-html-to-image');

/**
 * 渲染 Markdown 为思维导图图片
 * @param {string} markdown - Markdown 内容
 * @param {string} outputPath - 输出图片路径（null 时返回 Buffer）
 * @param {object} options - 选项
 * @param {number} options.width - 图片宽度（默认 2400）
 * @param {number} options.height - 图片高度（默认 1800）
 * @param {string} options.format - 图片格式 'png' 或 'jpeg'（默认 'png'）
 * @param {object} options.jsonOptions - markmap JSON 选项
 */
async function renderMarkmap(markdown, outputPath, options = {}) {
    const {
        width = 2400,
        height = 1800,
        format = 'png',
        jsonOptions = {
            duration: 0,
            maxInitialScale: 5,
            color: (node) => {
                // 使用丰富的颜色方案
                const colorPalette = [
                    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
                    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
                    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
                    '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5'
                ];
                try {
                    if (node.state && node.state.path) {
                        const pathParts = node.state.path.split('.');
                        const branchId = pathParts.length > 1 ? pathParts[0] + '.' + pathParts[1] : pathParts[0];
                        const hash = branchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        return colorPalette[hash % colorPalette.length];
                    }
                    if (node.content) {
                        const hash = node.content.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        return colorPalette[hash % colorPalette.length];
                    }
                } catch (e) {
                    // 忽略错误
                }
                return colorPalette[(node.depth || 0) % colorPalette.length];
            },
            lineWidth: (node) => {
                const baseWidth = 2;
                const deltaWidth = 2;
                const k = 1.5;
                return baseWidth + deltaWidth / Math.pow(k, node.depth);
            },
            spacingHorizontal: 150,
            spacingVertical: 10,
            paddingX: 12,
            nodeMinHeight: 20,
            initialExpandLevel: 999,  // 展开所有层级，确保所有内容都显示
            autoFit: true,
            fitRatio: 0.95
        }
    } = options;

    try {
        // 获取本地 js 文件路径
        const jsDir = path.join(__dirname);
        const d3Path = path.join(jsDir, 'd3.min.js');
        const markmapLibPath = path.join(jsDir, 'markmap-lib.js');
        const markmapViewPath = path.join(jsDir, 'markmap-view.js');

        // 读取本地 js 文件内容
        const d3Content = fs.readFileSync(d3Path, 'utf-8');
        const markmapLibContent = fs.readFileSync(markmapLibPath, 'utf-8');
        const markmapViewContent = fs.readFileSync(markmapViewPath, 'utf-8');

        // 转换 Markdown 为思维导图数据
        const transformer = new Transformer();
        const { root, features } = transformer.transform(markdown);
        const assets = transformer.getUsedAssets(features);

        // 生成 HTML，使用本地文件
        // 将 JSON 选项序列化为字符串，以便在浏览器中使用
        const jsonOptionsStr = JSON.stringify(jsonOptions);
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');
        body,
        #mindmap {
            width: ${width}px;
            height: ${height}px;
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: 'Noto Sans SC', 'Microsoft YaHei', 'SimHei', 'SimSun', 'Arial', sans-serif;
        }
        /* 美化线条样式 */
        .markmap-link {
            fill: none;
            stroke-width: 2px;
            stroke-opacity: 0.8;
        }
        /* 美化节点样式 */
        .markmap-node > circle {
            stroke-width: 2px;
            stroke: #fff;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        .markmap-node > text {
            font-family: 'Noto Sans SC', 'Microsoft YaHei', 'SimHei', 'SimSun', 'Arial', sans-serif;
            font-weight: 500;
            font-size: 14px;
        }
        /* 确保 SVG 文本正确渲染 */
        svg text {
            font-family: 'Noto Sans SC', 'Microsoft YaHei', 'SimHei', 'SimSun', 'Arial', sans-serif;
        }
    </style>
</head>
<body>
    <svg id="mindmap"></svg>
    
    <script>
        ${d3Content}
    </script>
    <script>
        ${markmapLibContent}
    </script>
    <script>
        ${markmapViewContent}
    </script>
    <script>
        (function() {
            try {
                // 确保 markmap 对象存在
                window.markmap = window.markmap || {};
                
                // 渲染思维导图
                const data = ${JSON.stringify(root)};
                const jsonOptions = ${jsonOptionsStr};
                
                // 使用 markmap-view 渲染
                const { Markmap } = window.markmap;
                if (!Markmap) {
                    console.error('Markmap 未找到，请检查脚本加载顺序');
                    window.renderComplete = true;
                    return;
                }
                
                const svg = d3.select('#mindmap');
                
                // 创建 Markmap 实例
                const mm = Markmap.create(svg.node(), jsonOptions);
                
                // 递归展开所有节点
                function expandAllNodes(node) {
                    if (node.children && node.children.length > 0) {
                        // 确保节点是展开状态
                        if (!node.payload) {
                            node.payload = {};
                        }
                        node.payload.fold = false;
                        // 递归处理子节点
                        node.children.forEach(expandAllNodes);
                    }
                }
                
                // 展开所有节点
                expandAllNodes(data);
                
                // 设置数据并渲染
                mm.setData(data);
                mm.fit();
                
                // 等待 markmap 完全渲染完成
                // 使用 requestAnimationFrame 确保 DOM 更新完成
                let renderAttempts = 0;
                const maxAttempts = 100; // 最多等待 5 秒 (100 * 50ms)
                
                function checkRenderComplete() {
                    renderAttempts++;
                    // 检查是否有节点被渲染出来
                    const nodes = svg.selectAll('.markmap-node').nodes();
                    const hasNodes = nodes && nodes.length > 0;
                    
                    if (hasNodes && renderAttempts > 10) {
                        // 至少等待 10 帧确保所有节点都渲染完成
                        window.renderComplete = true;
                    } else if (renderAttempts >= maxAttempts) {
                        // 超时也标记为完成
                        console.warn('渲染超时，但继续处理');
                        window.renderComplete = true;
                    } else {
                        requestAnimationFrame(checkRenderComplete);
                    }
                }
                
                // 延迟开始检查，给 markmap 一些初始化时间
                setTimeout(() => {
                    requestAnimationFrame(checkRenderComplete);
                }, 500);
            } catch (error) {
                console.error('渲染错误:', error);
                window.renderComplete = true;
            }
        })();
    </script>
</body>
</html>
`;

        // 渲染为图片
        console.log('开始渲染图片...');
        // 检测系统 Chromium 路径（Docker 容器中使用系统 Chromium）
        const chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
        
        const image = await nodeHtmlToImage({
            html,
            type: format,
            puppeteerArgs: {
                executablePath: chromiumPath,
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox', 
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--font-render-hinting=none'
                ],
                timeout: 120000  // 120秒超时
            },
            waitUntil: 'load',  // 改为 load，避免等待网络请求
            timeout: 120000,
            beforeScreenshot: async (page) => {
                // 等待渲染完成标志
                await page.waitForFunction(() => window.renderComplete === true, { timeout: 30000 });
                // 额外等待确保所有动画和渲染完成
                await new Promise(resolve => setTimeout(resolve, 1000));
                // 等待字体加载完成
                await page.evaluate(() => {
                    return document.fonts.ready;
                });
            }
        });

        console.log('渲染完成');

        // 如果 outputPath 为 null，直接返回图片 Buffer（用于 API）
        if (outputPath === null) {
            return image;
        }

        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 保存图片
        await fs.promises.writeFile(outputPath, image);

        return outputPath;
    } catch (error) {
        console.error('渲染思维导图失败:', error);
        throw error;
    }
}

module.exports = { renderMarkmap };

