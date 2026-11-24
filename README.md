# Countdown Widget

一个 TinyJS 桌面倒数日小组件。目标是 Windows 上运行的小尺寸无边框窗口：显示事件名称、目标日期和倒数天数，并提供简单配置页面。

## Windows 运行

建议不要直接在 UNC 路径下运行 TinyJS。请先映射共享目录为盘符：

```powershell
net use Z: "\\Mac\code"
Z:
cd countdown-widget
tinyjs dev
```

或者把本目录复制到 Windows 本地目录，例如：

```powershell
Copy-Item -Recurse "\\Mac\code\countdown-widget" "$env:USERPROFILE\countdown-widget"
cd "$env:USERPROFILE\countdown-widget"
tinyjs dev
```

## 操作

- 双击小组件或点击右上角齿轮打开设置
- `Esc` 关闭设置
- 保存后配置写入 TinyJS 应用数据目录
