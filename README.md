# 🎲 MATOOL-Plugin

墨安游戏助手 - MATOOL-Plugin

![ljhx2.png](https://raw.gitcode.com/user-images/assets/5424764/be7eaf0c-76b9-40dc-9e5f-dc47ebfadb8b/ljhx2.png 'ljhx2.png')
****
## 😍插件介绍：
**提供基于 [墨安游戏助手](https://record.muoan.com) 功能。**

**【抽卡分析】** `#分析[uid]` 直接请求墨安服务器生成分析图片，无需 Key、插件不做二次数据处理。

**【导入/导出】** 每个 QQ 用户通过 `#墨安绑定[key]` 绑定自己的 Key 后，即可使用 `#导出[uid]记录` / `#导入[uid]记录` / 发送抽卡链接自动导入（按 QQ 验证 Key，未绑定会提示先绑定）。

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
| 公用Key | `#墨安设置公用[key]` | **仅主人**：设置公用 Key，设置后所有用户免绑定直接可用导入/导出/链接解析 |
| 导出记录 | `#导出[UID]记录` | 导出 UIGF JSON 文件（**需先绑定 Key**） |
| 导入记录 | `#导入[UID]记录` | 导入抽卡记录（**需先绑定 Key**） |
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
>
> **Key 绑定机制（两种模式）：**
>
> - **模式1（各自绑定）**：每个 QQ 用户 `#墨安绑定[key]` 绑定自己的 Key，导入/导出/链接导入用自己绑定的 Key 请求墨安 API；未绑定会提示先绑定。
> - **模式2（公用 Key）**：主人 `#墨安设置公用[key]` 设置公用 Key 后，**所有用户无需绑定**即可直接使用导入/导出/链接自动解析（已绑定个人 Key 的用户仍优先用个人 Key）。
>
> 抽卡分析无需 Key，直接请求墨安分析图。

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
