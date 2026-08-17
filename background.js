
let requestLog = [];

// Сохраняем лог в storage
function saveLog() {
  chrome.storage.local.set({ requestLog });
}

// Добавляем запись с обрезанными данными (первые 9 полей)
function addLogEntry(entry) {
	if (!entry.url.includes('/api/data/flexView/so.SO_H')) {
    return; // игнорируем все остальные запросы
  }
  let shortData = null;
  let resultSize = null;
  let summary = null;

  // Пытаемся распарсить JSON и извлечь data
  try {
    const parsed = JSON.parse(entry.responseBody);
    if (parsed.data && Array.isArray(parsed.data)) {
      shortData = parsed.data.map(row => [row[0], row[8]]); // только первые 9 полей
      resultSize = parsed.resultSize || parsed.data.length;
      summary = parsed.summaryRows || null;
    }
  } catch (e) {
    // Не JSON – оставляем как есть
  }

  const logEntry = {
    url: entry.url,
    method: entry.method,
    status: entry.status,
    time: entry.timestamp || new Date().toISOString(),
    shortData: shortData,       // обрезанные данные
    resultSize: resultSize,
    summary: summary,
    fullBody: entry.responseBody // опционально, но можем не хранить, чтобы экономить место
  };

  requestLog.unshift(logEntry);
  if (requestLog.length > 100) requestLog.pop();
  saveLog();
  console.log('[Logger]', logEntry.method, logEntry.url, logEntry.status, shortData ? `(${shortData.length} строк)` : '');
}

// Принимаем сообщения от content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'response') {
    addLogEntry(message);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'clearLog') {
    requestLog = [];
    saveLog();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'getLog') {
    sendResponse({ log: requestLog });
    return true;
  }
});