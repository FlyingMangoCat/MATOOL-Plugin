export const helpCfg = {
  themeSet: false,
  title: 'MATOOL 使用帮助',
  subTitle: '墨安游戏助手',
  colWidth: 265,
  theme: 'all',
  themeExclude: ['default'],
  colCount: 3,
  bgBlur: true,
}

export const helpList = [
  {
    group: '抽卡分析',
    list: [
      {
        icon: 67,
        title: '#分析[uid]',
        desc: '原神抽卡分析图（无需 Key）',
      },
      {
        icon: 67,
        title: '*分析[uid]',
        desc: '星铁抽卡分析图（无需 Key）',
      },
      {
        icon: 67,
        title: '%分析[uid]',
        desc: '绝区零抽卡分析图（无需 Key）',
      },
      {
        icon: 35,
        title: '#抽卡[uid]',
        desc: '文字版抽卡记录',
      },
    ],
  },
  {
    group: '抽卡记录',
    list: [
      {
        icon: 84,
        title: '#导出[uid]记录',
        desc: '导出 UIGF v4.2 JSON（需绑定 Key）',
      },
      {
        icon: 85,
        title: '#导入[uid]记录',
        desc: '导入 UIGF v2.2 / v4.2（需绑定 Key）',
      },
      {
        icon: 73,
        title: '链接自动导入',
        desc: '发送抽卡链接自动导入（主人可禁用）',
      },
      {
        icon: 79,
        title: '多游戏',
        desc: '# 原神 / * 星铁 / % 绝区零',
      },
    ],
  },
  {
    group: 'Key 绑定',
    list: [
      {
        icon: 58,
        title: '#墨安绑定[key]',
        desc: '绑定自己的 Key，如 #墨安绑定mo-123456786',
      },
      {
        icon: 63,
        title: '两种模式',
        desc: '① 各自绑定 ② 公用模式全员统一走公用 Key',
      },
    ],
  },
  {
    group: '主人设置',
    list: [
      {
        icon: 58,
        title: '#墨安设置公用[key]',
        desc: '设置公用 Key，开启公用模式（全员统一走公用 Key）',
      },
      {
        icon: 59,
        title: '#墨安清除公用',
        desc: '清除公用 Key，切换回个人模式',
      },
      {
        icon: 254,
        title: '#禁用链接解析',
        desc: '关闭链接自动解析，不抢占其他插件',
      },
      {
        icon: 254,
        title: '#启用链接解析',
        desc: '重新开启链接自动解析',
      },
    ],
  },
  {
    group: '其他',
    list: [
      {
        icon: 61,
        title: '#墨安帮助',
        desc: '查看本帮助',
      },
      {
        icon: 73,
        title: '#墨安更新',
        desc: '更新插件（仅主人）',
      },
      {
        icon: 84,
        title: '#墨安版本',
        desc: '查看插件版本',
      },
    ],
  },
]
