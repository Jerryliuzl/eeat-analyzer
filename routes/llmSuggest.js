const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  const { report } = req.body;
  if (!report || !report.scores) return res.status(400).json({ error: '缺少評分報告' });

  try {
    const suggestionList = (report.suggestions || [])
      .map((s, i) => `(${i + 1}) ${typeof s === 'string' ? s : s.message}`)
      .join('\n');

    const prompt = `
請根據以下網頁的 E-E-A-T 評分結果，給出一份完整建議報告，內容包含：

1. 一段簡短摘要（summary）：建議網站優先改善的面向與整體策略。
2. 詳細建議（details）：針對 Experience, Expertise, Authoritativeness, Trustworthiness 四項，每項列出目前分數與優化方向（用陣列格式回應）。

--- 報告內容如下 ---
【標題】：${report.title}
【網址】：${report.url}
【分數】：
- Experience: ${report.scores.experience}
- Expertise: ${report.scores.expertise}
- Authoritativeness: ${report.scores.authoritativeness}
- Trustworthiness: ${report.scores.trustworthiness}
【現有建議】：
${suggestionList}

請用繁體中文回答，**僅輸出 JSON 結構，不加說明或註解**，格式如下：
{
  "summary": "文字摘要",
  "details": [
    { "area": "Experience", "score": 數字, "note": "建議說明" },
    ...
  ]
}
`;

    const response = await axios.post('http://192.168.0.82:11434/api/generate', {
      model: 'gemma3:12b',
      prompt,
      stream: false
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const raw = response.data?.response || '';
    console.log('🧠 LLM 原始回傳：\n', raw);

    // 強化版：抽出第一段合法 JSON
    const jsonMatch = raw.match(/{[\s\S]*}/); // 比對第一段 { ... }
    let suggestion;

    try {
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON object found');
      }
    } catch (err) {
      console.error('⚠️ JSON parse failed:', err.message);
      suggestion = {
        summary: '❌ 無法解析 LLM 回傳建議，請檢查模型輸出格式是否為有效 JSON。',
        details: []
      };
    }

    res.json({ suggestion });

  } catch (err) {
    console.error('LLM suggestion error:', err.message);
    res.status(500).json({ error: 'LLM 回應失敗' });
  }
});

module.exports = router;
