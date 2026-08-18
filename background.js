let requestLog = [];

function saveLog() {
  chrome.storage.local.set({ requestLog });
}

function addLogEntry(entry) {
  // Фильтр: только нужный эндпоинт
  if (!entry.url.includes('/api/data/flexView/so.SO_H')) {
    return;
  }

  let shortData = null;
  let resultSize = null;
  const columns = entry.columns || [];
  const pageSize = entry.pageSize || null; // из запроса

  try {
    const parsed = JSON.parse(entry.responseBody);
    if (parsed.data && Array.isArray(parsed.data)) {
      const data = parsed.data;
      const totalRows = data.length;

      // Определяем индексы нужных полей
      let idIndex = columns.indexOf('soh.id');
      let pickPriorityIndex = columns.indexOf('soh.pickPriority');

      // Если не нашли – используем индексы по умолчанию (0 и 8)
      if (idIndex === -1) idIndex = 0;
      if (pickPriorityIndex === -1) pickPriorityIndex = 8;

      // Формируем строки с нумерацией: №, ID, Приоритет
      shortData = data.map((row, index) => {
        const rowNumber = index + 1; // всегда нумеруем по порядку
        const id = row[idIndex] !== undefined ? row[idIndex] : '';
        const priority = row[pickPriorityIndex] !== undefined ? row[pickPriorityIndex] : '';
        return [rowNumber, id, priority];
      });

      resultSize = parsed.resultSize || totalRows;
    }
  } catch (e) {
    console.warn('Не удалось распарсить ответ:', e);
  }

  const logEntry = {
    url: entry.url,
    method: entry.method,
    status: entry.status,
    time: entry.timestamp || new Date().toISOString(),
    shortData: shortData,
    resultSize: resultSize,
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