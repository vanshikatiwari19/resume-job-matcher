// ═══════════════════════════════════════════
//  RESUME JOB MATCHER — popup.js
//  Uses Anthropic API + PDF.js for parsing
// ═══════════════════════════════════════════

const ANTHROPIC_API_KEY = "YOUR_API_KEY_HERE"; // Replace with your key

// ─── SCREEN MANAGER ───────────────────────
const screens = {
    upload: document.getElementById('screen-upload'),
    loading: document.getElementById('screen-loading'),
    results: document.getElementById('screen-results'),
    error: document.getElementById('screen-error'),
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ─── UPLOAD LOGIC ─────────────────────────
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFile = document.getElementById('removeFile');
const analyzeBtn = document.getElementById('analyzeBtn');

let currentFile = null;

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') setFile(file);
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) setFile(file);
});

function setFile(file) {
    currentFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatBytes(file.size);
    fileInfo.style.display = 'flex';
    analyzeBtn.disabled = false;
}

removeFile.addEventListener('click', () => {
    currentFile = null;
    fileInput.value = '';
    fileInfo.style.display = 'none';
    analyzeBtn.disabled = true;
});

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── ANALYZE ──────────────────────────────
analyzeBtn.addEventListener('click', () => {
    if (!currentFile) return;
    runAnalysis(currentFile);
});

async function runAnalysis(file) {
    showScreen('loading');
    animateSteps();

    try {
        const base64 = await fileToBase64(file);
        const result = await analyzeWithClaude(base64);
        renderResults(result);
        showScreen('results');
    } catch (err) {
        console.error(err);
        document.getElementById('errorMessage').textContent =
            err.message || 'Analysis failed. Please check your API key and try again.';
        showScreen('error');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ─── LOADING ANIMATION ────────────────────
function animateSteps() {
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const delays = [0, 1200, 2400, 3600];

    steps.forEach((id, i) => {
        const el = document.getElementById(id);
        el.classList.remove('active', 'done');
        setTimeout(() => {
            steps.slice(0, i).forEach(prev => {
                const p = document.getElementById(prev);
                p.classList.remove('active');
                p.classList.add('done');
            });
            el.classList.add('active');
        }, delays[i]);
    });
}

// ─── CLAUDE API CALL ──────────────────────
async function analyzeWithClaude(pdfBase64) {
    const systemPrompt = `You are an expert resume analyzer and career consultant.
Analyze the resume provided and return ONLY a JSON object with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "jobs": [
    {
      "title": "Job Title",
      "icon": "emoji",
      "match": 87,
      "salary": "$X–$Yk",
      "missingSkills": ["skill1", "skill2"]
    }
  ]
}

Rules:
- Extract 8-20 specific technical and soft skills from the resume
- Suggest 5 job roles ordered by match percentage (highest first)
- match is an integer 0-100 representing how well the resume fits that role
- salary is an estimated range for that role (e.g., "$80–$120k")
- icon is a single relevant emoji for the job
- missingSkills are 2-5 skills the candidate lacks for each role
- Return ONLY valid JSON, no markdown, no explanation, no backticks`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{
                role: "user",
                content: [{
                        type: "document",
                        source: {
                            type: "base64",
                            media_type: "application/pdf",
                            data: pdfBase64,
                        },
                    },
                    {
                        type: "text",
                        text: "Please analyze this resume and return the JSON object as specified.",
                    },
                ],
            }, ],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ? .message || `API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json|```/gi, '').trim();
    return JSON.parse(cleaned);
}

// ─── RENDER RESULTS ───────────────────────
function renderResults(data) {
    // Skills
    const cloud = document.getElementById('skillsCloud');
    cloud.innerHTML = '';
    document.getElementById('skillCount').textContent = data.skills ? .length || 0;

    (data.skills || []).forEach((skill, i) => {
        const tag = document.createElement('div');
        tag.className = 'skill-tag' + (i < 5 ? ' strong' : '');
        tag.textContent = skill;
        tag.style.animationDelay = `${i * 40}ms`;
        cloud.appendChild(tag);
    });

    // Jobs
    const list = document.getElementById('jobsList');
    list.innerHTML = '';

    (data.jobs || []).forEach((job, i) => {
                const matchClass = job.match >= 75 ? 'high' : job.match >= 55 ? 'mid' : 'low';
                const card = document.createElement('div');
                card.className = 'job-card';
                card.style.animationDelay = `${i * 80}ms`;

                card.innerHTML = `
      <div class="job-header">
        <div class="job-icon">${job.icon || '💼'}</div>
        <div class="job-info">
          <div class="job-title">${escapeHtml(job.title)}</div>
          <div class="job-meta">
            <span class="job-match ${matchClass}">${job.match}% match</span>
            <span class="job-salary">${escapeHtml(job.salary || '')}</span>
          </div>
        </div>
        <span class="job-chevron">▾</span>
      </div>
      <div class="match-bar-wrap">
        <div class="match-bar-track">
          <div class="match-bar-fill ${matchClass}" style="width:0%" data-width="${job.match}%"></div>
        </div>
      </div>
      <div class="job-gaps">
        <div class="gaps-label">SKILL GAPS TO CLOSE</div>
        <div class="gaps-grid">
          ${(job.missingSkills || []).map(s => `<span class="gap-tag">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>
    `;

    // Expand/collapse
    card.querySelector('.job-header').addEventListener('click', () => {
      card.classList.toggle('expanded');
    });

    list.appendChild(card);

    // Animate bar after render
    setTimeout(() => {
      const fill = card.querySelector('.match-bar-fill');
      if (fill) fill.style.width = fill.dataset.width;
    }, 100 + i * 80);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── RESET ────────────────────────────────
document.getElementById('resetBtn').addEventListener('click', resetApp);
document.getElementById('errorResetBtn').addEventListener('click', resetApp);

function resetApp() {
  currentFile = null;
  fileInput.value = '';
  fileInfo.style.display = 'none';
  analyzeBtn.disabled = true;
  showScreen('upload');
}

// ─── EXPORT REPORT ────────────────────────
document.getElementById('exportBtn').addEventListener('click', () => {
  // Gather data from DOM for a simple text report
  const skills = Array.from(document.querySelectorAll('.skill-tag')).map(t => t.textContent);
  const jobs = Array.from(document.querySelectorAll('.job-card')).map(card => {
    const title = card.querySelector('.job-title')?.textContent || '';
    const match = card.querySelector('.job-match')?.textContent || '';
    const salary = card.querySelector('.job-salary')?.textContent || '';
    const gaps = Array.from(card.querySelectorAll('.gap-tag')).map(g => g.textContent);
    return { title, match, salary, gaps };
  });

  let report = `RESUME JOB MATCH REPORT\n`;
  report += `Generated: ${new Date().toLocaleDateString()}\n`;
  report += `${'─'.repeat(40)}\n\n`;
  report += `DETECTED SKILLS (${skills.length})\n`;
  report += skills.join(', ') + '\n\n';
  report += `JOB MATCHES\n`;
  jobs.forEach(j => {
    report += `\n▸ ${j.title} — ${j.match} (${j.salary})\n`;
    if (j.gaps.length) report += `  Skill gaps: ${j.gaps.join(', ')}\n`;
  });

  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'job-match-report.txt';
  a.click();
  URL.revokeObjectURL(url);
});