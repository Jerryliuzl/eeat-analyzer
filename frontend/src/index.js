import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 將渲染函式暴露到全域，供外部網站呼叫
window.renderEEATTool = function (containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`❌ 未找到容器元素: ${containerId}`);
    return;
  }

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};
