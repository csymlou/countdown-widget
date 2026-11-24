const $ = (selector) => document.querySelector(selector);

const state = { config: null, timer: null };
const el = {
  app: $('#app'), title: $('#title'), days: $('#days'), unit: $('#unit'), settingsBtn: $('#settingsBtn'),
};

function parseDate(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function startOfToday() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
function daysLeft(targetDate, includeToday) {
  const target = parseDate(targetDate);
  if (!target) return null;
  const diff = Math.ceil((target - startOfToday()) / 86400000);
  return includeToday && diff >= 0 ? diff + 1 : diff;
}
function hexToRgb(hex) {
  const value = String(hex || '#f4f8ff').replace('#', '');
  const n = Number.parseInt(value, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
function percent(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(10, Math.min(100, n));
}
function applyTheme(config) {
  el.app.style.setProperty('--text-rgb', hexToRgb(config.textColor || '#17202f'));
  el.app.style.setProperty('--text-opacity', percent(config.textOpacity, 100) / 100);
  el.app.style.setProperty('--bg-rgb', hexToRgb(config.backgroundColor || '#f4f8ff'));
  el.app.style.setProperty('--bg-opacity', percent(config.backgroundOpacity, 92) / 100);
}
function render() {
  const config = state.config;
  if (!config) return;
  applyTheme(config);
  const left = daysLeft(config.targetDate, config.includeToday);
  el.title.textContent = config.title || '重要日子';
  if (left === null) { el.days.textContent = '--'; el.unit.textContent = '天'; }
  else if (left > 0) { el.days.textContent = left; el.unit.textContent = '天'; }
  else if (left === 0) { el.days.textContent = '今'; el.unit.textContent = '天'; }
  else { el.days.textContent = Math.abs(left); el.unit.textContent = '天前'; }
}
async function boot() {
  state.config = await tiny.api.call('getConfig');
  render();
  clearInterval(state.timer);
  state.timer = setInterval(render, 60 * 1000);
}
function openSettings() {
  tiny.api.call('openSettings');
}
el.settingsBtn.addEventListener('click', openSettings);
window.addEventListener('dblclick', (event) => { if (!event.target.closest('#settingsBtn')) openSettings(); });
window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === ',') { event.preventDefault(); openSettings(); }
});
tiny.api.on('menu', async (id) => {
  if (id === 'settings') openSettings();
  if (id === 'refresh') await boot();
});
tiny.api.on('config-changed', (config) => { state.config = config; render(); });

boot().catch((error) => tiny.log(String(error)));
