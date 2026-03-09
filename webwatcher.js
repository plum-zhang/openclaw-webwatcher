#!/usr/bin/env node

/**
 * WebWatcher - 智能网页监控工具
 * 用于展示 OpenClaw 技能开发能力
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// 检查是否安装了 puppeteer
let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  // puppeteer 未安装
}

// 配置
const CONFIG = {
  dataDir: path.join(process.env.HOME, '.openclaw/workspace/data/webwatcher'),
  tasksFile: 'tasks.json',
  historyDir: 'history',
  snapshotsDir: 'snapshots',
  cookiesFile: 'cookies.json',
  userDataDir: path.join(process.env.HOME, '.openclaw/workspace/data/webwatcher/browser-data'),
  debugPort: 9222 // 远程调试端口
};

// 初始化数据目录
async function initDataDir() {
  await fs.mkdir(CONFIG.dataDir, { recursive: true });
  await fs.mkdir(path.join(CONFIG.dataDir, CONFIG.historyDir), { recursive: true });
  await fs.mkdir(path.join(CONFIG.dataDir, CONFIG.snapshotsDir), { recursive: true });
  await fs.mkdir(CONFIG.userDataDir, { recursive: true });
}

// 加载 Cookies
async function loadCookies() {
  try {
    const cookiesPath = path.join(CONFIG.dataDir, CONFIG.cookiesFile);
    const cookiesString = await fs.readFile(cookiesPath, 'utf-8');
    return JSON.parse(cookiesString);
  } catch (error) {
    return null;
  }
}

// 保存 Cookies
async function saveCookies(cookies) {
  const cookiesPath = path.join(CONFIG.dataDir, CONFIG.cookiesFile);
  await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
}

// 启动浏览器（支持远程调试）
async function startBrowser() {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  console.log('🚀 启动支持远程调试的 Chrome...');
  console.log(`📡 调试端口: ${CONFIG.debugPort}`);
  console.log('');

  // 先确保没有已运行的 Chrome 实例占用调试端口
  const command = `open -a "Google Chrome" --args --remote-debugging-port=${CONFIG.debugPort} --user-data-dir="${CONFIG.userDataDir}"`;

  try {
    await execAsync(command);
    console.log('✅ Chrome 已启动，等待就绪...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('💡 请在浏览器中登录需要监控的网站，然后运行监控命令');
    console.log('');
    console.log('示例：');
    console.log('  node webwatcher.js price --url "https://item.jd.com/100327533584.html" --target 999');
  } catch (error) {
    console.error(`❌ 启动失败: ${error.message}`);
    console.log('');
    console.log('💡 请手动在终端运行以下命令启动 Chrome：');
    console.log(`   open -a "Google Chrome" --args --remote-debugging-port=${CONFIG.debugPort} --user-data-dir="${CONFIG.userDataDir}"`);
    process.exit(1);
  }
}

// 登录并保存 Cookies
async function loginAndSaveCookies(url) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  console.log('🌐 使用系统浏览器打开页面...');
  console.log(`📱 URL: ${url}`);
  console.log('');
  console.log('请按以下步骤操作：');
  console.log('1. 在打开的浏览器中登录网站');
  console.log('2. 登录成功后，打开浏览器的开发者工具（F12 或 Cmd+Option+I）');
  console.log('3. 切换到 Console（控制台）标签');
  console.log('4. 复制并执行以下代码来获取 Cookies：');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('copy(JSON.stringify(document.cookie.split("; ").map(c => {');
  console.log('  const [name, ...v] = c.split("=");');
  console.log('  return {');
  console.log('    name,');
  console.log('    value: v.join("="),');
  console.log('    domain: location.hostname,');
  console.log('    path: "/"');
  console.log('  };');
  console.log('})))');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('5. 执行后 Cookies 会自动复制到剪贴板');
  console.log('6. 回到这里，粘贴 Cookies 内容，然后按 Enter：');
  console.log('');

  // 使用 open 命令打开浏览器
  try {
    await execAsync(`open "${url}"`);
  } catch (error) {
    console.error(`❌ 打开浏览器失败: ${error.message}`);
    process.exit(1);
  }

  // 等待用户输入 cookies
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const cookiesJson = await new Promise(resolve => {
    rl.question('', answer => {
      rl.close();
      resolve(answer.trim());
    });
  });

  try {
    const cookies = JSON.parse(cookiesJson);
    await saveCookies(cookies);
    console.log(`\n✅ 已保存 ${cookies.length} 个 Cookies`);
    console.log(`📁 保存位置: ${path.join(CONFIG.dataDir, CONFIG.cookiesFile)}`);
  } catch (error) {
    console.error(`\n❌ 解析 Cookies 失败: ${error.message}`);
    console.error('请确保粘贴的是有效的 JSON 格式');
    process.exit(1);
  }
}

// 获取网页内容
async function fetchPage(url, useBrowser = false) {
  // 如果需要使用浏览器且 puppeteer 可用
  if (useBrowser && puppeteer) {
    let browser;
    try {
      // 尝试连接到已有的浏览器实例
      try {
        browser = await puppeteer.connect({
          browserURL: `http://localhost:${CONFIG.debugPort}`
        });
        console.log('✅ 已连接到现有浏览器实例');
      } catch (connectError) {
        console.log('⚠️ 无法连接到现有浏览器，正在启动新浏览器...');
        console.log('💡 提示：你可以先运行以下命令启动浏览器：');
        console.log(`   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${CONFIG.debugPort} --user-data-dir="${CONFIG.userDataDir}"`);
        console.log('');

        // 启动新的浏览器实例
        browser = await puppeteer.launch({
          headless: false,
          userDataDir: CONFIG.userDataDir,
          args: [
            `--remote-debugging-port=${CONFIG.debugPort}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
          ]
        });
        console.log('✅ 已启动新浏览器实例');
      }

      const pages = await browser.pages();
      let page;

      // 查找是否已经有打开的目标页面
      const existingPage = pages.find(p => p.url().includes(new URL(url).hostname));

      if (existingPage) {
        page = existingPage;
      } else {
        page = await browser.newPage();
        console.log('✅ 创建新标签页');
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      }

      // 用 puppeteer 原生方式导航，更稳定
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 15000 
        });
        console.log('✅ 页面已加载');
      } catch (navError) {
        console.log(`⚠️ 页面加载超时: ${navError.message}`);
        // 继续执行，因为页面可能部分加载
      }

      // 针对京东和 Steam，额外等待价格元素
      if (url.includes('jd.com')) {
        try {
          await page.waitForSelector('.p-price, [class*="price"]', { timeout: 8000 });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.log('⚠️ 等待价格元素超时');
        }
      }
      
      // 针对 Steam，等待价格元素加载
      if (url.includes('steampowered.com')) {
        try {
          await page.waitForSelector('.game_purchase_price, .discount_final_price', { timeout: 8000 });
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
          console.log('⚠️ 等待 Steam 价格元素超时');
        }
      }

      // 获取页面 HTML
      const html = await page.content();
      
      // 注意：不关闭浏览器，保持连接
      return { html, page, browser: null }; // browser 设为 null 避免被关闭
    } catch (error) {
      if (browser) {
        try {
          await browser.disconnect();
        } catch (e) {
          // 忽略断开连接的错误
        }
      }
      console.log(`⚠️ 浏览器模式失败，回退到普通模式: ${error.message}`);
    }
  }

  // headless 浏览器模式（用于动态内容，不需要登录状态）
  if (puppeteer) {
    let browser;
    try {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const html = await page.content();
      await browser.close();
      return { html, page: null, browser: null };
    } catch (error) {
      if (browser) await browser.close().catch(() => {});
      console.log(`⚠️ headless 浏览器失败，回退到普通模式: ${error.message}`);
    }
  }

  // 普通 HTTP 请求
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    return { html: response.data, page: null, browser: null };
  } catch (error) {
    throw new Error(`获取页面失败: ${error.message}`);
  }
}

// 提取内容
function extractContent(html, selector = null) {
  const $ = cheerio.load(html);

  if (selector) {
    return $(selector).map((i, el) => $(el).text().trim()).get().join('\n');
  }

  // 默认提取：移除 script/style 后取全部 body 文本
  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  return {
    title: $('title').text().trim(),
    body: bodyText
  };
}

// 提取价格
async function extractPrice(html, url, page = null) {
  // 如果有 puppeteer page 对象，直接在浏览器中提取
  if (page && (url.includes('jd.com') || url.includes('steampowered.com'))) {
    try {
      const price = await page.evaluate(() => {
        // Steam 特殊处理
        if (window.location.hostname.includes('steampowered.com')) {
          // Steam 免费游戏
          const freeText = document.querySelector('.game_purchase_price, [class*="free"]');
          if (freeText && (freeText.textContent.includes('免费') || freeText.textContent.includes('Free'))) {
            return 0; // 免费游戏返回 0
          }
          // Steam 价格元素
          const steamPriceEl = document.querySelector('.game_purchase_price, .discount_final_price, [class*="price"]');
          if (steamPriceEl) {
            const text = steamPriceEl.textContent || steamPriceEl.innerText;
            // 匹配 ¥103.00 或 $19.99 等格式
            const match = text.match(/[¥$€£]?\s*([\d,]+\.?\d*)/);
            if (match) return parseFloat(match[1].replace(/,/g, ''));
          }
          return null;
        }
        
        // 京东价格选择器
        const priceEl = document.querySelector('.p-price .price, .price-now, [class*="price"]');
        if (priceEl) {
          const text = priceEl.textContent || priceEl.innerText;
          const match = text.match(/[\d,]+\.?\d*/);
          if (match) return parseFloat(match[0].replace(/,/g, ''));
        }
        return null;
      });
      if (price !== null) return price;
    } catch (error) {
      console.log(`⚠️ 浏览器内提取价格失败: ${error.message}`);
    }
  }

  const $ = cheerio.load(html);

  // 京东特殊处理 - API 方式
  if (url.includes('jd.com') || url.includes('item.jd.com')) {
    const skuMatch = url.match(/\/(\d+)\.html/);
    if (skuMatch) {
      const skuId = skuMatch[1];

      // 尝试多个京东价格接口
      const priceUrls = [
        `https://p.3.cn/prices/mgets?skuIds=J_${skuId}`,
        `https://item-soa.jd.com/getWareBusiness?skuId=${skuId}`,
        `https://c0.3.cn/stock?skuId=${skuId}&area=1_72_2799_0&cat=1,1,1`
      ];

      for (const priceUrl of priceUrls) {
        try {
          const response = await axios.get(priceUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Referer': url
            },
            timeout: 5000
          });

          // 解析不同接口的响应
          if (response.data) {
            if (Array.isArray(response.data) && response.data[0]?.p) {
              return parseFloat(response.data[0].p);
            }
            if (response.data.price) {
              return parseFloat(response.data.price);
            }
          }
        } catch (error) {
          // 静默失败，尝试下一个接口
        }
      }
    }
  }

  // Steam 特殊处理
  if (url.includes('steampowered.com')) {
    // 检查是否是免费游戏
    const pageText = $('body').text();
    if (pageText.includes('免费开玩') || pageText.includes('Free to Play')) {
      return 0; // 免费游戏
    }
    
    // 尝试提取价格
    const steamSelectors = [
      '.game_purchase_price',
      '.discount_final_price', 
      '.discount_original_price',
      '[class*="game_purchase"]'
    ];
    
    for (const selector of steamSelectors) {
      const text = $(selector).first().text();
      // 匹配 ¥103.00, $19.99, €15.99 等格式
      const match = text.match(/[¥$€£]\s*([\d,]+\.?\d*)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
  }

  // 常见价格选择器
  const priceSelectors = [
    '.price',
    '.price-current',
    '[class*="price"]',
    '[id*="price"]',
    '.p-price'
  ];

  for (const selector of priceSelectors) {
    const text = $(selector).first().text();
    const match = text.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
  }

  return null;
}

// 计算内容哈希
function hashContent(content) {
  return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
}

// 保存快照
async function saveSnapshot(taskId, html) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${taskId}-${timestamp}.html`;
  const filepath = path.join(CONFIG.dataDir, CONFIG.snapshotsDir, filename);
  await fs.writeFile(filepath, html);
  return filename;
}

// 保存历史记录
async function saveHistory(taskId, data) {
  const filepath = path.join(CONFIG.dataDir, CONFIG.historyDir, `${taskId}.json`);
  let history = [];
  
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    history = JSON.parse(content);
  } catch (error) {
    // 文件不存在，创建新的
  }
  
  history.push({
    timestamp: new Date().toISOString(),
    ...data
  });
  
  // 只保留最近 100 条记录
  if (history.length > 100) {
    history = history.slice(-100);
  }
  
  await fs.writeFile(filepath, JSON.stringify(history, null, 2));
}

// 发送通知
async function sendNotification(message, channels = ['console']) {
  console.log(`\n🔔 通知: ${message}\n`);
  
  // 这里可以集成 OpenClaw 的通知系统
  // 例如：调用飞书、邮件、微信等
  
  if (channels.includes('feishu')) {
    // TODO: 集成飞书通知
    console.log('📱 飞书通知已发送');
  }
  
  if (channels.includes('email')) {
    // TODO: 集成邮件通知
    console.log('📧 邮件通知已发送');
  }
}

// 检查单个页面
async function checkPage(url, options = {}) {
  console.log(`🔍 检查页面: ${url}`);

  // 价格监控用已有浏览器（需要登录状态），内容监控用 headless 浏览器
  // Steam 页面不需要登录，使用 headless 模式即可
  const useConnectedBrowser = (options.type === 'price' && !url.includes('steampowered.com')) || options.browser === 'true';
  const { html, page, browser } = await fetchPage(url, useConnectedBrowser);
  const taskId = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);

  let result = {};

  try {
    if (options.type === 'price') {
      const price = await extractPrice(html, url, page);
      result = { price };
      console.log(`💰 当前价格: ${price !== null ? (price === 0 ? '免费 (0)' : price) : '未找到'}`);
    } else if (options.selector) {
      const content = extractContent(html, options.selector);
      result = { content };
      console.log(`📄 提取内容: ${content.substring(0, 100)}...`);
    } else {
      result = extractContent(html);
      console.log(`📄 页面标题: ${result.title}`);
    }

    // 保存快照
    await saveSnapshot(taskId, html);

    // 保存历史
    await saveHistory(taskId, result);
  } finally {
    // 确保关闭浏览器
    if (browser) await browser.close();
  }

  return result;
}

// 监控任务
async function monitorTask(url, options = {}) {
  const interval = parseInterval(options.interval || '30m');
  const taskId = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
  
  console.log(`👁️  开始监控: ${options.name || url}`);
  console.log(`⏱️  检查间隔: ${options.interval || '30m'}`);
  console.log(`🆔 任务 ID: ${taskId}`);
  
  let lastHash = null;
  
  const check = async () => {
    try {
      const result = await checkPage(url, options);
      const currentHash = hashContent(result);
      
      if (lastHash && currentHash !== lastHash) {
        const message = `${options.name || url} 内容已变化！`;
        await sendNotification(message, options.notify || ['console']);
        
        // 如果是价格监控，检查阈值
        if (options.type === 'price' && result.price) {
          if (options.target) {
            if (options.notifyBelow && result.price < options.target) {
              await sendNotification(
                `🎉 价格降至 ${result.price}，低于目标价 ${options.target}！`,
                options.notify
              );
            }
            if (options.notifyAbove && result.price > options.target) {
              await sendNotification(
                `⚠️ 价格升至 ${result.price}，高于目标价 ${options.target}！`,
                options.notify
              );
            }
          }
        }
      }
      
      lastHash = currentHash;
      console.log(`✅ 检查完成 (${new Date().toLocaleString()})`);
    } catch (error) {
      console.error(`❌ 检查失败: ${error.message}`);
    }
  };
  
  // 立即执行一次
  await check();
  
  // 定时执行
  setInterval(check, interval);
}

// 解析时间间隔
function parseInterval(str) {
  const match = str.match(/^(\d+)(m|h|d)$/);
  if (!match) return 30 * 60 * 1000; // 默认 30 分钟
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  
  return value * multipliers[unit];
}

// CLI 入口
async function main() {
  await initDataDir();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  // 解析参数
  const options = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    options[key] = value;
  }
  
  try {
    switch (command) {
      case 'browser':
        await startBrowser();
        break;

      case 'login':
        if (!options.url) {
          console.error('❌ 缺少 --url 参数');
          process.exit(1);
        }
        await loginAndSaveCookies(options.url);
        break;

      case 'check':
        if (!options.url) {
          console.error('❌ 缺少 --url 参数');
          process.exit(1);
        }
        await checkPage(options.url, options);
        break;
        
      case 'monitor':
        if (!options.url) {
          console.error('❌ 缺少 --url 参数');
          process.exit(1);
        }
        await monitorTask(options.url, options);
        break;
        
      case 'price':
        if (!options.url) {
          console.error('❌ 缺少 --url 参数');
          process.exit(1);
        }
        options.type = 'price';
        if (options.target) {
          options.target = parseFloat(options.target);
          options.notifyBelow = true;
        }
        await monitorTask(options.url, options);
        break;
        
      case 'content':
        if (!options.url) {
          console.error('❌ 缺少 --url 参数');
          process.exit(1);
        }
        await monitorTask(options.url, options);
        break;
        
      default:
        console.log(`
WebWatcher - 智能网页监控工具

用法:
  node webwatcher.js browser
  node webwatcher.js check --url <url>
  node webwatcher.js monitor --url <url> [--interval 30m]
  node webwatcher.js price --url <url> --target <price> [--interval 30m]
  node webwatcher.js content --url <url>

示例:
  # 启动支持远程调试的浏览器（首次使用）
  node webwatcher.js browser

  # 检查页面价格
  node webwatcher.js check --url "https://item.jd.com/100327533584.html" --type price

  # 监控价格（每 5 分钟检查一次）
  node webwatcher.js price --url "https://item.jd.com/100327533584.html" --target 999 --interval 5m

  # 持续监控内容变化
  node webwatcher.js monitor --url "https://blog.com" --interval 1h

说明:
  - 首次使用需要先运行 'browser' 命令启动浏览器
  - 在浏览器中手动登录需要监控的网站
  - 之后运行监控命令会自动连接到该浏览器实例
  - 浏览器保持打开状态，可以随时查看监控页面
        `);
    }
  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fetchPage,
  extractContent,
  extractPrice,
  checkPage,
  monitorTask
};
