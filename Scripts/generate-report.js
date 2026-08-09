const fs = require("fs");
const path = require("path");

// ── Parse the JUnit XML ──────────────────────────────────────────────────────

const xmlPath = path.resolve(__dirname, "../TestResults/TestResults.xml");
const outPath = path.resolve(__dirname, "../dashboard/index.html");
const historyPath = path.resolve(__dirname, "../dashboard/history.json");

if (!fs.existsSync(xmlPath)) {
  console.error(`Could not find ${xmlPath}`);
  console.error('Run: dotnet test --logger "junit;LogFileName=TestResults.xml" first');
  process.exit(1);
}

const xml = fs.readFileSync(xmlPath, "utf8");

function attr(str, name) {
  const m = str.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : "";
}

function parseTests(xml) {
  const tests = [];
  const re = /<testcase([\s\S]*?)(?:>([\s\S]*?)<\/testcase>|\/>)/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1];
    const inner = m[2] || "";
    const errorMatch = inner.match(/<error message="([^"]*)">([\s\S]*?)<\/error>/);
    const failureMatch = inner.match(/<failure message="([^"]*)">([\s\S]*?)<\/failure>/);
    const errBlock = errorMatch || failureMatch;

    const rawMessage = errBlock
      ? errBlock[1].replace(/&#xD;&#xA;/g, "\n").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
      : null;
    const rawTrace = errBlock
      ? errBlock[2].replace(/&#xD;&#xA;/g, "\n").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim()
      : null;

    tests.push({
      classname: attr(attrs, "classname"),
      name: attr(attrs, "name"),
      time: parseFloat(attr(attrs, "time") || "0"),
      status: errBlock ? "failed" : "passed",
      message: rawMessage,
      trace: rawTrace,
    });
  }
  return tests;
}

const tests = parseTests(xml);
const totalTime = parseFloat(attr(xml.match(/<testsuites[^>]*/)?.[0] || "", "time") || "0");
const passed = tests.filter(t => t.status === "passed").length;
const failed = tests.filter(t => t.status === "failed").length;
const total = tests.length;
const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

const commitSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : "local";
const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null;

// ── Update history ────────────────────────────────────────────────────────────

let history = [];
if (fs.existsSync(historyPath)) {
  try {
    history = JSON.parse(fs.readFileSync(historyPath, "utf8"));
  } catch {
    history = [];
  }
}

history.push({
  date: new Date().toISOString(),
  sha: commitSha,
  passed,
  failed,
  total,
  passRate,
  duration: Math.round(totalTime),
});

if (history.length > 30) history = history.slice(-30);

fs.mkdirSync(path.dirname(historyPath), { recursive: true });
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
console.log(`✓ History updated (${history.length} runs recorded)`);

// ── Group tests by suite ──────────────────────────────────────────────────────

const suites = {};
for (const t of tests) {
  const parts = t.classname.split(".");
  const suite = parts[parts.length - 1];
  if (!suites[suite]) suites[suite] = [];
  suites[suite].push(t);
}

// ── Build HTML ────────────────────────────────────────────────────────────────

function formatTime(s) {
  if (s < 1) return `${Math.round(s * 1000)}ms`;
  return `${s.toFixed(2)}s`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function suiteCard(suiteName, tests) {
  const sf = tests.filter(t => t.status === "failed").length;
  const sp = tests.filter(t => t.status === "passed").length;
  const hasFailures = sf > 0;

  const rows = tests
    .sort((a, b) => (a.status === "failed" ? -1 : 1))
    .map(t => {
      const icon = t.status === "passed"
        ? `<span class="icon pass-icon">✓</span>`
        : `<span class="icon fail-icon">✗</span>`;

      const errorBlock = t.message
        ? `<div class="error-block">
            <div class="error-message">${escapeHtml(t.message.split("\n")[0])}</div>
            ${t.trace ? `<pre class="stack-trace">${escapeHtml(t.trace)}</pre>` : ""}
           </div>`
        : "";

      return `
        <div class="test-row ${t.status}">
          <div class="test-row-header">
            ${icon}
            <span class="test-name">${escapeHtml(t.name)}</span>
            <span class="test-time">${formatTime(t.time)}</span>
          </div>
          ${errorBlock}
        </div>`;
    })
    .join("");

  return `
    <div class="suite-card ${hasFailures ? "suite-has-failures" : ""}">
      <div class="suite-header">
        <span class="suite-name">${escapeHtml(suiteName)}</span>
        <div class="suite-meta">
          ${sf > 0 ? `<span class="badge badge-fail">${sf} failed</span>` : ""}
          <span class="badge badge-pass">${sp} passed</span>
          <span class="badge badge-count">${tests.length} total</span>
        </div>
      </div>
      <div class="suite-tests">${rows}</div>
    </div>`;
}

const generatedAt = new Date().toUTCString();

const suiteCards = Object.entries(suites)
  .sort(([, a], [, b]) => {
    const af = a.filter(t => t.status === "failed").length;
    const bf = b.filter(t => t.status === "failed").length;
    return bf - af;
  })
  .map(([name, tests]) => suiteCard(name, tests))
  .join("");

const historyJson = JSON.stringify(history);
const passRateColor = passRate === 100 ? "var(--pass)" : passRate >= 80 ? "var(--warn)" : "var(--fail)";

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Test Results — selenium-automation-demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #0d0f12;
      --surface:  #13161b;
      --border:   #1e2329;
      --border2:  #252b34;
      --text:     #c9d1d9;
      --muted:    #6e7681;
      --pass:     #3fb950;
      --fail:     #f85149;
      --accent:   #58a6ff;
      --warn:     #d29922;
      --mono:     'IBM Plex Mono', monospace;
      --sans:     'IBM Plex Sans', sans-serif;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      font-size: 14px;
      line-height: 1.6;
      min-height: 100vh;
    }

    .header {
      border-bottom: 1px solid var(--border);
      padding: 32px 40px 24px;
    }

    .repo-label {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    h1 {
      font-size: 22px;
      font-weight: 500;
      color: #e6edf3;
      letter-spacing: -0.3px;
    }

    .meta-line {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
    }

    .meta-line a { color: var(--accent); text-decoration: none; }
    .meta-line a:hover { text-decoration: underline; }
    .meta-sep { color: var(--border2); }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 1px;
      background: var(--border);
      border-bottom: 1px solid var(--border);
    }

    .stat {
      background: var(--surface);
      padding: 20px 24px;
    }

    .stat-label {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 300;
      letter-spacing: -1px;
      line-height: 1;
    }

    .stat-value.pass    { color: var(--pass); }
    .stat-value.fail    { color: var(--fail); }
    .stat-value.neutral { color: #e6edf3; }
    .stat-value.rate    { color: ${passRateColor}; }

    .progress-bar { height: 3px; background: var(--border); display: flex; }
    .progress-pass { background: var(--pass); width: ${passRate}%; }
    .progress-fail { background: var(--fail); flex: 1; }

    .main { padding: 32px 40px; max-width: 960px; }

    .section-label {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 16px;
    }

    .history-chart {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 40px;
    }

    .suite-card {
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .suite-card.suite-has-failures { border-color: rgba(248, 81, 73, 0.3); }

    .suite-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }

    .suite-has-failures .suite-header { background: rgba(248, 81, 73, 0.05); }

    .suite-name {
      font-family: var(--mono);
      font-size: 13px;
      font-weight: 500;
      color: #e6edf3;
    }

    .suite-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

    .badge {
      font-family: var(--mono);
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 20px;
      font-weight: 500;
      letter-spacing: 0.04em;
    }
    .badge-fail  { background: rgba(248,81,73,0.15);  color: var(--fail); border: 1px solid rgba(248,81,73,0.3); }
    .badge-pass  { background: rgba(63,185,80,0.1);   color: var(--pass); border: 1px solid rgba(63,185,80,0.2); }
    .badge-count { background: transparent; color: var(--muted); border: 1px solid var(--border2); }

    .suite-tests { background: var(--bg); }

    .test-row { border-bottom: 1px solid var(--border); }
    .test-row:last-child { border-bottom: none; }

    .test-row-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
    }

    .test-row.failed .test-row-header { background: rgba(248, 81, 73, 0.03); }

    .icon { font-size: 12px; width: 16px; flex-shrink: 0; }
    .pass-icon { color: var(--pass); }
    .fail-icon { color: var(--fail); }

    .test-name {
      flex: 1;
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text);
      word-break: break-word;
    }

    .test-row.failed .test-name { color: #ffa198; }

    .test-time {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
      flex-shrink: 0;
    }

    .error-block {
      margin: 0 16px 12px 42px;
      border-left: 2px solid rgba(248,81,73,0.4);
      padding-left: 12px;
    }

    .error-message {
      font-family: var(--mono);
      font-size: 11px;
      color: #ffa198;
      margin-bottom: 6px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .stack-trace {
      font-family: var(--mono);
      font-size: 10px;
      color: var(--muted);
      white-space: pre-wrap;
      word-break: break-word;
      max-height: 160px;
      overflow-y: auto;
      background: rgba(255,255,255,0.02);
      padding: 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .footer {
      border-top: 1px solid var(--border);
      padding: 20px 40px;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--muted);
    }

    @media (max-width: 600px) {
      .header, .main, .footer { padding-left: 16px; padding-right: 16px; }
      .stat-value { font-size: 22px; }
    }
  </style>
</head>
<body>

  <header class="header">
    <div class="repo-label">selenium-automation-demo</div>
    <h1>Test results</h1>
    <div class="meta-line">
      <span>commit <span style="color:var(--accent)">${commitSha}</span></span>
      <span class="meta-sep">·</span>
      <span>${generatedAt}</span>
      ${runUrl ? `<span class="meta-sep">·</span><a href="${runUrl}" target="_blank">view run ↗</a>` : ""}
    </div>
  </header>

  <div class="progress-bar">
    <div class="progress-pass"></div>
    <div class="progress-fail"></div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Pass rate</div>
      <div class="stat-value rate">${passRate}%</div>
    </div>
    <div class="stat">
      <div class="stat-label">Passed</div>
      <div class="stat-value pass">${passed}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Failed</div>
      <div class="stat-value fail">${failed}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total tests</div>
      <div class="stat-value neutral">${total}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Duration</div>
      <div class="stat-value neutral" style="font-size:20px">${formatTime(totalTime)}</div>
    </div>
  </div>

  <main class="main">

    <div class="section-label">Run history — last ${history.length} runs</div>
    <div class="history-chart">
      <canvas id="historyChart" height="90"></canvas>
    </div>

    <div class="section-label">Test suites — ${Object.keys(suites).length} suites</div>
    ${suiteCards}

  </main>

  <footer class="footer">
    Generated by generate-report.js · selenium-automation-demo
  </footer>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
  <script>
    const history = ${historyJson};

    const labels = history.map(r => {
      const d = new Date(r.date);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    });

    new Chart(document.getElementById("historyChart").getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Passed",
            data: history.map(r => r.passed),
            borderColor: "#3fb950",
            backgroundColor: "rgba(63,185,80,0.08)",
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: "#3fb950",
            tension: 0.3,
            fill: true,
          },
          {
            label: "Failed",
            data: history.map(r => r.failed),
            borderColor: "#f85149",
            backgroundColor: "rgba(248,81,73,0.08)",
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: "#f85149",
            tension: 0.3,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: {
              color: "#6e7681",
              font: { family: "'IBM Plex Mono', monospace", size: 11 },
              boxWidth: 12,
              padding: 16,
            }
          },
          tooltip: {
            backgroundColor: "#13161b",
            borderColor: "#1e2329",
            borderWidth: 1,
            titleColor: "#c9d1d9",
            bodyColor: "#6e7681",
            titleFont: { family: "'IBM Plex Mono', monospace", size: 11 },
            bodyFont:  { family: "'IBM Plex Mono', monospace", size: 11 },
            callbacks: {
              afterBody: (items) => {
                const r = history[items[0].dataIndex];
                return [\`pass rate: \${r.passRate}%\`, \`sha: \${r.sha}\`];
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#6e7681", font: { family: "'IBM Plex Mono', monospace", size: 10 } },
            grid:  { color: "#1e2329" }
          },
          y: {
            beginAtZero: true,
            ticks: { color: "#6e7681", font: { family: "'IBM Plex Mono', monospace", size: 10 }, stepSize: 1 },
            grid:  { color: "#1e2329" }
          }
        }
      }
    });
  </script>

</body>
</html>`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, "utf8");
console.log(`✓ Dashboard written to ${outPath}`);
console.log(`  ${passed}/${total} tests passed (${passRate}%) in ${formatTime(totalTime)}`);
