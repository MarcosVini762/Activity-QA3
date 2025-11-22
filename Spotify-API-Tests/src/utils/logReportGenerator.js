const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
const OUTPUT_FILE = path.join(__dirname, "../../logs/report.html");

function generateHtmlReport(logEntries) {
  const rows = logEntries
    .map((entry) => {
      return `
      <tr>
        <td>${entry.timestamp}</td>
        <td>${entry.testCase}</td>
        <td>${entry.level}</td>
        <td>${entry.message}</td>
        <td>${JSON.stringify(entry.details || {})}</td>
      </tr>`;
    })
    .join("");

  return `
  <html>
    <head>
      <title>Relatório de Logs - Testes Automatizados</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 8px; }
        th { background: #eee; }
      </style>
    </head>
    <body>
      <h1>Relatório de Logs</h1>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Test Case</th>
            <th>Nível</th>
            <th>Mensagem</th>
            <th>Detalhes</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
  </html>`;
}

function run() {
  if (!fs.existsSync(LOG_DIR)) {
    console.error(" Diretório de logs não encontrado:", LOG_DIR);
    process.exit(1);
  }

  const logFiles = fs.readdirSync(LOG_DIR).filter((f) =>
    f.endsWith(".json") || f.endsWith(".log")
  );

  if (logFiles.length === 0) {
    console.error(" Nenhum arquivo de log encontrado.");
    process.exit(1);
  }

  const entries = [];

  for (const file of logFiles) {
    const filePath = path.join(LOG_DIR, file);
    const content = fs.readFileSync(filePath, "utf8").trim();

    if (!content) continue;

    const lines = content.split("\n");

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch {}
    }
  }

  const html = generateHtmlReport(entries);

  fs.writeFileSync(OUTPUT_FILE, html, "utf8");

  console.log(" Relatório gerado em:");
  console.log(OUTPUT_FILE);
}

run();
