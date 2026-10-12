# 展示站的同步与管理

站点：[skills.yhazrin.xyz/motion-icons/](https://skills.yhazrin.xyz/motion-icons/)。
源码：[Yhazrin/apple-motion-icons](https://github.com/Yhazrin/apple-motion-icons)。
维护提示词：[CURSOR_PROMPT.md](CURSOR_PROMPT.md)。

## 哪个地方是源头

公开 GitHub 仓库是图标、动效与展示页面的唯一源头。应用资源和 Codex / Cursor 技能目录是副本，服务器也是发布副本。先修改源仓库，再同步；不要只在服务器或 Vord 的 Resources 里改一份。

| 内容 | 源文件 | 更新方式 |
| --- | --- | --- |
| 原弹簧引擎和 13 个基础对象 | assets/motion-icons.js、motion-icons-recipes.js | 保持字节不变 |
| 学习、复习、采集对象 | assets/motion-icons-learning.js | 新对象写新配方 |
| 系统、状态、文件、通讯、安全与智能对象 | assets/motion-icons-catalog.js | 在 learning 之后加载；只调用 MotionIcon.define() |
| 展示卡片与操作按钮 | assets/gallery.html | 自动枚举配方；subjects 表填写名称、用途和归属 |
| 动作序列帧板 | review/index.html 与 review/board-*.html | 由 scripts/export-frame-board.mjs 按当前配方铺出；发布白名单包含 review 下的 html / json |
| 可操作工作流 | examples/workflows.html | 只使用明确标注的本地模拟数据 |
| 原生桥接 | assets/motion-icon-host.html、examples/MotionIconView.swift | 生命周期和消息接口，不携带业务数据 |
| 技能操作方法 | SKILL.md、reference/*.md | 行为变了就同时更新 |
| 网站发布、监控、回滚 | 网站管理项目的 ops/motion-icons、deploy | 与图标代码分离，不公开凭据 |

`motion-icons-catalog.js` 的 60 个对象已在现有发布白名单和页面加载序列中。新增配方文件仍需同时更新白名单与脚本引用。

## 每次修改怎样上线

1. 读取项目的 AGENTS.md 和 skill。先看 Git 状态，保留其他任务的编辑。
2. 在源仓库修改配方和展示信息。真实应用尚未使用的对象，要标注“扩展配方”，不能宣称已经接入。
3. 本地 `python3 -m http.server 8080 --bind 127.0.0.1`，打开 `/assets/gallery.html`。修改图标时再打开 `/assets/gallery.html?frames`，沿用现有检查器看归位、姿态、错误色与 60px 关键帧；文档修改不需要完整构建。
4. 更新应用与技能副本。Vord 提供 `python3 Scripts/sync_motion_icons.py`；可先加 `--dry-run` 查看差异，只有需要同时更新 Cursor 技能时才加 `--cursor`。这个脚本不编译或安装应用，也不反向覆盖源仓库。
5. 只提交本次涉及的公开文件，推送源仓库 `main`。不要提交 build、密钥、数据库、用户单词、缓存或系统截图。
6. 服务器定时器约五分钟检查一次 main（另有最多 20 秒抖动）。只有完整下载白名单静态资源后才切换版本。应用不会因网站更新自动换图标：应用仍需正常签名构建、覆盖原安装位置。
7. 查看网页底部版本，或 `/motion-icons/version.json`，将 commit 和文件 SHA-256 与本地源比较。选择一个改变的动作看实际结果，就可以结束这次发布。

源仓库日常发布示例（文件列表按本次范围调整）：

```sh
git status --short
git diff -- assets/motion-icons-learning.js assets/gallery.html reference/learning.md examples/workflows.html
# 明确选择本次文件，不用 git add .
git add assets/motion-icons-learning.js assets/gallery.html reference/learning.md examples/workflows.html
git commit -m "Refine recall motion vocabulary"
git push origin main
```

## 自动发布实际做了什么

服务器运行 `yhazrin-motion-icons.timer` / `.service`。更新器下载公开仓库指定 commit 的静态白名单，包括 gallery、四个图标脚本、原生宿主、工作流示例及帧检查器；不执行仓库程序，不需要 GitHub token。

站点首页是 gallery 的同版本内容，部署时加入 `./assets/` 基址。服务器保存 `releases/<commit>`，`current` 指向已发布版本；version.json 记录 commit、发布时间与各静态文件摘要。网络失败保留现版，不生成半成品。

新增 CSS、图片或新的配方文件时，必须同时更新网站管理项目更新器的 FILES 白名单，再部署更新器。只在 GitHub 加文件而不更新白名单，线上会缺资源。维护说明当前通过 GitHub 链接阅读，并未镜像整个仓库。

服务器管理员可在服务器执行：

```sh
systemctl status yhazrin-motion-icons.timer --no-pager
journalctl -u yhazrin-motion-icons.service -n 30 --no-pager
sudo systemctl start yhazrin-motion-icons.service
cat /opt/1panel/www/sites/motion-icons/current/version.json
```

普通配方更新不需要重启网站、修改 Nginx、DNS 或证书。仅改路由配置时才备份配置、执行 OpenResty 配置检查再 reload。SSH 接入由网站管理项目已有部署脚本处理，不把密码或私钥粘贴到聊天和仓库。

## 新图标的管理约定

先列对象和动作：是什么、默认姿态、悬浮/选择、等待、成功、失败、退出。画图再接事件，不能先给所有状态套一个旋转图标。

对象保持 120 网格、单色圆角描边；引擎的子步、弹簧、取消令牌、准确归位、描边补偿和减弱动态效果不修改。动画不能延迟保存、焦点或页面切换；成功动作必须来自真实业务确认。不要为词表的几百行创建 WebKit 宿主。

每个对象在 reference/learning.md 记录：默认/选中姿态、每个动作、是否循环、停止方式、实际接入位置。gallery 自动列举已注册对象，但命名和用途仍需人工维护。计数、README、SKILL.md 与交互示例一起更新。

## 后续展示更多 GitHub 项目

当前自动跟踪 main 的独立演示站只有 `/motion-icons/`；Skills Atlas 首页是另一套资源目录及日常同步流程。不能假定推送任意仓库就会自动出现在首页。

每个新项目登记：公开仓库、唯一 slug、演示入口、描述、许可证、来源分支、静态资源白名单、是否已接入应用、负责人和发布版本。独立项目分别使用 `/项目-slug/`，不要复用 motion-icons 的目录、服务或软链接。为它配置同样的候选版本 → 完整性检查 → 原子切换，再加入目录入口。

在 Skills Atlas 中加入持久入口，应修改其源适配器或独立自有项目清单，不直接改自动生成的 assets/resources.json / sync-state.json；它们会被日常同步覆盖。只需要一个项目的展示变化时，不运行 Atlas 全量更新，也不重新部署主站。

应用页面应展示可用交互；说明与许可证放到下方。每个演示有自己的版本信息、停止动作和 reduced-motion 行为，不运行后台无限装饰循环。

## 回滚与常见故障

- 页面旧：先看 GitHub main 是否已推送，再看 timer / service 日志和 version.json。不要反复清整个服务器缓存。
- 本地应用旧：先确认同步和签名构建完成，覆盖原 Vord.app 后重开；网站版本不是应用版本。
- 新文件 404：检查 FILES 白名单、相对资源路径和部署 release 是否有该文件。
- 动作僵住：检查具体动作、取消令牌、隐藏时停止、目标姿态；沿用帧检查器，不放宽阈值掩盖失败。
- 需长期撤销：在源仓库使用 git revert 撤销问题提交再推送。紧急软链接回切前先停 timer，否则定时器会重新拉取有问题的 main。回切后确认 version.json；修复源仓库并发布后再启用 timer。
- 回切时只在已存在的 releases 内选版本，使用临时相对软链接后原子替换 current；不要删除历史目录或覆盖当前版本内的文件。

交付记录至少包括：改了什么、实际接入位置、commit、站点 URL、部署版本、最小检查结果、有没有更新应用，以及仍未验证的边界。不要用本地页面截图冒充线上或原生应用验收。
