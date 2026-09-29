# 第四版实现与验证边界

## 平台依据（2026-09-29）

- [Android精确计时](https://developer.android.com/develop/background-work/services/alarms)：用户主动开始的步骤提醒使用 AlarmManager，使用 PendingIntent 接收而不依赖页面进程；计时基于 elapsedRealtime，避免系统时钟调整改变原生剩余时间。
- [精确计时授权](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)：SCHEDULE_EXACT_ALARM 不假定默认授权；先检查，再引导用户按需开启。
- [通知权限](https://developer.android.com/develop/ui/views/notifications/notification-permission)、[通知渠道](https://developer.android.com/develop/ui/views/notifications/channels)：系统计时前检查通知与渠道是否开启。渠道使用闹钟音频用途，是否发声仍受用户设置影响。
- [持久后台任务](https://developer.android.com/develop/background-work/background-tasks/persistent)：不以 WorkManager 承担秒级步骤计时，不增加常驻服务。
- [系统时钟](https://developer.android.com/reference/android/provider/AlarmClock)：ACTION_SET_TIMER，EXTRA_SKIP_UI=false，用户在时钟中核对；从此计时由时钟应用管理。
- [系统文件选择器](https://developer.android.com/training/data-storage/shared/documents-files)：导出使用 ACTION_CREATE_DOCUMENT，导入使用 ACTION_OPEN_DOCUMENT，无广泛存储权限，读写限用户选择的文件。
- [pypinyin](https://github.com/mozillazg/python-pinyin)：仅构建时生成菜名/别名首字母索引，固定0.55.0；运行时无依赖，MIT许可存于licenses。

## 安全与数据

原生JavaScript桥只供内置页面使用。主框架及资源只允许保留的本地HTTPS域名，其他资源请求阻断；CSP禁止iframe、远程脚本、网络连接、对象和表单。外部教程保持在系统浏览器，不在带有原生桥的WebView中浏览。备份只解析JSON白名单数据，不导入页面代码或菜谱，大小上限1MB；失败恢复旧键值，不导入计时。

R8 release模式，保留Manifest组件和JavascriptInterface方法/注解，禁WebView远程调试。APK不是debuggable；混淆不等于版权保护，也不能替代审计。

本地计时只支持一个；替换前确认。终止/替换取消旧PendingIntent和通知，已在途旧广播检查新结束时间。权限失效显示降级，手机重启使原生计时取消；不在重启后自动补发做菜提醒。未申请绕过勿扰或全屏通知权限。

## 检查

`npm test` 18项；`scripts/check_ui.cjs`覆盖174道详情和操作；`scripts/check_v04.cjs`使用模拟Kitchen桥检查UI状态、备份/拒绝无效文件、清单、触控锁与连点、计时降级。模拟测试不证明安卓系统一定触发提醒。APK脚本验证打包资产及证书另行比对。当前无手机或模拟器实测。
