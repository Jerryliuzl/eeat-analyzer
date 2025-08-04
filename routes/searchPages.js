const express = require('express');
const router = express.Router();
const axios = require('axios');
const { analyzePage } = require('../analyze-page'); // ✅ 匯入分析函式

router.post('/search-pages', async (req, res) => {
  const { keyword, limit = 5 } = req.body;
  if (!keyword) return res.status(400).json({ error: '❌ 缺少搜尋關鍵字' });

  try {
    // 1️⃣ 呼叫 Python API 做 Google 搜尋
    console.log(`🔍 發送搜尋請求到 Python: ${keyword}`);
    const response = await axios.post('http://localhost:7080/api/search_pages', {
      keyword,
      limit
    });

    const links = response.data.links || [];
    console.log(`🔗 Python 回傳 ${links.length} 個連結`);

    if (links.length === 0) {
      return res.status(200).json({
        keyword,
        reports: [],
        warning: '⚠️ 搜尋結果為空，可能是 Google 限制或版面改變'
      });
    }

    // 2️⃣ Node.js 用 analyzePage 分析每個連結
    const reports = [];
    for (const url of links) {
      try {
        const report = await analyzePage(url); // ✅ 直接打分
        reports.push(report);
      } catch (err) {
        console.warn(`❌ 分析失敗：${url}`, err.message);
        reports.push({ url, error: '分析失敗' });
      }
    }

    // 3️⃣ 依總分排序並取前 5
    const topReports = reports
      .filter(r => r?.totalScore !== undefined)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    res.json({ keyword, links, reports: topReports });
  } catch (err) {
    console.error('❌ 搜尋 API 錯誤:', err.message);
    res.status(500).json({ error: '搜尋失敗', detail: err.message });
  }
});

module.exports = router;
