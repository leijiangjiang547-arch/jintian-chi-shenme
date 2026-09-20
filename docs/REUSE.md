# 写代码前的复用评估（2026-09-20）

| 项目 | 核查内容 | 决策 |
| --- | --- | --- |
| [HowToCook](https://github.com/Anduin2017/HowToCook) | 实际克隆、检查 LICENSE、锁定提交、抽查配方用量与步骤 | 采用菜谱资料和量化表达思路；63份文档提供直接或相关技法参考，所有100道配方重新编辑 |
| [TechMitten/android-webview](https://github.com/TechMitten/android-webview) | README 的本地 assets、WebView 打包和 MIT 声明 | 借鉴轻量架构思路；原生容器自行实现，没有复制其代码，不需要整个模板依赖树 |
| [ASTRALLIBERTAD/web-app](https://github.com/ASTRALLIBERTAD/web-app) | README 结构与 WebView 生命周期说明 | 未直接采用：需要另行处理生命周期及外链边界 |
| [boby4/Meal-Planner](https://github.com/boby4/Meal-Planner) | README 列出的 Next/React、DeepSeek API、HuggingFace 数据依赖 | 未采用：此阶段固定100道菜不需要云端AI或后端；不引入未完成核查的数据集 |

## 技术取舍

纯 HTML/CSS/JavaScript + Android 系统 WebView，所有资源随 APK 分发，收藏使用 localStorage。原生层使用 HTTPS 保留源拦截本地 assets，禁止文件/内容访问、阻止远程子资源、外部教程交给系统浏览器。没有 JavaScript 原生权限桥，没有登录信息和密钥进入页面。

应用含 INTERNET 声明用于 WebView HTTPS 源；内部资源由本地拦截器提供，不发送菜谱、收藏或购物记录。第三方视频在外部浏览器内的网络行为由第三方平台决定。

## 内容修订边界

- 食材用量、火候、时间、熟透标志采用统一结构。
- 不引用上游未经核验的热量、健康疗效或夸张营养结论。
- “对应菜谱”与“相关技法”在应用中区分；不是所有100道都有完全相同的上游条目。
- 本地只保留原创插画、量化编辑文本与来源指针，没有搬运社交平台的视频和封面。
- 计时器不是自动熟度检测；程序验证不替代试吃和真机安装。

## 温度和剩饭参考

- [FoodSafety.gov 烹饪中心温度](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)
- [英国食品标准局家庭食品事实核查](https://www.gov.uk/government/publications/home-food-fact-checker)

本项目对肉类和蛋类混合菜统一采用75℃的保守操作提示；这不是声称官方对所有食材都要求同一数值。
