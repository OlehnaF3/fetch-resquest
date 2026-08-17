// content.js
// Внедряем скрипт inject.js на страницу (через внешний файл – обход CSP)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
  this.remove(); // удаляем после загрузки, чтобы не оставался в DOM
};
document.documentElement.prepend(script);

// Слушаем сообщения от inject.js и пересылаем в background
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.type === 'AJAX_RESPONSE') {
    chrome.runtime.sendMessage({
      type: 'response',
      ...event.data.payload
    });
  }
});