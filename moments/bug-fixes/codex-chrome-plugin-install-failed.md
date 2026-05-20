---
date: "2026-05-20 22:30"
location: "Windows / Codex Desktop / Chrome"
images: []
---

# Codex Chrome 插件安装失败排障记录

## 现象

用户反馈 Codex 的 Chrome 插件安装失败，无法正常使用 Codex 控制 Chrome。

## 排查过程

1. 查看 Codex 本地目录 `C:\Users\Cloud\.codex`，确认存在 `plugins`、`cache`、`config.toml`、日志和状态数据库。
2. 查看 `C:\Users\Cloud\.codex\plugins`，发现只看到缓存目录，最初判断 Chrome 插件可能没有完整启用。
3. 搜索本地插件缓存，发现 Chrome 插件包实际存在于：
   - `C:\Users\Cloud\.codex\plugins\cache\openai-bundled\chrome\0.1.7`
   - `C:\Users\Cloud\.codex\.tmp\bundled-marketplaces\openai-bundled\plugins\chrome`
4. 查看 `C:\Users\Cloud\.codex\config.toml`，发现已启用 `browser@openai-bundled`，但没有启用 `chrome@openai-bundled`。
5. 运行 Chrome 插件自带检查脚本，确认 Chrome 侧状态：
   - Chrome 已安装：`C:\Program Files\Google\Chrome\Application\chrome.exe`
   - Chrome 正在运行
   - Codex Chrome Extension 已安装并启用
   - 扩展 ID：`hehggadaopoacecdllhhajmbjkdcmajg`
   - Native Messaging Host 注册正确
   - manifest 路径：`C:\Users\Cloud\AppData\Local\OpenAI\extension\com.openai.codexextension.json`
6. 继续检查配置，定位到直接原因：
   - `config.toml` 中存在 `[tool_suggest]`
   - `disabled_tools = [{ type = "plugin", id = "chrome@openai-bundled" }]`
   - 也就是 Chrome 插件被 Codex 配置显式禁用了。
7. 检查 Chrome 插件缓存目录，发现 `0.1.7` 目录缺少 `.codex-plugin` 和 `assets`，缓存不完整。

## 根因

主要原因有两个：

1. `chrome@openai-bundled` 被写入 `disabled_tools`，导致 Codex 不加载 Chrome 插件。
2. Chrome 插件缓存目录不完整，缺少插件元数据和资源文件。

## 修复动作

1. 修改 `C:\Users\Cloud\.codex\config.toml`：

```toml
[plugins."chrome@openai-bundled"]
enabled = true

[tool_suggest]
disabled_tools = []
```

2. 从 bundled marketplace 复制缺失文件到插件缓存：

```powershell
$src='C:\Users\Cloud\.codex\.tmp\bundled-marketplaces\openai-bundled\plugins\chrome'
$dst='C:\Users\Cloud\.codex\plugins\cache\openai-bundled\chrome\0.1.7'
Copy-Item -LiteralPath (Join-Path $src '.codex-plugin') -Destination $dst -Recurse -Force
Copy-Item -LiteralPath (Join-Path $src 'assets') -Destination $dst -Recurse -Force
```

## 验证结果

修复后验证通过：

- `config.toml` 已包含 `[plugins."chrome@openai-bundled"]`
- `disabled_tools = []`
- `C:\Users\Cloud\.codex\plugins\cache\openai-bundled\chrome\0.1.7\.codex-plugin\plugin.json` 已存在
- Codex Chrome Extension 状态：installed、registered、enabled
- Native Messaging Host 状态：correct

## 后续操作

需要重启 Codex 桌面应用。当前会话的工具列表不会动态刷新，重启后 Codex 才会重新加载 `chrome@openai-bundled` 插件。

## 经验

Codex 插件安装失败时，优先检查三处：

1. `C:\Users\Cloud\.codex\config.toml` 是否启用插件，同时没有出现在 `disabled_tools`。
2. `C:\Users\Cloud\.codex\plugins\cache` 中插件缓存是否完整。
3. Chrome 扩展和 Native Messaging Host 是否都处于正确状态。
