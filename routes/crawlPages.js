const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/crawl-pages', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: '❌ 缺少網址' });

  try {
    console.log("🔎 發送請求到 Python CrawlerAPI...");
    const response = await axios.post('http://localhost:7080/api/url_to_crawl', {
      url,
      customer: "default",
      username: "guest",
      OU: "guest",
      group_names: []
    });

    console.log("🟢 Python 回傳:", response.data);

    // ✅ Python 現在直接回傳分析過的結果
    const reports = response.data.reports || [];
    if (reports.length === 0) {
      return res.status(404).json({ error: '❌ 沒有找到可用的分析結果' });
    }

    res.json({ reports });  // 直接傳回給前端
  } catch (err) {
    console.error('❌ 多頁爬蟲 API 錯誤:', err.message);
    res.status(500).json({ error: '多頁爬蟲失敗', detail: err.message });
  }
});

module.exports = router;
