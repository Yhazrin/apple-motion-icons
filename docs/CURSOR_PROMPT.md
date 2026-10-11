# 交给 Cursor 的维护提示词

把下面整段作为新聊天的首条消息。最后一行填写这次要改的对象、页面或要登记的项目。

```text
你负责持续维护我的 GitHub 技能与交互展示站。当前 Motion Icons 源仓库是 Yhazrin/apple-motion-icons，公开演示是 https://skills.yhazrin.xyz/motion-icons/。读取本地源仓库的 docs/MAINTENANCE.md、docs/CURSOR_PROMPT.md、SKILL.md、reference/authoring.md；涉及服务器时再读取“网站管理”项目的 AGENTS.md 与 ops/motion-icons/README.md。

先看 Git 状态和实际源文件，保留其他任务的修改。GitHub 技能仓库是图标、配方与展示页的源头，Vord 资源、agent skill 目录和服务器都是副本。不要只修改副本。不要 fork 原 motion-icons.js 或 motion-icons-recipes.js；新对象或动作修改 learning 配方，保留原弹簧、480Hz 子步、取消、准确归位、描边与 reduced-motion 行为。

先明确对象的动作词汇和真实业务事件，再做图。优先实用、黑白、清晰、节制；悬浮、选择、展答案、成功、失败必须有各自意义。不要用同一种晃动充当所有反馈。成功反馈必须来自实际操作完成，失败、取消、重复结果不能冒充成功。不为密集词表的每行创建动画宿主。

更新 gallery 的中文名称、用途、分组与所有声明的动作，让人可以分别播放、停止、重置和指定姿态。交互示例的假数据必须明确标注为本地模拟。对象数量、README、SKILL、reference/learning.md 与示例保持一致。未接入应用的配方要标明，不宣称上线。

应用内优先复用原生控件、焦点和无障碍。Vord 的页面级选择通过 workspaceSelector 发布，由 RootView 放到圆角内容区上方；不要恢复多套页内模式标题。隐藏页面不发布选择器，草稿和学习状态保持。真正的 Liquid Glass 仅在支持的 macOS 上使用苹果 API；旧系统和降低透明度有实色同布局回退。

只做这次改动需要的检查。配方改变时运行现有 gallery.html?frames 并目视一个 60px 动作；不要改检查器阈值。文档/配置修改不跑全量测试。原生代码改动需要最小构建时再构建；不要新建复述实现的测试。窗口捕获失败时如实记录，不能把浏览器截图当原生验收。

使用 Vord 的 Scripts/sync_motion_icons.py 同步资源，必要时先 --dry-run；只有本次需要更新 Cursor 技能副本时加 --cursor。应用需要正常稳定身份签名、覆盖原 ~/Applications/Vord.app，不做 ad-hoc 签名、不增加重复应用图标。网站发布不等于安装应用。

用户要求上线时，只提交与推送本次公开文件到源仓库 main。网站定时器约五分钟拉取新 commit；需要立即刷新时使用网站管理项目现有 SSH 接入执行 yhazrin-motion-icons.service。配方更新不重新部署主站，不修改 DNS/证书/网络权限，不重建 Atlas。新静态文件必须更新服务器 FILES 白名单。不要输出、提交或发送 .server-access.env、SSH 密钥、API token、数据库或用户词汇。

如果增加其他 GitHub 项目的展示，先登记公开仓库、slug、分支、入口、许可证、静态白名单与版本；为新项目建立独立路由和发布目录，不能共用 motion-icons 的 current。Skills Atlas 首页的 resources.json 是生成产物，不直接手改；持久入口要在源适配器或自有项目清单里维护。

发布后比较线上 version.json 的 commit/资源摘要和源仓库，查看一个改变的交互即可。遇到失败保留当前线上版本，先查具体服务日志。长期回滚用 git revert；紧急软链接回切前停 timer，避免它又发布坏的 main，修复后恢复。

最后用简短中文说明：本次变化、真实接入位置、站点链接与 commit、应用是否已更新、实际检查范围与未验证部分。保存可用的代表截图，写入维护记录，不扩展到本次无关的页面。

本次任务：[填写具体图标、交互或 GitHub 项目，以及是否需要发布或安装应用]
```
