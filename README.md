# WebWatcher - 智能网页监控技能
![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-blue)
![Node.js](https://img.shields.io/badge/Node.js-14+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)
![Status](https://img.shields.io/badge/Status-Production-success)

[![GitHub stars](https://img.shields.io/github/stars/plum-zhang/openclaw-webwatcher?style=social)](https://github.com/plum-zhang/openclaw-webwatcher/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/plum-zhang/openclaw-webwatcher?style=social)](https://github.com/plum-zhang/openclaw-webwatcher/network/members)

> OpenClaw 技能展示项目 - 自动监控网页变化，智能提取关键信息

## ✨ 特性

- 🔍 **智能监控** - 自动检测网页内容变化
- 💰 **价格追踪** - 电商价格监控，降价提醒
- 📱 **多渠道通知** - 支持飞书、邮件、微信
- 📊 **历史记录** - 保存变化历史，支持回溯
- 🎯 **灵活配置** - 支持自定义选择器和提取规则

## 🚀 快速开始

### 安装依赖

```bash
cd ~/.openclaw/workspace/skills/webwatcher-demo
npm install
```

### 基础使用

```bash
# 检查单个页面
node webwatcher.js check --url "https://example.com"

# 监控价格（每30分钟检查一次）
node webwatcher.js price --url "https://item.jd.com/123.html" --target 999

# 持续监控内容变化
node webwatcher.js monitor --url "https://blog.example.com" --interval 1h
```

## 📖 使用场景

### 1. 电商价格监控

监控京东、淘宝等电商平台商品价格，降价时自动通知：

```bash
node webwatcher.js price \
  --url "https://item.jd.com/100012345678.html" \
  --target 6999 \
  --interval 30m \
  --name "iPhone 15 Pro"
```

### 2. 招聘信息监控

监控公司招聘页面，有新职位时立即通知：

```bash
node webwatcher.js monitor \
  --url "https://company.com/careers" \
  --interval 6h \
  --name "公司招聘"
```

### 3. 博客/新闻更新

监控技术博客或新闻网站更新：

```bash
node webwatcher.js monitor \
  --url "https://blog.example.com" \
  --interval 12h
```

### 4. 库存监控

监控商品库存状态，有货时立即通知（抢购利器）：

```bash
node webwatcher.js monitor \
  --url "https://store.com/product" \
  --selector ".stock-status" \
  --interval 5m
```

## 🎯 技术亮点

1. **智能内容提取** - 自动识别价格、标题等关键信息
2. **变化检测** - 基于内容哈希的高效变化检测
3. **历史记录** - 完整的变化历史和页面快照
4. **可扩展性** - 易于集成更多通知渠道和提取规则

## 📊 数据存储

所有数据保存在 `~/.openclaw/workspace/data/webwatcher/`：

```
webwatcher/
├── tasks.json          # 监控任务列表
├── history/            # 变化历史
│   └── task-xxx.json
└── snapshots/          # 页面快照
    └── task-xxx-2026-03-07.html
```

## 🔧 高级配置

### 自定义选择器

```bash
# 监控特定元素
node webwatcher.js monitor \
  --url "https://example.com" \
  --selector ".price-box .current-price"
```

### 配置文件

创建 `config.json`：

```json
{
  "url": "https://example.com/product",
  "name": "商品名称",
  "type": "price",
  "selector": ".price",
  "interval": "30m",
  "target": 999,
  "notify": ["feishu", "email"]
}
```

## 🎨 展示价值

这个技能展示了以下能力：

1. ✅ **实用性** - 解决真实需求（价格监控、内容追踪）
2. ✅ **技术深度** - 网页抓取、数据提取、定时任务
3. ✅ **可扩展性** - 易于添加新功能和集成
4. ✅ **代码质量** - 清晰的结构、完善的错误处理
5. ✅ **文档完善** - 详细的使用说明和示例

## 💼 商业价值

基于此技能可以提供的定制服务：

- 🛒 **电商监控方案** - ¥1,000-3,000
- 📰 **内容聚合系统** - ¥2,000-5,000
- 🏢 **企业竞品监控** - ¥5,000-10,000
- 🎯 **定制化开发** - ¥500-2,000/天

## 📞 联系方式

- 作者：[你的名字]
- 邮箱：[你的邮箱]
- GitHub：[你的 GitHub]
- 微信：[你的微信]

## 📄 许可证

MIT License - 可自由用于商业和个人项目

---

**这是一个 OpenClaw 技能展示项目，用于演示技能开发能力和接单作品集。**
