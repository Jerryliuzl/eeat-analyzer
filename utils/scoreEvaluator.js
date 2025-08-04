const hasExperienceKeywords = (str) => {
  if (!str) return false;
  const keywords = ['experience', 'experiences', 'benefit', 'benefits', 'review', 'reviews', 'tips', 'guide', '實測', '心得', '使用方法'];
  return keywords.some((k) => str.toLowerCase().includes(k));
};

function evaluateEEAT(data) {
  const schemaTypes = Array.isArray(data.schemaTypes) ? data.schemaTypes : [];
  const title = data.title || '';
  const hostname = (data.hostname || '').toLowerCase();

  const scores = {
    experience: data.hasUserReviews
      ? 5
      : hasExperienceKeywords(title)
      ? 3
      : 0,

    expertise: data.author && data.hasAuthorPage
      ? 5
      : data.author || data.hasAuthorPage
      ? 3
      : 0,

    authoritativeness:
      data.externalLinksCount >= 5
        ? 5
        : data.externalLinksCount > 0
        ? 3
        : 0,

    trustworthiness: (() => {
      const articleTypes = ['Article', 'NewsArticle', 'BlogPosting'];
      const hasSomeArticleType = articleTypes.some(type => schemaTypes.includes(type));
      const count = [data.hasFAQSchema, hasSomeArticleType, data.publishDate].filter(Boolean).length;

      // ✅ 改進邏輯：若有其中一項就不給 0，提升真實可信網站的得分
      if (count === 3) return 5;
      if (count === 2) return 4;
      if (count === 1) return 3;
      return 1; // 至少給個基本分，不再是 0
    })()
  };

  // ✅ 官方/知識型網站補分（wikipedia 也列入）
  const trustedDomains = [
    '.gov', 'cdc.gov', 'who.int', 'health.gov', 'fda.gov', 'nih.gov', 'wikipedia.org'
  ];
  const isOfficialSource = trustedDomains.some(domain => hostname.includes(domain));
  if (isOfficialSource && scores.trustworthiness < 4) {
    scores.trustworthiness += 1;
    if (scores.trustworthiness > 5) scores.trustworthiness = 5;
  }

  const totalScore =
    scores.experience +
    scores.expertise +
    scores.authoritativeness +
    scores.trustworthiness;

const suggestions = [];

if (!data.author) {
  suggestions.push({
    type: 'structure',
    issue: 'missing_author',
    message: '建議補上作者資訊',
    action: '加入 <meta name="author"> 或作者段落'
  });
}

if (!data.hasFAQSchema) {
  suggestions.push({
    type: 'schema',
    issue: 'missing_faq_schema',
    message: '可加入 FAQ 結構化資料以提升搜尋表現',
    action: '加入 @type: FAQPage 的 JSON-LD script'
  });
}

if (!data.hasArticleSchema && !schemaTypes.includes('Article')) {
  suggestions.push({
    type: 'schema',
    issue: 'missing_article_schema',
    message: '可加入 Article Schema 強化內容標示',
    action: '加入 @type: Article 的 JSON-LD script'
  });
}

if (!data.publishDate) {
  suggestions.push({
    type: 'structure',
    issue: 'missing_publish_date',
    message: '建議補上文章發布時間',
    action: '加入 <meta name="date"> 或文章內文標註時間'
  });
}


  return {
    title: data.title,
    url: data.url,
    scores,
    totalScore,
    suggestions,
  };
}

module.exports = evaluateEEAT;
