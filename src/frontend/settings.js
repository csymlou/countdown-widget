const $ = (selector) => document.querySelector(selector);

let config = null;
const el = {
  previewCard: $('#previewCard'), previewTitle: $('#previewTitle'), previewDays: $('#previewDays'), previewUnit: $('#previewUnit'),
  titleInput: $('#titleInput'), dateInput: $('#dateInput'), includeToday: $('#includeToday'),
  textColorInput: $('#textColorInput'), backgroundColorInput: $('#backgroundColorInput'),
  textOpacityInput: $('#textOpacityInput'), textOpacityText: $('#textOpacityText'),
  backgroundOpacityInput: $('#backgroundOpacityInput'), backgroundOpacityText: $('#backgroundOpacityText'),
  launchAtLogin: $('#launchAtLogin'), hideTaskbarIcon: $('#hideTaskbarIcon'),
  closeBtn: $('#closeBtn'), cancelBtn: $('#cancelBtn'), saveBtn: $('#saveBtn'),
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
function readForm() {
  return {
    ...config,
    title: el.titleInput.value.trim() || '重要日子',
    targetDate: el.dateInput.value,
    includeToday: el.includeToday.checked,
    textColor: el.textColorInput.value,
    backgroundColor: el.backgroundColorInput.value,
    textOpacity: Number(el.textOpacityInput.value),
    backgroundOpacity: Number(el.backgroundOpacityInput.value),
    launchAtLogin: el.launchAtLogin.checked,
    hideTaskbarIcon: el.hideTaskbarIcon.checked,
  };
}
function fillForm() {
  el.titleInput.value = config.title || '';
  el.dateInput.value = config.targetDate || '';
  el.includeToday.checked = Boolean(config.includeToday);
  el.textColorInput.value = config.textColor || '#17202f';
  el.backgroundColorInput.value = config.backgroundColor || '#f4f8ff';
  el.textOpacityInput.value = config.textOpacity ?? 100;
  el.backgroundOpacityInput.value = config.backgroundOpacity ?? 92;
  el.launchAtLogin.checked = Boolean(config.launchAtLogin);
  el.hideTaskbarIcon.checked = config.hideTaskbarIcon !== false;
}
function renderPreview() {
  const next = readForm();
  el.textOpacityText.textContent = `${el.textOpacityInput.value}%`;
  el.backgroundOpacityText.textContent = `${el.backgroundOpacityInput.value}%`;
  el.previewCard.style.setProperty('--preview-text-rgb', hexToRgb(next.textColor));
  el.previewCard.style.setProperty('--preview-text-opacity', percent(next.textOpacity, 100) / 100);
  el.previewCard.style.setProperty('--preview-bg-rgb', hexToRgb(next.backgroundColor));
  el.previewCard.style.setProperty('--preview-bg-opacity', percent(next.backgroundOpacity, 92) / 100);
  const left = daysLeft(next.targetDate, next.includeToday);
  el.previewTitle.textContent = next.title;
  if (left === null) { el.previewDays.textContent = '--'; el.previewUnit.textContent = '天'; }
  else if (left > 0) { el.previewDays.textContent = left; el.previewUnit.textContent = '天'; }
  else if (left === 0) { el.previewDays.textContent = '今'; el.previewUnit.textContent = '天'; }
  else { el.previewDays.textContent = Math.abs(left); el.previewUnit.textContent = '天前'; }
}
async function save() {
  await tiny.api.call('saveConfig', readForm());
  tiny.win.close();
}
async function boot() {
  config = await tiny.api.call('getConfig');
  fillForm();
  renderPreview();
}

[el.titleInput, el.dateInput, el.includeToday, el.textColorInput, el.backgroundColorInput, el.textOpacityInput, el.backgroundOpacityInput, el.launchAtLogin, el.hideTaskbarIcon]
  .forEach((node) => node.addEventListener('input', renderPreview));
el.saveBtn.addEventListener('click', save);
el.cancelBtn.addEventListener('click', () => tiny.win.close());
el.closeBtn.addEventListener('click', () => tiny.win.close());
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') tiny.win.close(); });

boot().catch((error) => tiny.log(String(error)));
