import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ComparisonChart({ reports }) {
  if (!Array.isArray(reports) || reports.length === 0) return null;

  const filtered = reports.filter(r => r?.url && r?.scores);
  if (filtered.length === 0) return null;

  const sortedReports = [...filtered].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  const fullTitles = sortedReports.map(r => r.title || r.url);

  // ✅ 智能斷行
  const formatLabel = (text) => {
  if (!text) return '';
  if (text.length <= 15) return text;

  // ✅ 先把中英文逗號後換行
  let modifiedText = text.replace(/[,，]\s*/g, '$&\n');

  // 再用空格、- 分段
  const words = modifiedText.split(/[\s\-]/);
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > 15) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += ` ${word}`;
    }
  });
  if (currentLine) lines.push(currentLine.trim());

  // 限制最多 2 行
  let finalText = lines.slice(0, 2).join(' ');

  // ✅ 如果還是太長 → 每 15 字插入換行
  if (finalText.length > 14) {
    finalText = finalText.replace(/(.{14})/g, '$1\n');
  }

  return finalText;
};


  const labels = sortedReports.map(r => {
    let name = r.title || '';
    if (!name && r.url) {
      try {
        const u = new URL(r.url);
        name = decodeURIComponent(u.pathname.split('/').pop());
      } catch {
        name = r.url || '(無效網址)';
      }
    }
    return formatLabel(name);
  });

  const buildDataset = (label, color, key) => ({
    label,
    data: sortedReports.map(r => r.scores?.[key] ?? 0),
    backgroundColor: color,
    borderWidth: 1
  });

  const data = {
    labels,
    datasets: [
      buildDataset('Experience', '#60a5fa', 'experience'),
      buildDataset('Expertise', '#34d399', 'expertise'),
      buildDataset('Authoritativeness', '#fbbf24', 'authoritativeness'),
      buildDataset('Trustworthiness', '#f87171', 'trustworthiness'),
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 } } },
      title: { display: true, text: 'E-E-A-T 多網站比較分析', font: { size: 18 } },
      tooltip: {
        callbacks: {
          title: (context) => fullTitles[context[0].dataIndex] || ''
        }
      }
    },
    scales: {
      x: {
        ticks: {
          callback: function(value) {
          const label = this.getLabelForValue(value);
          // 如果含有換行符就多行顯示，沒有就保持旋轉
          return label.includes('\n') 
            ? label.split('\n') 
            : label.split(/[,，]/);

        },
          font: { size: 12 },
          minRotation: 45, // 最小旋轉角度
          maxRotation: 60
        },
        barPercentage: 0.8
      },
      y: {
        min: 0,
        max: 5,
        ticks: { stepSize: 1, font: { size: 12 } }
      }
    }
  };

  return (
    <div className="my-8">
      <h2 className="text-xl font-bold mb-4">📊 多網站 E-E-A-T 比較圖</h2>
      <div style={{ width: '100%', maxWidth: '950px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default ComparisonChart;
