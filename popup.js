document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('logContainer');
  const clearBtn = document.getElementById('clearBtn');

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderLog(log) {
    if (!log || log.length === 0) {
      container.innerHTML = '<div class="empty">Запросов пока нет</div>';
      return;
    }

    let html = '';
    log.forEach(entry => {
      const statusClass = (entry.status >= 200 && entry.status < 400) ? 'ok' : 'err';
      const headers = ['ID заказа', 'Приоритет'];

      html += `
        <div class="log-item">
          <div class="log-meta">
            <span class="method">${entry.method}</span>
            <span class="status ${statusClass}">${entry.status}</span>
            <span class="url">${entry.url}</span>
            <span class="time">${entry.time}</span>
            ${entry.resultSize ? `<span class="badge">Всего: ${entry.resultSize}</span>` : ''}
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${(entry.shortData || []).slice(0, 20).map(row => `
                  <tr>${row.map(cell => `<td>${escapeHtml(String(cell))}</td>`).join('')}</tr>
                `).join('')}
                ${(entry.shortData && entry.shortData.length > 20) ? `<tr><td colspan="2" style="text-align:center;color:#999;">... и ещё ${entry.shortData.length - 20} строк</td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function loadLog() {
    chrome.runtime.sendMessage({ action: 'getLog' }, (response) => {
      renderLog(response.log || []);
    });
  }

  clearBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clearLog' }, () => {
      loadLog();
    });
  });

  loadLog();

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.requestLog) {
      loadLog();
    }
  });
});