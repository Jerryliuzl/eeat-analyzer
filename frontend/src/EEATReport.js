import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // ✅ Loading Spinner

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function SuggestionModal({ data, onClose }) {
  if (!data || typeof data !== 'object') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto border border-gray-300">
        <h2 className="text-2xl font-bold text-green-700 mb-4">🤖 LLM 建議摘要</h2>

        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-6 shadow-sm">
          <p className="text-gray-800 text-sm whitespace-pre-wrap">{data.summary}</p>
        </div>

        {Array.isArray(data.details) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">📌 詳細建議</h3>
            {data.details.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-gray-200 bg-gray-50 shadow transition duration-200"
              >
                <div className="text-base font-bold mb-1 text-blue-800">
                  {item.area === 'Experience' && '📘 '}
                  {item.area === 'Expertise' && '🎓 '}
                  {item.area === 'Authoritativeness' && '🏛️ '}
                  {item.area === 'Trustworthiness' && '🔒 '}
                  {item.area}（{item.score} 分）
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.note}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}

function EEATReport({ report }) {
  const [llmSuggestion, setLlmSuggestion] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingLLM, setLoadingLLM] = useState(false); // ✅ Loading 狀態

  useEffect(() => {
    setShowModal(false); // 🔁 每次收到新報告，自動關掉 modal
  }, [report]);

  if (!report) return null;

  const { title, url, scores, totalScore, suggestions = [] } = report;

  const radarData = {
    labels: ['Experience', 'Expertise', 'Authoritativeness', 'Trustworthiness'],
    datasets: [
      {
        label: 'E-E-A-T 分數',
        data: [
          Number(scores.experience) || 0,
          Number(scores.expertise) || 0,
          Number(scores.authoritativeness) || 0,
          Number(scores.trustworthiness) || 0,
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const radarOptions = {
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          color: '#666',
          backdropColor: 'transparent',
        },
        pointLabels: {
          font: { size: 12 },
          color: '#333',
        },
        grid: { color: '#ccc' },
      },
    },
  };

  const fetchLLMSuggestion = async () => {
    setLoadingLLM(true);
    setShowModal(false);

    try {
      const res = await fetch('/api/llm-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ LLM API failed:', errorText);
        alert('LLM 建議回傳失敗，請檢查後端伺服器');
        return;
      }

      const data = await res.json();
      setLlmSuggestion(data.suggestion);
      setShowModal(true);
    } catch (err) {
      console.error('❌ Network or JSON error:', err);
      alert('LLM API 發生錯誤');
    } finally {
      setLoadingLLM(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow-lg mt-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">E-E-A-T 健檢報告</h2>
      <p><strong>網頁標題：</strong>{title || '未提供'}</p>
      <p>
        <strong>網址：</strong>
        <a
          href={url}
          className="text-blue-600 underline"
          target="_blank"
          rel="noreferrer"
          title={url}
        >
          {url.length > 50 ? url.slice(0, 47) + '...' : url}
        </a>
      </p>
      <p className="mt-2"><strong>總分：</strong>{totalScore} / 20</p>

      <div className="mt-4 flex justify-center">
        <div style={{ width: '400px', height: '400px' }}>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700">
        <ul>
          <li>📘 Experience: {scores.experience}</li>
          <li>🎓 Expertise: {scores.expertise}</li>
          <li>🏛️ Authoritativeness: {scores.authoritativeness}</li>
          <li>🔒 Trustworthiness: {scores.trustworthiness}</li>
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">🔧 改進建議：</h3>
        {suggestions.length > 0 ? (
          <ul className="list-disc ml-6">
            {suggestions.map((s, i) => (
              <li key={i} className="mb-2">
                {typeof s === 'string' ? s : (
                  <>
                    <div><strong>{s.message}</strong></div>
                    <div className="text-sm text-gray-500">💡 {s.action}</div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">此頁面表現良好，暫無建議</p>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={fetchLLMSuggestion}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          disabled={loadingLLM}
        >
          {loadingLLM && <Loader2 className="animate-spin" />}
          🤖 啟用 LLM 進階建議
        </button>
      </div>

      {showModal && (
        <SuggestionModal data={llmSuggestion} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default EEATReport;
