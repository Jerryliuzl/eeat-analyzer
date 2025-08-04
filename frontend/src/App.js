import React, { useState, useEffect } from 'react';
import { Bug, Search, ScanLine, Loader2, Trash2, BarChart3, Moon, Sun } from 'lucide-react';
import EEATReport from './EEATReport';
import ComparisonChart from './ComparisonChart';

function App() {
  const [url, setUrl] = useState('');
  const [crawlUrl, setCrawlUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    setLoadingType('analyze');
    try {
      const response = await fetch('/api/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        alert('分析失敗，請確認網址正確或伺服器已啟動');
        return;
      }
      const data = await response.json();
      setReport(data);
      setReports((prev) => {
        const updated = [...prev, data];
        setSelectedIndexes(updated.map((_, i) => i));
        return updated;
      });
      setUrl('');
    } catch (err) {
      console.error('❌ analyzeUrl failed:', err);
      alert('無法連線到後端 API');
    } finally {
      setLoadingType(null);
    }
  };

  const crawlPages = async () => {
    if (!crawlUrl.trim()) return;
    setLoadingType('crawl');
    try {
      const res = await fetch('/api/crawl-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: crawlUrl })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Crawl failed:', errorText);
        alert('爬蟲 API 失敗');
        return;
      }
      const data = await res.json();
      const validReports = Array.isArray(data.reports) ? data.reports.filter(r => r && r.url) : [];
      setReports((prev) => {
        const offset = prev.length;
        setSelectedIndexes((prevSel) => [
          ...prevSel,
          ...validReports.map((_, i) => offset + i)
        ]);
        return [...prev, ...validReports];
      });
      setReport(null);
      setShowComparison(true);
      setCrawlUrl('');
    } catch (err) {
      console.error('❌ Crawl error:', err);
      alert('無法連線到爬蟲 API');
    } finally {
      setLoadingType(null);
    }
  };

  const searchPages = async () => {
    if (!searchQuery.trim()) return;
    setLoadingType('search');
    try {
      const res = await fetch('/api/search-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchQuery, limit: 5 })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Search failed:', errorText);
        alert('搜尋 API 失敗');
        return;
      }
      const data = await res.json();
      const validReports = Array.isArray(data.reports) ? data.reports.filter(r => r && r.url) : [];
      setReports((prev) => {
        const offset = prev.length;
        setSelectedIndexes((prevSel) => [
          ...prevSel,
          ...validReports.map((_, i) => offset + i)
        ]);
        return [...prev, ...validReports];
      });
      setReport(null);
      setShowComparison(true);
      setSearchQuery('');
    } catch (err) {
      console.error('❌ Search error:', err);
      alert('無法連線到搜尋 API');
    } finally {
      setLoadingType(null);
    }
  };

  const clearReports = () => {
    setReports([]);
    setReport(null);
    setSelectedIndexes([]);
    setShowComparison(false);
  };

  const toggleIndex = (index) => {
    setSelectedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const selectedReports = reports.filter((_, i) => selectedIndexes.includes(i));
  const inputStyle = { width: '75%', height: '20px', fontSize: '18px' };
  const buttonStyle = { width: '100px', height: '40px', fontSize: '18px' };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 text-lg space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-gray-200 dark:bg-gray-800">
        <h1 className="header-title">E-E-A-T Analyzer</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 px-4 py-2 rounded-md shadow bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-lg"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {darkMode ? '亮色模式' : '暗黑模式'}
        </button>
      </div>

      <div className="p-6 w-full max-w-6xl mx-auto space-y-10">
        {/* 單頁分析 */}
        <div className="analysis-card bg-gray-50 dark:bg-gray-800 p-6 rounded-md shadow space-y-3 w-full">
          <h2 className="section-title">📄 單頁分析</h2>
          <div className="flex gap-4 w-full">
            <input type="text" style={inputStyle} className="border rounded-md px-3 flex-grow shadow-sm focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              placeholder="請輸入單篇網址..." value={url} onChange={(e) => setUrl(e.target.value)} />
            <button style={buttonStyle} onClick={analyzeUrl} disabled={loadingType === 'analyze'}
              className={`inline-flex items-center justify-center gap-2 rounded-md text-white shadow ${loadingType === 'analyze' ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loadingType === 'analyze' ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>分析</span></>) :
                (<><ScanLine className="w-5 h-5" /><span>分析</span></>)}
            </button>
          </div>
        </div>

        {/* 站內多頁分析 */}
        <div className="analysis-card bg-gray-50 dark:bg-gray-800 p-6 rounded-md shadow space-y-3 w-full">
          <h2 className="section-title">🕷 小爬蟲：站內多頁分析</h2>
          <div className="flex gap-4 w-full">
            <input type="text" style={inputStyle} className="border rounded-md px-3 flex-grow shadow-sm focus:ring-2 focus:ring-emerald-400 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              placeholder="請輸入網站首頁" value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} />
            <button style={buttonStyle} onClick={crawlPages} disabled={loadingType === 'crawl'}
              className={`inline-flex items-center justify-center gap-2 rounded-md text-white shadow ${loadingType === 'crawl' ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              {loadingType === 'crawl' ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>開始爬</span></>) :
                (<><Bug className="w-5 h-5" /><span>開始爬</span></>)}
            </button>
          </div>
        </div>

        {/* 搜尋競爭對手 */}
        <div className="analysis-card bg-gray-50 dark:bg-gray-800 p-6 rounded-md shadow space-y-3 w-full">
          <h2 className="section-title">🔍 模擬搜尋：找潛在競爭對手</h2>
          <div className="flex gap-4 w-full">
            <input type="text" style={inputStyle} className="border rounded-md px-3 flex-grow shadow-sm focus:ring-2 focus:ring-pink-400 bg-white dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              placeholder="請輸入關鍵字" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <button style={buttonStyle} onClick={searchPages} disabled={loadingType === 'search'}
              className={`inline-flex items-center justify-center gap-2 rounded-md text-white shadow ${loadingType === 'search' ? 'bg-pink-400' : 'bg-pink-600 hover:bg-pink-700'}`}>
              {loadingType === 'search' ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>搜尋</span></>) :
                (<><Search className="w-5 h-5" /><span>搜尋</span></>)}
            </button>
          </div>
        </div>

        {/* 清除與比較 */}
        {reports.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4 justify-center text-lg">
            <button onClick={clearReports} className="flex items-center gap-2 bg-gray-400 text-white px-8 py-3 rounded-md hover:bg-gray-500 shadow">
              <Trash2 className="w-5 h-5" />清除全部
            </button>
            <button onClick={() => setShowComparison((prev) => !prev)}
              className="flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-md hover:bg-purple-700 shadow">
              <BarChart3 className="w-5 h-5" />{showComparison ? '隱藏比較圖表' : '顯示比較圖表'}
            </button>
          </div>
        )}

        {report && <EEATReport report={report} />}
        {showComparison && reports.length >= 2 && (
          <div className="bg-gray-50 dark:bg-gray-800 mt-6 p-6 rounded-md shadow">
            <h3 className="text-xl font-semibold mb-2">✅ 選擇要比較的網址：</h3>
            <ul className="mb-4 space-y-3 text-lg">
              {reports.map((r, i) => (
                <li key={i}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedIndexes.includes(i)} onChange={() => toggleIndex(i)} />
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
                      {r.url.length > 50 ? `${r.url.slice(0, 47)}...` : r.url}
                    </a>
                  </label>
                </li>
              ))}
            </ul>
            <ComparisonChart reports={selectedReports} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
