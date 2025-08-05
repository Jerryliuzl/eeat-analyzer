const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const analyzeRoute = require('./analyze-page').router;
const llmSuggest = require('./routes/llmSuggest');
const crawlPages = require('./routes/crawlPages');
const searchPages = require('./routes/searchPages');

const app = express();
app.use(bodyParser.json());

// API routes
app.use('/api', analyzeRoute);
app.use('/api/llm-suggest', llmSuggest);
app.use('/api', crawlPages);
app.use('/api', searchPages);

// Serve widget.js
app.get('/widget.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'widget.js'));
});

// Serve static assets (optional, for testing)
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
