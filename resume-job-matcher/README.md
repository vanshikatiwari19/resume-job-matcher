# 🎯 Resume Job Matcher — Chrome Extension

AI-powered Chrome extension that analyzes your resume (PDF) and matches you to job roles, highlighting skill gaps.

---

## ✅ Setup in 3 Steps

### 1. Add Your Anthropic API Key

Open `popup.js` and replace line 7:

```js
const ANTHROPIC_API_KEY = "YOUR_API_KEY_HERE";
```

Get your key at: https://console.anthropic.com/

### 2. Load the Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `resume-job-matcher` folder

### 3. Use It

1. Click the extension icon in Chrome toolbar
2. Upload your resume PDF
3. Click **Analyze Resume**
4. View matched jobs + skill gaps
5. Click any job card to expand and see gaps
6. Export a text report with **Export Report**

---

## 📁 File Structure

```
resume-job-matcher/
├── manifest.json       # Chrome extension config
├── popup.html          # UI layout
├── popup.css           # Dark editorial styling
├── popup.js            # Logic + Claude API calls
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🔒 Privacy

All PDF processing happens via a direct call to Anthropic's API. No data is stored locally or on any server beyond Anthropic's standard API processing.

---

## 🛠 Tech Stack

- **Chrome Extension Manifest V3**
- **Anthropic Claude API** (`claude-sonnet-4-20250514`)
- **Vanilla JS / HTML / CSS** — no build step needed
- **PDF sent as base64** via Claude's document API

---

## 💡 Customization Tips

- **Change model**: Edit `model` in `popup.js` → `analyzeWithClaude()`
- **More jobs**: Edit the system prompt to request more than 5 matches
- **Salary format**: The AI infers salaries — you can adjust the prompt for different regions
