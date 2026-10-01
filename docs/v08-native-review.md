# 第八版原生复制、分享与计时权限审核

审核日期：2026-10-01。修改范围：`MainActivity.java`。编译和 APK 构建由主开发统一执行；本记录不声称真机验证通过。

## 提供给前端的接口

| 调用 | 返回 `true` 的含义 | 返回 `false` 的情况 |
| --- | --- | --- |
| `Kitchen.copyText(text)` | 文本已交给系统剪贴板 | 空内容、超过 50,000 个 UTF-16 字符、非受信前台页面、服务不可用、系统拒绝或执行未完成 |
| `Kitchen.shareText(text)` | 已发起系统分享选择页面 | 同上；没有系统分享入口时给出复制后自行粘贴的提示 |

前端只能在明确的“复制清单”“分享清单”点击事件中调用；不得在加载、刷新、恢复状态或计时回调中自动调用。取消分享不会发送内容，`true` 也不表示分享完成。未配置应用包名、联系人、邮箱地址或发送回执，不读取原有剪贴板，不新增权限。

桥接方法由 WebView 私有后台线程调用，剪贴板写入、URL 检查和 Activity 启动均通过 `runOnUiThread` 执行。`FutureTask` 将实际操作结果返回给 JavaScript，等待上限为两秒；超时会取消尚未执行的任务。操作不依赖联网、文件存储或应用清单查询。

前台检查要求 Activity 仍存活且有窗口焦点，WebView 当前主页面必须位于 `https://appassets.androidplatform.net` 的默认 HTTPS 端口且无用户信息。这个检查不能识别调用的具体 iframe；现有 WebView 拦截外部内容、外链走系统 Activity，HTML CSP 也使用 `frame-src 'none'`，共同保证桥只供随 APK 打包的内容使用。

系统分享页面自身存在但没有匹配接收应用时，由系统显示空状态；不使用可能因 Android 应用可见性限制而误判的 `resolveActivity` 查询。若分享选择 Activity 本身缺失，捕获 `ActivityNotFoundException` 后提示用户复制。系统拒绝操作时捕获异常并返回 `false`。

Android 13 及以上会提供系统复制提示，原生端没有额外的成功 toast；前端可显示自己的简短反馈，应避免反复弹出提示。原生端仅对失败提供说明。

## 计时权限核对

- `KitchenTimer.start` 已在精确闹钟或通知不可用时返回 `foreground`，未承诺后台提醒；受系统拒绝时同样降级。
- Android 13 首次允许通知通过现有 `notificationSettings()` 请求；精确闹钟单独进入系统设置，不能只开其中一个就承诺后台提醒。
- 已经开始的 `foreground` 计时在授权返回后不会自动变成系统闹钟。主开发已补首次缺权限说明及设置入口，明确授权后需重新开始计时，也可交给系统时钟；不能将“权限就绪”误显示为“当前计时已安排系统提醒”。
- 当前恢复逻辑会核对系统计时的活动/触发状态；手机重启、强行停止仍需重新开始。通知声音仍受用户音量、勿扰与系统设置影响。

## 核对依据与验证边界

已读取 Android 官方说明：[纯文本剪贴板](https://developer.android.com/develop/ui/views/touch-and-input/copy-paste)、[系统分享选择页面](https://developer.android.com/develop/ui/compose/sharing/send)、[WebView 原生桥线程及 iframe 限制](https://developer.android.com/reference/android/webkit/WebView#addJavascriptInterface(java.lang.Object,%20java.lang.String))、[应用可见性与 Activity 启动](https://developer.android.com/training/package-visibility/use-cases)。采用系统 `ClipData.newPlainText` 与 `ACTION_SEND + text/plain + Intent.createChooser`；没有自制接收应用列表。

已静态核对两个 `@JavascriptInterface` 方法的布尔接口、文字长度限制、受信前台检查、UI 线程调度及异常路径；`git diff --check` 未发现空白错误。尚未进行实际设备复制/取消分享测试，也没有模拟 OEM 系统拒绝情形。

真机验收重点：中文及换行是否完整复制；点分享后取消是否保留清单与勾选；返回应用是否恢复原页面；首次拒绝计时权限是否明确保持前台模式；打开两个权限后重新计时，锁屏时是否收到系统提醒。
