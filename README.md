# 🎲 MATOOL-Plugin

墨安游戏助手 - MATOOL-Plugin

![ljhx2.png](https://raw.gitcode.com/user-images/assets/5424764/be7eaf0c-76b9-40dc-9e5f-dc47ebfadb8b/ljhx2.png 'ljhx2.png')
****
## 😍插件介绍：
**本插件基于墨安游戏助手（MoAn Game Assistant）开发**，提供抽卡分析、云端抽卡记录导入/导出/拉取/上传等功能，数据存取均通过墨安助手 API。

**【抽卡分析】** `#分析[uid]` 直接请求墨安服务器生成分析图片，无需 Key、插件不做二次数据处理。

**【导入/导出/拉取】** 每个 QQ 用户通过 `#墨安绑定[key]` 绑定自己的 Key 后，即可使用 `#导出[uid]记录` / `#导入[uid]记录` / `#拉取[uid]云端记录` / 发送抽卡链接自动导入（按 QQ 验证 Key，未绑定会提示先绑定）。

**【拉取云端】** `#拉取[uid]云端记录`（原神）/ `*拉取[uid]云端记录`（星铁）：发送抽卡链接验证归属后，从墨安云端拉取该 UID 全部记录，按卡池拆分写入发送者 QQ 对应的本地目录（`data/gachaJson/{QQ}/{uid}/{卡池}.json`、`data/srJson/{QQ}/{uid}/{卡池}.json`），与 genshin-plugin/miao-plugin 存储格式一致，**genshin/miao 可直接识别归属并使用**（已存在记录自动合并去重）。Key 归属全功能统一：**个人 Key 优先**，公用模式开启时未绑定用户走公用 Key。

**【上传云端】** 将本地其他插件（如 genshin-plugin）保存的抽卡记录上传到墨安云端：`#128814012记录上传云端`（原神）/ `*102264384记录上传云端`（星铁）。仅能上传发送命令用户自己的记录（按本地目录归属校验）。Key 归属：用户绑定了个人 Key → 上传到个人账号；否则公用模式开启时上传到公用账号。`#全部记录上传云端`（仅主人）把本地全部原神+星铁记录上传到公用账号。

**【UIGF 版本支持】** 导入支持 **UIGF v2.2**（扁平 `list` 格式）与 **UIGF v4.2**（`hk4e`/`hkrpg`/`nap` 分区格式），其他版本会提示不支持；导出默认 **UIGF v4.2**，命令后加 `v22` 可导出 **v2.2**（如 `#导出128814012记录 v22`，服务器双版本输出）。

**【链接解析开关】** 本插件优先级较高，主人可用 `#禁用链接解析` / `#启用链接解析` 控制是否接管抽卡链接自动解析，避免抢占其他插件。

****

## 😒安装插件：
<details>
  <summary>展开/收起</summary>

**GitHub：**

```bash
git clone --depth=1 https://github.com/Muoan/MATOOL-Plugin.git ./plugins/MATOOL-Plugin/
```

****

**Gitee：**

```bash
git clone --depth=1 https://gitee.com/muoan/MATOOL-Plugin.git ./plugins/MATOOL-Plugin/
```

****

**GitCode：**

```bash
git clone --depth=1 https://gitcode.com/muoan/MATOOL-Plugin.git ./plugins/MATOOL-Plugin/
```

</details>

****

## 😁安装依赖：
```bash
pnpm i
pnpm install --filter=MATOOL-Plugin
```

****

## 😘功能介绍
<details>
<summary>展开/收起</summary>

| 功能名称 | 功能命令 | 功能讲解 |
| --- | --- | --- |
| 帮助 | `#墨安帮助` | 查看本帮助 |
| 版本 | `#墨安版本` | 查看版本号与更新日志 |
| 抽卡分析 | `#分析[uid]` | 原神抽卡分析图（`#` 原神 / `*` 星铁 / `%` 绝区零），**无需 Key，直接出图** |
| 抽卡记录 | `#抽卡[uid]` | 文字版抽卡记录 |
| 绑定Key | `#墨安绑定[key]` | **所有用户**绑定自己的 Key（按 QQ 存储，如 `#墨安绑定mo-123456786`） |
| Key获取 | `#墨安key获取` | 官网/注册/Key 获取方法说明 |
| 设置公用Key | `#墨安设置公用[key]` | **仅主人**：保存公用 Key（不自动开启，需 `#墨安切换公用模式` 启用） |
| 切换公用模式 | `#墨安切换公用模式` | **仅主人**：启用公用模式（需已设置公用 Key） |
| 切换个人模式 | `#墨安切换个人模式` | **仅主人**：关闭公用模式（保留公用 Key，可随时切回） |
| 导出记录 | `#导出[UID]记录` | 导出 UIGF JSON 文件（命令后加 `v22` 可导出 v2.2，**需先绑定 Key**） |
| 导入记录 | `#导入[UID]记录` | 导入抽卡记录（**需先绑定 Key**） |
| 拉取云端 | `#拉取[UID]云端记录` | 云端记录拉取写入本地 genshin/miao 目录（个人 Key 优先；发送链接验证归属） |
| 上传记录 | `#上传[UID]云端` | 上传本地抽卡记录到云端（个人 Key 优先；仅限本地其他插件如 genshin-plugin 保存的记录） |
| 全部上传 | `#全部记录上传云端` | **仅主人**：本地全部原神+星铁记录上传到公用 Key 账号 |
| 链接自动导入 | 发送抽卡链接 | 自动解析米游社 authkey 并导入（需绑定 Key） |
| 禁用链接解析 | `#禁用链接解析` | **仅主人**：关闭链接自动解析，不抢占其他插件 |
| 启用链接解析 | `#启用链接解析` | **仅主人**：重新开启链接自动解析 |
| 插件更新 | `#墨安更新` | 拉取插件更新（仅主人） |

> **游戏符号：** `#` 原神 / `*` 星穹铁道 / `%` 绝区零
>
> **TRSS-Yunzai 用户注意：** `*` 和 `%` 会被自动替换为 `#星铁` / `#绝区零`，命令示例：
> - `*分析UID` → `#星铁分析UID`（星铁抽卡分析）
> - `*导出UID记录` → `#星铁导出UID记录`（星铁导出）
> - `%导出UID记录` → `#绝区零导出UID记录`（绝区零导出）
> - `*拉取UID云端记录` → `#星铁拉取UID云端记录`（星铁拉取）
> - `#拉取128814012云端记录` → 原神拉取；`*拉取102264384云端记录` → 星铁拉取
> - `*128814012记录上传云端` → `#星铁128814012记录上传云端`（星铁上传）

</details>

****

## 😂更新：
**在云崽Bot中发送 `#墨安更新` 或在目录执行 `git pull`**

**PS：遇到无法更新或错误提示可使用 `#墨安强制更新`**

****

## 😜交流：
**QQ群：[872488071](https://qm.qq.com/q/SA5dEJf6MM)**

**云崽论坛：[Yunzai论坛/文档](https://yzai.top)**

****

## 😊友情链接：
[Miao-Yunzai](https://gitee.com/yoimiya-kokomi/Miao-Yunzai)😠
[TRSS-Yunzai](https://gitee.com/TimeRainStarSky/Yunzai)

**API提供者：[record.muoan.com](https://record.muoan.com/)**

**部分代码/功能灵感借鉴：**

[插件库](https://gitee.com/yhArcadia/Yunzai-Bot-plugins-index)

****

## 😍其他：

**素材来源于网络，仅供交流学习使用，严禁用于商业和非法用途**

**交易问题/其他问题均已本插件无交换任何问题均与本插件无关**

**API服务地址：https://record.muoan.com**
