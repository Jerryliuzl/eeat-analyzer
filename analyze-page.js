const puppeteer = require('puppeteer');
const evaluateEEAT = require('./utils/scoreEvaluator');
const express = require('express');
const cheerio = require('cheerio');
const fs = require('fs');
const router = express.Router();

/**
 * 🟢 核心分析函式
 * @param {string} url - 頁面網址
 * @param {string} [filePath] - Python 爬蟲儲存的 HTML/Text 檔路徑
 * @returns {object} - E-E-A-T 評分報告
 */
async function analyzePage(url, filePath = null) {
  if (!url) throw new Error('Missing URL');

  let pageContent = '';

  // 1️⃣ 如果 Python 爬蟲已經下載了 HTML 檔案，直接讀檔
  if (filePath && fs.existsSync(filePath)) {
    console.log(`📄 讀取 Python 爬蟲檔案：${filePath}`);
    try {
      pageContent = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      console.error('❌ 讀取檔案失敗:', err.message);
    }
  }

  // 2️⃣ 若沒有檔案或讀檔失敗 → 用 Puppeteer 抓網頁
  if (!pageContent) {
    console.log(`🌐 使用 Puppeteer 抓取：${url}`);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    pageContent = await page.content();
    await browser.close();
  }

  // 3️⃣ 用 Cheerio/DOM 分析 HTML
  const $ = cheerio.load(pageContent);

  const getMetaContent = (name) => $(`meta[name="${name}"]`).attr('content') || null;
  const getMetaProperty = (property) => $(`meta[property="${property}"]`).attr('content') || null;

  // 解析 JSON-LD Schema
  const schemas = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      schemas.push(json);
    } catch (e) { /* skip invalid JSON */ }
  });

  const schemaTypes = schemas
    .map(s => s['@type'])
    .flat()
    .filter(Boolean);

  const externalLinksCount = $('a')
    .map((_, a) => $(a).attr('href'))
    .get()
    .filter(href => href && !href.includes(new URL(url).hostname)).length;

  const rawResult = {
    title:
      getMetaProperty('og:title') ||
      getMetaContent('title') ||
      $('title').text() ||
      null,
    author: getMetaContent('author'),
    publishDate: getMetaContent('date') || getMetaContent('article:published_time'),
    hasFAQSchema: schemas.some(s => s['@type'] === 'FAQPage'),
    hasArticleSchema: schemas.some(s => s['@type'] === 'Article'),
    externalLinksCount,
    hasUserReviews: $('[class*=review], [class*=comment]').length > 0,
    hasAuthorPage: $('a[href*="author"], a[href*="about"]').length > 0,
    schemaTypes,
    url,
    hostname: new URL(url).hostname
  };

  return evaluateEEAT(rawResult);
}

// ✅ API 路由：仍支援前端直接傳 URL
router.post('/analyze-page', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    const report = await analyzePage(url);
    res.json(report);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze page' });
  }
});

// ✅ 匯出：函式 + 路由
module.exports = {
  analyzePage,
  router
};
