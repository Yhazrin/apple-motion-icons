# 87 个图标的动作审阅与改进方案

依据：`6c33151` 的配方。用与帧板相同的虚拟 120 Hz 时钟逐帧采样 451 个动作（任务序列除外），同时记录每个动作调用了哪些弹簧。逐动作数据在 `motion-audit.json`，帧图在 `board-01.html` 至 `board-04.html`。

## 一、结论

整套图标的问题集中在四点：

1. **弹跳成了默认装饰。** 403 个一次性动作中，291 个（72%）至少调用一次 `pop` / `rebound` / `swing` / `shake`；342 个（85%）有某个通道过冲超过行程的 25%。全库 `pop` 316 次、`rebound` 142 次，过阻尼的 `settle` 只用了 23 次。200 个动作套用同一个公式：先 `snap` 反向蓄力，再 `pop` 回弹。
2. **冗余弹跳。** 60 个语义动作在结尾追加一次整体 `sq` 挤压（例如 `storage.fill`、`printer.print`、`camera.shutter`）。这一下和动作含义无关，结束后引擎还要再回弹一次。另有 33 个动作对透明度、描边进度、点亮状态这类通道使用 `pop`，结果是数值冲过 1 被截断，或者让弧线、圆点无端放大。12 个动作对同一通道连续弹两次以上。11 个失败动作先 `pop` 再 `shake`，弹了两次。
3. **幅度太小，意义不明。** 130 个一次性动作的最大位移不到 12 px（120 视框的 10%），旋转不到 15°，局部形变不到 15%，也没有路径变形。到 24 px 实际尺寸时，相当于 2 px 以内，基本看不出来。其中 53 个目录图标的 `tap` 是同一个 `tapSq`：整体均匀缩到 0.94，边缘只移动 1.6 px，在 24 px 尺寸下约 0.3 px，而且和主体本身毫无关系。11 个循环动作的位移在 6 px 以内（如 `heart.beat` 1.5 px、`pay.waiting` 2.1 px、`server.busy` 0 px）。
4. **形变与三维几乎缺席。** 三份配方里 `skew` 出现 0 次，路径重绘只有 12 处。`sq` 用的是 `around(s.sq)` 均匀缩放，等于呼吸，算不上挤压拉伸；只有 6 个图标的 `bodyAt` 做了保面积的挤压。真正的三维翻转只有 `pay.flip` 一处；`camera.switchCamera`、`calendar.next`、`mail.open` 等只是把一个轴压扁，没有透视，没有背面，也没有铰链。

## 二、统一动作语法

下面的规则全部在现有引擎内完成：只用已有的弹簧预设，所有几何变化写在各配方的 `render` 里。不改 `motion-icons.js` 和 `motion-icons-recipes.js`。

### R1 弹跳预算

- 一个一次性动作最多保留**一次**过冲重音，放在承载含义的通道上，而且要有物理原因：撞击、落地、弹簧弹出、被抓住。
- 状态切换（开关、显隐、选中）一律用 `snap`（机械接触）、`gentle`（形状变化）或 `exit`（离场）。
- `swing` 只留给真正的摆（铃、挂牌、礼物摇晃）。
- 失败动作二选一：要么是物体自己的拒绝（卡住、被推回、塞不进），要么是引擎 `shake`。不允许 `pop` 加 `shake` 叠用。

### R2 视觉通道不弹

透明度、`dash` 描边进度、点亮状态（`*On`、`*Opacity`、`fill`、`draw`、`dot`、`r0…`、`b0…`、`d0…`）只用 `fade` / `draw` / `gentle`。需要“亮起来很有力”时，让对应的几何部件做一次位移或形变，透明度只负责出现。

### R3 删除收尾挤压

语义动作结束后不再追加 `c.to('sq', …, 'impact')`。如果确实需要“接收”的感觉，在**接触那一刻**让**接收的部件**做局部挤压（见 T1），挤压本身就是落点，不再额外回弹。

### R4 幅度下限

一次性动作的主部件至少满足下列之一：

- 位移 ≥ 12 px（视框 120），
- 旋转 ≥ 15°，
- 局部形变 ≥ 15%（缩放或路径），
- 有一次清楚的路径变形。

循环动作每个周期的主运动 ≥ 8 px 或 ≥ 10°。描边或淡入可以作为补充，但不能是唯一的运动。

### R5 点按 = 主机制的预演

删掉 `tapSq`。每个图标的 `tap` 用主体最核心的机制，做 30%–40% 幅度的一次往返。例如锁的锁梁提起，文件夹的盖子掀起，开关的滑块拨动。这样点按本身就能说明“它会做什么”。

### R6 每个动作一个主角

一个动作只有一个部件负责主运动，其余部件只做跟随或二次动作，延迟 40–80 ms，幅度不超过主运动的一半。不再让五六个通道同时各弹一下（`conversation.select` 9 次，`fingerprint.accept` 7 次）。

### R7 时长

一次性动作的主运动在 450 ms 内完成。回归到姿态的时间不计入，由引擎 `settle` 负责。

## 三、形变与三维工具箱

在 `motion-icons-catalog.js`（必要时也在 `learning.js`）里加四个本地辅助函数，与现有的 `bodyAt` 同级，不进引擎。

### T1 保面积挤压与拉伸

```js
const squashAt = (part, k, cx, cy, axis = 'y') => {
  const a = Math.max(0.5, k), b = 1 / a;              // 面积守恒
  part.setAttribute('transform', axis === 'y' ? aroundXY(b, a, cx, cy) : aroundXY(a, b, cx, cy));
};
```

- 运动中沿运动方向拉长到 1.12–1.2，接触时压到 0.82–0.88，锚点设在接触面上。
- 用在下落、插入、接收、滑块和进度条帽上。

### T2 铰链透视（盖子、翻页、信封口）

```js
const hinge = (part, deg, hx, hy, depth = 10) => {    // 绕水平铰链线翻起
  const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  part.setAttribute('transform',
    `translate(${hx} ${hy}) skewX(${(depth * s).toFixed(2)}) scale(1 ${c.toFixed(3)}) translate(${-hx} ${-hy})`);
};
```

- `cos` 变负时盖子翻到铰链另一侧，表示越过了 90°。这时把盖子的内侧线条（背面）显示出来，正面隐藏。
- 用在：folder、archive、wallet、gift、mail、delete、calendar、book、recall、box 类图标。

### T3 纵轴翻转（卡片、相机、拼块）

```js
const flipY = (front, back, deg, cx, cy, depth = 10) => {
  const r = deg * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  const t = `translate(${cx} ${cy}) skewY(${(depth * s).toFixed(2)}) scale(${Math.abs(c).toFixed(3)} 1) translate(${-cx} ${-cy})`;
  front.setAttribute('transform', t); back.setAttribute('transform', t);
  front.setAttribute('opacity', c >= 0 ? 1 : 0); back.setAttribute('opacity', c < 0 ? 1 : 0);
};
```

- 角度用 `slow` 或 `gentle` 推进，不能用 `pop`：翻转过冲会让正反面来回闪。
- 用在：pay、cards、camera、key、milestone、ai-generating、calendar。

### T4 路径变形

形状本身的变化用路径插值完成，例如液面波纹、书签缺口、撕口锯齿、圆点变暂停条、叉号变重试箭头。所有插值路径的点数和命令顺序必须一致，用一个 `0…1` 通道驱动，弹簧用 `gentle`。

## 四、逐个图标的问题与改法

数字来自 `motion-audit.json`：位移按 120 视框计；“弹”指一个动作中带过冲的调用次数。

### 内置 13 个

| 图标 | 现在的问题 | 改法 |
|---|---|---|
| lock | `tap` 4.9 px、`jiggle` 9 px 太小；`deny` 是 `pop` 加 `shake` 两次弹 | `tap`：锁梁提起 8 px 再落下，用 `snap`，只有一次接触。`jiggle`：锁梁上拽 10 px 被锁舌卡住（硬停），锁体同时倾斜 6°。`unlock`：锁梁上升 20 px，再以左腿为轴向外转出，用 T3 把锁梁压到 `scaleX` −0.5，表现出转向外侧。`deny`：锁梁撞到锁舌，顶端局部压扁，然后只接 `shake` |
| refresh | 旋转幅度够；`error` 是 `pop` 加 `shake` | `error`：箭头转到 300° 时卡住，`snap` 回退 40°，箭头头部压扁。保留 `shake` 时删掉 `pop` |
| pay | `tap` / `contactless` 7–8 px；`waiting` 循环只有 2 px；`decline` 两次弹 | `contactless`：卡片向读卡方向做透视倾斜（`skewY` 10°、`scaleX` 0.85），三条波纹依次向外扩散 12 px 并淡出，波纹不弹。`waiting`：波纹持续向外传播（缩放 0.6→1.2 加淡出），代替 2 px 上下浮动。`decline`：卡片向前 8 px 后被弹回 −4 px（`snap`），然后只做 `shake`。`flip` 保留，它是全库唯一的真三维动作，可作为 T3 的参照 |
| enter | `knock` 只有 6 px，却有 4 次弹，`ax` 被连弹；`waiting` 4 px | `knock`：两下分开的敲击，每次门板在接触点局部压缩 6%，箭头前刺 10 px，每下都用 `snap`。`enter`：门用 T3 打开到 `scaleX` 0.35，箭头穿过 24 px。`denied`：门砰地关上，箭头被弹回 12 px，不用 `shake` |
| download | `tap` 7 px；`downloading` 循环 5 px；`fail` 两次弹 | `downloading`：箭头向下走 24 px 进入托盘，被裁切后从顶部重新进入，像传送带。`complete`：托盘只在接触瞬间做 T1 挤压。`fail`：箭头卡在半路（`snap` 停住），只让箭头自己 `shake` |
| send | `tap` 同时弹 3 个通道；`hover` 6 px；`fail` 是 `rebound` 加 `shake` | `tap`：纸飞机后缩 8 px、机头上扬 −12°（蓄力），一次 `snap` 回位。`hover`：飞机侧倾 ±6°、上下 ±5 px，倾斜时机翼 `scaleY` 0.85 做透视。`fail`：向前飞 20 px 撞到无形的墙，机头局部压扁到 `scaleX` 0.8，然后下坠 10 px，不用 `shake` |
| delete | 幅度足够；`tap` 弹两个通道；`restore` 弹 3 次，`itemY` 来回 4 次 | 盖子改用 T2 铰链，用 `snap`。`trash`：物体下落时 T1 拉长到 1.15，垃圾桶只在接触时挤压一次，删掉同一时刻盖子的 `pop`。`restore`：物体用 `gentle` 升起，不弹 |
| heart | `beat` 循环只有 1.5 px | `beat`：做出两段式心跳，每秒 1→1.12→1.04→1.10→1，用局部缩放。`like` 的蓄力改成 T1 的保面积挤压，代替现在的均匀缩小 |
| menu | 变形正确；用 `pop` 驱动变形会让横条转过头 | 把 `pop` 换成 `snap`；中间那条退出时横移 3 px，交代方向 |
| bell | `swing` 物理正确；`tap` 6 px、`mute` 5 px 偏小 | `tap`：摆到 12°。`mute`：铃摆一次，斜线画出的同时铃停在半路（`snap` 阻尼）。`unmute`：斜线抹去，铃摆到 14° |
| play | 播放和暂停的变形正确；`skip` 只靠透明度 | `skip`：三角形用 T1 拉长到 1.2，滑出 24 px，下一个从左侧进入 |
| volume | `tap` 2 px；`sound` 循环 3 px 却来回抖 15 次 | `sound`：每条声波向外推 6 px 并淡出，依次错开；喇叭在每次发声时前推 3 px，像纸盆。`tap`：喇叭前推 6 px，同时发出一条声波 |
| eye | `look` 9.5 px；眼睑用 `pop` 会张过头 | `look`：瞳孔移动 14 px，到两端时瞳孔 `scaleX` 0.8，模拟眼球转动的透视。`focus`：瞳孔收缩到 0.6。眼睑的开合改用 `snap` |

### 学习 14 个

| 图标 | 现在的问题 | 改法 |
|---|---|---|
| lookup | `tap` 只是透镜缩放 3 px；`fail` 是 `rebound` 加 `shake` | `tap`：放大镜朝词页移动 8 px，镜下那一行 `scaleX` 放大到 1.2，交代“放大”。`found`：镜片停住，镜下文字局部放大，不弹。`fail`：镜片撞到页边，页角卷起（T4），不用 `shake` |
| lexicon | `tap` 3 px；`saving` 循环 4 px；`fail` 用了 3 种弹 | `tap`：书签丝带被拽 8 px。`saving`：词卡被裁切着进出词本 18 px。`fail`：词卡进去 60% 后被推出来（`snap`），删掉 `rebound`、`shake` 和挤压 |
| daylight | 主要靠颜色和光线变化，位移 0–5 px；`select` 让光线角度和升起各弹一次 | `select`：太阳从地平线裁切处升起 14 px，光线伸长，不再转动加弹跳。`toNight`：太阳变月亮时，用一个阴影圆横扫 16 px 形成月牙，同时旋转 30° |
| cards | `tap` / `peek` / `remember` / `revisit` 都不到 9 px | `peek`：前卡错开 14 px、转 10°，后卡反向转。`remember`：前卡用 T3 翻面，过半时换到后面。`revisit`：卡片抬起，阴影偏移。`preparing`：每 1.2 s 洗一次牌，前卡滑出 16 px 再插到后面 |
| book | 所有动作 2–3 px；`turn` 只有淡入和变形 | `turn`：书页以书脊为轴用 T3 翻过去，过半时页面弯曲（T4）。`peek` / `select`：封面用 T2 打开。`tap`：封面掀起 10° |
| recall | `reveal` / `close` 幅度够；`tap` 3 px；`next` 用 `pop` | `tap`：盖片用 T2 掀起到 `scaleY` 0.8。`next`：卡片拉长、滑出 30 px 并淡出，不弹 |
| milestone | `tap` 3 px；`complete` 叠了挤压和 `pop` | `complete`：印章从 20 px 高处带拉伸落下，接触时 T1 挤压，纸页局部下陷，印章不再追加缩放弹跳。`restart`：纸页用 T3 翻回空白页 |
| plus | `tap` / `add` 对两条笔画各弹一次；`confirm` 只有 2 px | 加号变对勾：两条笔画各转 45° 并变短，用 `snap`。删掉“磁吸”的双弹。`reject`：加号朝叉号方向转 45° 后弹回，表示“差点关掉” |
| conversation（猫） | 20 个动作平均弹 4.2 次，`select` / `happy` 各 9 次；身体和挤压被连弹；眨眼时眼睛张过头；`talking` 循环抖 15 次 | 每个表情只保留一个重音。身体起伏用 `snap`，眨眼用 `snap`。挤压只留给 `pounce` 和 `happy`。拉开表情差异：`shy` 小而慢，`surprised` 快速向上拉长（1.15 / 0.9），`sad` 用 `gentle` 慢慢下垂。`talking` 改成按音节开合嘴巴，身体保持不动 |
| settings | `tap` 弹 3 次，`select` 弹 4 次 | 旋钮每次转过一个 30° 的档位，用 `snap`（它自带一点机械回弹，正好是“咔哒”）。删掉按压和缩放上的 `pop` |
| sentence | `reveal` 只有描边，位移 0；`fail` 是 `rebound` 加 `shake` | `reveal`：笔沿着那一行移动，笔的位置跟随描边进度，边走边写。`fail`：笔尖卡住，笔向前倾 12°，线条末端留下一个墨点，不用 `shake` |
| memory | `tap` / `peek` 3 px；`fail` 用 `shake` | `peek`：画框做透视倾斜（`skewY` 6°、`scaleX` 0.92），像凑近去看。`fail`：画框下滑 10 px、倾斜 8°，表示被搁置，不用 `shake` |
| pencil | 所有动作 ≤ 8.5 px | `write`：笔横移 28 px，留下一条描边。`select`：笔从 45° 转到书写角度 20°，并下降 8 px。`tap`：笔下压 6 px，笔尖局部压扁 |
| voice | 所有动作 ≤ 7 px；`level` 只改透明度 | `level`：声波的长度和间距随数值变化，不再只改透明度。`speaking`：话筒不动，声波向外发射。`tap`：话筒下压 6 px，同时放出一组声波 |

### 目录 60 个

这 60 个都适用三条全局修改：删掉 `tapSq`（53 个），删掉收尾的 `sq` 挤压（60 个动作），删掉视觉通道上的 `pop`（33 个动作）。下表只写各自的主改动。

| 图标 | 现在的问题 | 改法 |
|---|---|---|
| wifi | 三条弧线的点亮值被 `pop`，弧线跟着放大过头 | `connect`：弧线从圆点向外扩散，每条从半径 −8 长到原位并淡入，错开 70 ms，用 `gentle`。`disconnect`：弧线收拢进圆点，斜线画出。`tap`：最外层弧线向外推 6 px 一次 |
| bluetooth | 符号的四段笔画各被 `pop`；`nudge` 被连弹 | `enable`：符号一笔连续画出，向右偏移 8 px 一次（`snap`）。`pair`：两个小点沿符号路径移动 |
| cloud | `complete` 让对勾 `pop`，再加整体挤压 | 上传和下载时箭头被裁切着穿过云 30 px。云只在接收时局部挤压。`complete`：对勾直接画出 |
| sync | 两个箭头只做直线平移 | `syncing` / `start`：两个箭头绕中心转 180°，这才是“同步”。`conflict`：两个箭头相撞停住（`snap`），箭头尖局部压扁 |
| upload | 幅度够；`pause` / `complete` / `fail` 结尾有整体挤压 | 删掉收尾挤压。`pause`：箭头停在托盘中间，进度条分段显示 |
| battery | `tap` 2 px；`discharge` 4.5 px；`level` 只动填充 | `charge`：闪电带拉伸落入，电量同时上涨。`lowBattery`：电量降到 15%，正极头闪烁，外壳横向收窄到 0.94，像被掏空 |
| power | 竖线被 `pop` | `press`：竖线下压 8 px 插入圆弧，圆弧缺口张开 20° 再复位。`powerOn`：圆弧从竖线两侧画满。`powerOff`：圆弧收回 |
| search | `tap` 弹两次；`start` / `found` 弹 3–4 次 | `found`：放大镜停住，镜片局部放大到 1.25 一次，用 `gentle` |
| link | `copyLink` 用 `pop`；`hit` 是均匀挤压 | `connect`：两个链环各转 30° 扣在一起，交叉处用裁切做前后穿插，产生纵深。`disconnect`：两环沿拉开方向 T1 拉长，分开 12 px |
| check | 对勾画出时方框被 `pop` | 对勾落笔时方框做 T1 局部下压。`undo`：对勾倒着擦除 |
| warning | `alert` 让感叹号的点被 `pop` 加 `rebound` | `alert`：三角形侧倾 8°，感叹号的点落下砸一下，只有一次撞击。`acknowledge`：感叹号点头向下（`snap`） |
| error | `retry` 弹两次 | `appear`：先画圆，再画叉。`reject`：叉号转 90°（`snap`），只接 `shake`。`retry`：叉号变形成循环箭头（T4） |
| loading | 结尾整体挤压 | 进度帽高速移动时 T1 拉长到 1.3，到终点收回。`finish`：帽到终点、轨道填满，不挤压 |
| hourglass | `flip` 179° 正确；`start` / `finish` 只有沙粒 | 沙流做成带拉伸的细流。`tap`：倾斜 15° 再回正 |
| clock | 指针转动正确；`pause` 让小旗 `pop` | `tap`：分针跳一格 30°（`snap`）。`pause`：小旗直接画出 |
| fingerprint | 平均每动作弹 4.2 次；五条纹路各被 `pop`；`accept` 7 次 | `scan`：扫描线向下扫 40 px，经过之处的纹路依次变亮，只淡入，不弹。`accept`：纹路从中心向外依次画出，最后整体一次 `gentle`。`reject`：每条纹路左右错开 ±4 px 再复位（`snap`） |
| face-id | `recognise` 用 `pop`；`reject` 用 `rebound`；`reset` 1.6 px | `recognise`：四角向脸部收拢 8 px（`snap`），脸部线条变成微笑（T4）。`reject`：只有四角横向抖动，脸不动 |
| folder | 盖子转 43° 但没有透视；结尾整体挤压 | 盖子改用 T2，旋转同时 `scaleY` 0.6、`skewX` 10°。`insert`：纸张被裁切着落进口袋，口袋在接触时局部挤压 |
| copy | `copied` 弹 4 次 | `copy`：前一层从后一层上揭起（−10, −10），放大 1.04，阴影偏移，最多一次重音。`copied`：画出对勾，不挤压 |
| bookmark | 按压和保存都是整体均匀挤压加弹 | `press`：底部 V 形缺口变深（T4），填充从底部向上裁切出现 |
| cellular | 四根信号条的点亮值被 `pop` | `connect`：信号条以底边为锚依次从 0 长到 1，错开 60 ms，用 `gentle`。`weaken`：上面两根降到 0.2（`snap`） |
| hotspot | 三个圆环被 `pop` | `enable`：圆环从中心向外发射（缩放 0.6→1 加淡入）。`connectDevice`：设备滑入 20 px，用一个圆环连上 |
| usb | 插头 20 px 合理；圆点被 `pop` | `plug`：插头进入时接口局部撑宽到 1.08。`recognise`：圆点画出外圈。`eject`：弹出 16 px，这里有弹簧机构，保留一次 `pop` |
| server | `online` / `offline` 只有指示灯，3–6 px | `online`：三层机架依次从右侧滑入 12 px，像抽屉。`offline`：机架变暗并下沉 3 px（`gentle`）。`restart`：三层依次滑出 10 px 再回位 |
| brightness | 光线伸缩只有 4 px，`brighten` 用 `pop` | 光线长度范围加大到 0→22，八条光线绕圆依次伸出，变化过程中整体旋转 22.5°，像在拧旋钮。删掉 `pop` |
| storage | 所有动作 3–6 px，液面是平的 | `fill`：液面上涨，顶边做衰减的正弦波纹（T4）。`full`：顶盖抬起 4 px，溢出一滴。`clear`：液面带旋涡下降 |
| printer | `print` 合理；结尾机身挤压 | `printing`：机身以 20 Hz 左右横向轻微震动 1–2 px，这是有意义的机械感。纸张出纸时底边微卷（T4）。`complete`：纸落下时 T1 拉长，机身不挤压 |
| archive | 盖子 41° 无透视；结尾挤压 | 同 folder 改用 T2。文件落入时 T1 拉长 |
| clipboard | `copy` / `clear` 只有描边，3–4 px | `copy`：一张影子纸从板上向右上抬起 14 px。`clear`：线条从左到右被擦除，夹子被扯一下 |
| filter | `apply` 66 px 合理；结尾挤压 | 物件通过时漏斗颈部收窄（T4）。`adjust`：旋钮滑动 18 px |
| sort | 位移够，但几行只是直线交叉 | 交换时走弧线：在前的一行放大到 1.06，在后的缩到 0.94，产生前后层次 |
| star | 收藏是均匀缩到 0.72 再弹到 1.12；`highlight` 对 `sq` 连弹两次 | `favourite`：星形转 72°（正好一个角），填充从中心径向扩散，只有一次重音。`highlight`：四条短光芒向外射出。`unfavourite`：填充褪去，星形反转 36° |
| mail | 幅度够；信封口压扁到 0.08 就停，翻不过去 | 信封口用 T2 翻到 `scaleY` −0.6，越过上沿，成为真正的翻盖。`archive`：信封落进盒子 20 px |
| phone | `ring` 连弹 `angle`；`answer` 是 `pop` 加 `rebound` | `answer`：听筒转 135° 到拿起的姿态，同时上抬 10 px。`hangup`：转回 135° 落下。响铃保留摆动 |
| video-call | `cameraOff` / `cameraOn` 只有 2–3 px | `cameraOff`：镜头叶片合拢（T4），斜线画出。`join`：摄像机从左侧滑入 20 px。`leave`：向右滑出 |
| share | 幅度够；`close` 结尾挤压 | `share`：箭头冲出盒子 24 px，盒口张开（T4） |
| qr-scan | `detected` 用 `pop`；`rejected` 用 `rebound` | `detected`：四角向内收 6 px，框住二维码，一次 `snap`。`rejected`：扫描线闪红，四角张开 |
| wallet | 翻盖 43° 无透视；结尾挤压 | 翻盖改用 T2。卡片带轻微倾斜滑出 20 px |
| cart | 幅度够；结尾整体挤压 | `add`：物件带拉伸落进车筐，只有车筐局部挤压。`checkout`：车轮随行进转动 |
| calendar | 翻页已经压扁了一个轴，是对的方向；`addEvent` 用 `pop` | 翻页补上 T2 的 `skewX` ±10°，过半时显示较浅的背面。`addEvent`：圆点像盖章一样落下，接触时挤压 |
| receipt | `tear` 用 `pop`；`jam` 结尾挤压 | `tear`：撕口画成锯齿（T4），下半截倾斜 15°、下落 14 px |
| gift | `shake` 弹 4 次，`tilt` 和 `y` 被连弹 | `shake`：用一次 `swing` 让盒子以 ±12° 摆三下、逐次衰减，代替手写的 `pop` / `rebound` 对。`open`：盖子飞起 20 px、转 20°，加 T2 透视 |
| shield | `protect` 是 `pop` 加 `rebound` | `protect`：盾牌前推 10 px、放大 1.08，盾面轮廓变得更鼓（T4）。`alert`：倾斜 10° 一次（`snap`）。`verified`：画出对勾 |
| key | `turn` 已经在压扁钥匙柄，方向正确；`unlock` 用 `pop` | `turn`：钥匙柄用 T3 从 `scaleX` 1 转到 0.2，表示绕轴转了 90°。`unlock`：锁孔张开 |
| passcode | 四个圆点各被 `pop` | `input`：圆点从中心依次填满（淡入加 `gentle` 缩放）。`reject`：只有那一排 `shake` |
| two-factor | `verify` 5 px 加 `pop` | `verify`：验证码数字像老虎机一样被裁切着滚动，然后画出对勾 |
| permission | 滑块 48 px 合理；四个动作都有结尾挤压 | 滑块移动途中 T1 拉长到 1.25。`deny`：滑块试着移动 10 px 后被弹回（`snap`） |
| secure-connection | `establish` 只有描边，位移 0 | `establish`：两端相互靠近 8 px，连线在两者之间画出。`secure`：锁带拉伸落下，锁梁合上（T4） |
| camera | 快门叶片压扁是正确的形变，但结尾有整体挤压；`switchCamera` 压扁到 0.06 却没有背面 | `switchCamera`：机身用 T3 翻转，`skewY` ±10°，过半时镜头换到另一侧，表示前后摄像头。`focus`：镜头圈收缩，四角对焦框出现 |
| screen-recording | 动作合理 | `pause`：录制圆点变形成暂停双竖条（T4），`resume` 反向。`stop`：圆点变成方块 |
| ai-thinking | 三个节点各被 `pop`，9.5 px | `think`：节点之间依次画出连线，一个小点沿连线传递，节点本身不弹 |
| ai-browsing | `navigate` 6.7 px，`inspect` 9 px | `navigate`：内容在窗口裁切内滚动 20 px，标题比正文走得慢，形成视差。`inspect`：放大一块区域到 1.3 |
| ai-reading | `complete` 位移 0 | `complete`：几行文字收拢成一行摘要（T4），或者书页用 T3 合上 |
| ai-writing | `finish` 3 px | `finish`：光标停止闪烁，各行长度调整成对齐的段落（T4） |
| ai-coding | 所有动作 ≤ 6 px | `type`：每输入一个字符，光标跳 6 px。`execute`：括号张开 10 px，一个三角形从中间穿过。`debug`：关节处横向错开 8 px 断开。`repair`：`snap` 合回 |
| ai-tool-call | `invoke` 对 `tx` 连弹两次 | 删掉第二次 `rebound`。数据包在连线上移动时 T1 拉长 |
| ai-agent | `activate` 8.5 px，`stop` 5 px | `activate`：光环从头部扩散（0.6→1.2 加淡出），肩膀上抬 6 px。`stop`：光环收回头部 |
| ai-handoff | `acknowledge` 2.8 px | `acknowledge`：接收方点头 8 px，令牌在它手里落定一次 |
| ai-generating | 三个动作都只是描边加缩放到 0.88，≤ 5 px | `generate`：四个拼块从 12–18 px 外的散落位置、带 15° 旋转飞回原位，错开时间，用 `gentle`。`refine`：其中一块用 T3 翻面，露出打磨后的一面。`finish`：拼块之间的缝隙收拢 4 px，合成一个圆角方块（T4） |
| ai-queue | `enqueue` 9.5 px | `enqueue`：卡片带拉伸从上方滑入 20 px。`process`：卡片进入槽口时，槽口局部挤压 |

## 五、实施顺序

1. **全局清理**（机械修改，风险低）：删除 `tapSq` 与收尾 `sq`；把视觉通道上的 `pop` / `rebound` 换成 `fade` / `draw` / `gentle`；失败动作只保留一种拒绝方式；同一通道的连弹合并成一次。
2. **补幅度**：处理 130 个低于下限的一次性动作和 11 个微弱循环。先做学习 14 个，因为它们在 Vord 里最常用。
3. **形变与三维**：加入 T1–T4，先改铰链类（folder、archive、wallet、gift、mail、delete、calendar、book），再改翻转类（cards、camera、key、milestone、ai-generating），最后改路径变形（storage、bookmark、receipt、screen-recording、error、ai-reading）。
4. **猫单独做一轮**：按 R6 给每个表情只留一个重音，再逐个对照表情含义调节奏。

## 六、验收标准

用生成 `motion-audit.json` 的同一套逐帧采样复查，要求：

- 带过冲调用的一次性动作 ≤ 35%（现在是 72%）；每个动作的过冲调用 ≤ 1，`conversation` 和 `bell` 的摆动例外，但不超过 2。
- 视觉通道上的 `pop` 为 0（现在 33 个动作）；收尾 `sq` 为 0（现在 60 个动作）；`pop` 加 `shake` 的组合为 0（现在 11 个）。
- 低于 R4 下限的一次性动作为 0（现在 130 个）。
- 至少 20 个主体使用 T2 或 T3，至少 12 个主体使用 T4。
- 帧图上每个动作在 +120 ms 或 +200 ms 这一格就能看出它在做什么。
- 引擎与通用配方的哈希不变，`capture-frames.js` 全部通过。
