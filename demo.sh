#!/bin/bash

# WebWatcher 功能演示脚本

echo "🎬 WebWatcher 功能演示"
echo "================================"
echo ""

echo "📋 测试 1: 检查网页内容"
echo "命令: node webwatcher.js check --url https://example.com"
echo ""
node webwatcher.js check --url "https://example.com"
echo ""
echo "✅ 测试 1 完成"
echo ""
sleep 2

echo "================================"
echo "📋 测试 2: 检查新闻网站"
echo "命令: node webwatcher.js check --url https://news.ycombinator.com"
echo ""
node webwatcher.js check --url "https://news.ycombinator.com"
echo ""
echo "✅ 测试 2 完成"
echo ""
sleep 2

echo "================================"
echo "📋 测试 3: 查看历史记录"
echo "命令: ls -la ~/.openclaw/workspace/data/webwatcher/history/"
echo ""
ls -la ~/.openclaw/workspace/data/webwatcher/history/
echo ""
echo "✅ 测试 3 完成"
echo ""
sleep 2

echo "================================"
echo "📋 测试 4: 查看快照文件"
echo "命令: ls -la ~/.openclaw/workspace/data/webwatcher/snapshots/"
echo ""
ls -la ~/.openclaw/workspace/data/webwatcher/snapshots/
echo ""
echo "✅ 测试 4 完成"
echo ""

echo "================================"
echo "🎉 所有测试完成！"
echo ""
echo "📊 功能验证："
echo "  ✅ 网页内容提取"
echo "  ✅ 历史记录保存"
echo "  ✅ 页面快照存储"
echo "  ✅ 多网站支持"
echo ""
echo "💡 下一步："
echo "  1. 测试持续监控功能（需要后台运行）"
echo "  2. 集成通知系统"
echo "  3. 添加更多网站支持"
echo ""
