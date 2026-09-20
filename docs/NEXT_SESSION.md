# 继续工作入口

用户安排：2026-09-20 21:30 前结束；明天由用户发消息继续，禁止建立自动任务。

先读 README、ROADMAP、QA 与 git status。保留用户已认可的配色、流畅度和基本操作；优先系统补全常见菜，不把更换配菜当创新。用户点名红烧肉已经补入。

本轮目录166道（86家常/80早餐），新增66道。v0.2.0 新菜编辑源为 scripts/expand_catalog.py，生成 web/recipes.json、web/recipes.js 与 docs/expansion-sources.json。不能只运行最初的 make_recipes.py，否则会回退100道。新增步骤通过 {{食材名}} 与 {{食材名@比例}} 从清单计算用量，保留温度、尺寸、时间。

仓库：https://github.com/leijiangjiang547-arch/jintian-chi-shenme

本机根目录 E:\Codex\2026-09-20\app；仓库 outputs\jintian-chi-shenme。

- GitHub CLI：work\tools\gh\bin\gh.exe，既有登录已获用户授权。网络需要时使用进程 HTTPS_PROXY=http://127.0.0.1:7890。
- 构建：运行 work\build-local.ps1；APK 到 work\apk-build，再复制仓库 downloads 并更新 SHA256SUMS.txt。
- 签名：work\signing\cookdaily.jks 与 Windows DPAPI 加密密码位于仓库外；不要打印密码、迁移到源码或生成替代密钥。
- 验证：npm test；python scripts/verify_apk.py；可选 DOM 检查 scripts/check_ui.cjs。本机 jsdom 安装在 work\dom-qa\node_modules，可通过 NODE_PATH 指向它，无运行时依赖。
- 本轮浏览器控制连接失败（apps/browsers 为空，nodeRepl.fetch request failed），未做新版视觉/真机检查。恢复后先检查320px/393px筛选区、长菜名、详情、分步和购物清单。

下一步先收集用户新版体验，再执行 ROADMAP 第二阶段：常见菜缺口/菜系矩阵、权威来源台账、分批完整配方。小孟妈的厨房公开页面只核对到部分标题/文字摘要，未完整观看其作品，也未确认同名 B站账号全部对应关系；不能写成逐视频复刻。部分菜谱来源为相关技法，不是完整原配方。来源状态必须继续透明。

发布新版本用递增 versionCode 和新标签，保留旧发布；APK 签名一致才能覆盖安装。每次交付提供可直接下载的 GitHub Release 链接并核对远端文件 SHA256。
