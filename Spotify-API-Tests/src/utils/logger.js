const fs = require("fs");
const path = require("path");

const LOG_PATH = path.join(__dirname, "../../logs/test-execution.log");

// Garante que a pasta existe
if (!fs.existsSync(path.dirname(LOG_PATH))) {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
}

function writeLog(entry) {
    const logLine = JSON.stringify({
        timestamp: new Date().toISOString(),
        ...entry
    }) + "\n";

    fs.appendFileSync(LOG_PATH, logLine);

    console.log(`[${entry.level}] ${entry.testCase} - ${entry.action}`, entry.details || "");
}

module.exports = {
    info: (testCase, action, details = {}) =>
        writeLog({ level: "INFO", testCase, action, details }),

    success: (testCase, action, details = {}) =>
        writeLog({ level: "SUCCESS", testCase, action, details }),

    error: (testCase, action, details = {}) =>
        writeLog({ level: "ERROR", testCase, action, details }),

    metric: (testCase, metricName, value) =>
        writeLog({ level: "METRIC", testCase, action: metricName, value })
};
