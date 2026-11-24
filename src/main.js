const decoder = new TextDecoder();
const encoder = new TextEncoder();

const defaults = {
  title: '重要日子',
  targetDate: nextMonthDate(),
  includeToday: false,
  textColor: '#17202f',
  textOpacity: 100,
  backgroundColor: '#f4f8ff',
  backgroundOpacity: 92,
  launchAtLogin: false,
  hideTaskbarIcon: true,
};

function nextMonthDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}
function isHexColor(value) { return /^#[0-9a-fA-F]{6}$/.test(String(value || '')); }
function clampPercent(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(10, Math.min(100, Math.round(n)));
}
async function configPath(app) {
  await tjs.makeDir(app.paths.data, { recursive: true });
  return app.paths.data + '/config.json';
}
async function readConfig(app) {
  try {
    const path = await configPath(app);
    const text = decoder.decode(await tjs.readFile(path));
    return { ...defaults, ...JSON.parse(text) };
  } catch (_) {
    return defaults;
  }
}
async function writeConfig(app, config) {
  const path = await configPath(app);
  const clean = {
    ...defaults,
    title: String(config.title || defaults.title).slice(0, 80),
    targetDate: String(config.targetDate || defaults.targetDate).slice(0, 10),
    includeToday: Boolean(config.includeToday),
    textColor: isHexColor(config.textColor) ? config.textColor : defaults.textColor,
    textOpacity: clampPercent(config.textOpacity, defaults.textOpacity),
    backgroundColor: isHexColor(config.backgroundColor) ? config.backgroundColor : defaults.backgroundColor,
    backgroundOpacity: clampPercent(config.backgroundOpacity, defaults.backgroundOpacity),
    launchAtLogin: Boolean(config.launchAtLogin),
    hideTaskbarIcon: config.hideTaskbarIcon !== false,
  };
  await tjs.writeFile(path, encoder.encode(JSON.stringify(clean, null, 2) + '\n'));
  return clean;
}
async function applySystemOptions(app, config) {
  try { app.presence(config.hideTaskbarIcon === false ? 'normal' : 'menubar'); } catch (_) {}
  try { await app.launchAtLogin.set(Boolean(config.launchAtLogin)); } catch (_) {}
}
function setupTray(app) {
  app.tray.set({
    title: '📅',
    tooltip: 'Countdown Widget',
    primaryAction: true,
    menu: [
      { id: 'tray:show', label: '显示倒数日' },
      { id: 'tray:settings', label: '配置…' },
      { separator: true },
      { id: 'tray:quit', label: '退出' },
    ],
  });
}
function openSettings(app) {
  app.openWindow('settings', {
    page: 'settings.html',
    title: '配置倒数日',
    size: '520x620',
    minSize: '480x560',
    parent: true,
    chrome: { frame: false, windowControls: false, acceptsFirstMouse: true },
  });
}

export const api = {
  async getConfig(_, app) { return readConfig(app); },
  async saveConfig(config, app) {
    const saved = await writeConfig(app, config || {});
    await applySystemOptions(app, saved);
    try { app.window('main').push('config-changed', saved); } catch (_) {}
    return saved;
  },
  async openSettings(_, app) { openSettings(app); return true; },
};

export async function init(app) {
  const config = await readConfig(app);
  setupTray(app);
  await applySystemOptions(app, config);
  app.setMenu([
    { title: 'Countdown', items: [
      { id: 'settings', label: '设置', key: ',' },
      { id: 'refresh', label: '刷新', key: 'r' },
    ]},
    { role: 'edit', items: [{ role: 'standard' }] },
  ]);
}
export function onMenu(id, app) {
  if (id === 'settings') openSettings(app);
  else app.push('menu', id);
}
export function onTray(id, app) {
  if (id === null || id === 'tray:show') return app.window('main').show();
  if (id === 'tray:settings') return openSettings(app);
  if (id === 'tray:quit') return app.quit();
}
