#!/usr/bin/env node
/**
 * Markmap 图片渲染工具
 * 使用 Node.js + markmap 官方库渲染思维导图为 PNG 图片
 */
const fs = require('fs');
const path = require('path');
const { Transformer } = require('markmap-lib');
const { fillTemplate } = require('markmap-render');
const nodeHtmlToImage = require('node-html-to-image');

/**
 * 渲染 Markdown 为思维导图图片
 * @param {string} markdown - Markdown 内容
 * @param {string} outputPath - 输出图片路径
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
            initialExpandLevel: 2,
            autoFit: true,
            fitRatio: 0.95
        }
    } = options;

    try {
        // 转换 Markdown 为思维导图数据
        const transformer = new Transformer();
        const { root, features } = transformer.transform(markdown);
        const assets = transformer.getUsedAssets(features);

        // 生成 HTML
        const html = fillTemplate(root, assets, {
            jsonOptions
        }) + `
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
`;

        // 渲染为图片
        // 注意：node-html-to-image 内部使用 puppeteer-cluster，默认超时30秒
        // 我们需要通过 puppeteerArgs 设置更长的超时时间
        const image = await nodeHtmlToImage({
            html,
            type: format,
            puppeteerArgs: {
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox', 
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--font-render-hinting=none'
                ],
                timeout: 120000  // 120秒超时（2分钟）
            },
            waitUntil: 'networkidle0',
            timeout: 120000,  // 整体超时时间
            beforeScreenshot: async (page) => {
                // 等待字体加载完成
                await page.evaluate(() => {
                    return document.fonts.ready;
                });
                // 额外等待一段时间确保渲染完成
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        });

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

// 命令行接口
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('用法: node markmap_renderer.js <markdown_file|-> <output_path> [width] [height]');
        console.error('  如果第一个参数是 "-"，则从标准输入读取 Markdown');
        console.error('示例: node markmap_renderer.js input.md output.png 2400 1800');
        console.error('示例: echo "# 标题" | node markmap_renderer.js - output.png');
        process.exit(1);
    }

    const markdownInput = args[0];
    const outputPath = args[1];
    const width = args[2] ? parseInt(args[2]) : 2400;
    const height = args[3] ? parseInt(args[3]) : 1800;

    let markdown;
    if (markdownInput === '-') {
        // 从标准输入读取
        const chunks = [];
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => chunks.push(chunk));
        process.stdin.on('end', () => {
            markdown = chunks.join('');
            renderMarkmap(markdown, outputPath, { width, height })
                .then((path) => {
                    console.log(`✓ 思维导图已生成: ${path}`);
                    process.exit(0);
                })
                .catch((error) => {
                    console.error('✗ 生成失败:', error.message);
                    process.exit(1);
                });
        });
    } else {
        // 从文件读取
        if (!fs.existsSync(markdownInput)) {
            console.error(`错误: 文件不存在: ${markdownInput}`);
            process.exit(1);
        }
        markdown = fs.readFileSync(markdownInput, 'utf-8');
        renderMarkmap(markdown, outputPath, { width, height })
            .then((path) => {
                console.log(`✓ 思维导图已生成: ${path}`);
                process.exit(0);
            })
            .catch((error) => {
                console.error('✗ 生成失败:', error.message);
                process.exit(1);
            });
    }
}

module.exports = { renderMarkmap };

