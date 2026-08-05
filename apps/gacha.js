/**
 * MATOOL-Plugin - 抽卡分析
 *
 * #分析[uid] / *分析[uid] / %分析[uid]  → 直接请求墨安 /analysis/render 返回图片（无需 Key，插件不做二次数据处理）
 * #抽卡[uid] / *抽卡[uid] / %抽卡[uid]  → 文字版抽卡记录
 *
 * 游戏符号：#=原神  *=星铁  %=绝区零（TRSS-Yunzai 会将 *→#星铁、%→#绝区零）
 */
import plugin from '../../../lib/plugins/plugin.js'
import { Cfg } from '../components/index.js'
import { GAME_MAP, parseUid, queryGacha, fetchWithKey } from './api.js'

const SYMBOL_GAME = {
  '*': 'sr',
  '%': 'zzz',
  '星铁': 'sr',
  '崩铁': 'sr',
  '绝区零': 'zzz',
}

export class matGacha extends plugin {
  constructor() {
    super({
      name: 'MATOOL:抽卡',
      dsc: '墨安抽卡分析（直接出图）与查询',
      event: 'message',
      priority: 9999,
      rule: [
        { reg: /^#?(?:[*%]|星铁|绝区零)?分析\s*\d{8,10}/i, fnc: 'analysis' },
        { reg: /^#?(?:[*%]|星铁|绝区零)?抽卡\s*\d{8,10}/i, fnc: 'query' },
      ],
    })
  }

  /** 解析 msg: 返回 { uid, game } */
  _parse(msg) {
    let trimmed = msg.replace(/^#/, '')
    let game = 'gs'
    const matchedPrefix = trimmed.match(/^(星铁|崩铁|绝区零|[#*%])/)
    if (matchedPrefix) {
      const prefix = matchedPrefix[1]
      if (SYMBOL_GAME[prefix]) {
        game = SYMBOL_GAME[prefix]
        trimmed = trimmed.slice(prefix.length)
      }
    }
    const uid = parseUid(trimmed)
    return { uid, game }
  }

  /** 分析：请求墨安分析图（PNG）直接发送，无需 Key */
  async analysis() {
    const parsed = this._parse(this.e.msg.trim())
    if (!parsed || !parsed.uid) {
      this.reply('格式: #分析[uid] / *分析[uid] / %分析[uid]')
      return false
    }
    const { uid, game } = parsed
    const gameName = GAME_MAP[game]?.name || '原神'
    this.reply('正在生成 ' + gameName + ' ' + uid + ' 分析图...')

    const base = Cfg.getApiBase()
    const url = `${base}/analysis/render?uid=${encodeURIComponent(uid)}&game=${encodeURIComponent(game)}&_t=${Date.now()}`
    try {
      const resp = await globalThis.fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'MATOOL-Plugin/Yunzai' },
      })
      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        const hint = (text || '').replace(/<[^>]*>/g, '').trim().slice(0, 120)
        throw new Error(`HTTP ${resp.status}${hint ? '：' + hint : ''}`)
      }
      const contentType = resp.headers.get('content-type') || ''
      if (!contentType.includes('image')) {
        throw new Error('接口未返回图片（可能暂无抽卡记录）')
      }
      const buf = Buffer.from(await resp.arrayBuffer())
      this.reply(segment.image('base64://' + buf.toString('base64')))
    } catch (e) {
      this.reply('生成失败哦~ 请确认UID正确且已有记录')
    }
    return true
  }

  /** 查询：文字版抽卡记录（绑 Key 走授权接口，未绑定走公开接口） */
  async query() {
    const msg = this.e.msg.trim()
    const parsed = this._parse(msg)
    if (!parsed || !parsed.uid) {
      this.reply('格式: #抽卡[uid] / *抽卡[uid] / %抽卡[uid]')
      return false
    }
    const { uid, game } = parsed
    const gameName = GAME_MAP[game]?.name || '原神'
    const apiKey = Cfg.getKeyByQq(this.e.user_id, this.e.isMaster)
    this.reply('正在查询 ' + gameName + ' ' + uid + ' 抽卡记录...')

    const data = apiKey
      ? await fetchWithKey(uid, game, this.e.user_id, this.e.isMaster)
      : await queryGacha(uid, game)

    const section = GAME_MAP[game]?.uigfSection || 'hk4e'
    const groups = data[section] || []
    if (!groups.length || !groups[0].list.length) {
      this.reply(gameName + ' ' + uid + ' 暂无记录哦~')
      return false
    }

    const total = groups.reduce((sum, g) => sum + g.list.length, 0)
    const fiveCount = groups.reduce((sum, g) => sum + g.list.filter(r => r.rank_type === '5').length, 0)
    const fourCount = groups.reduce((sum, g) => sum + g.list.filter(r => r.rank_type === '4').length, 0)
    const all = groups.flatMap(g => g.list).sort((a, b) => new Date(b.time) - new Date(a.time))
    const recent = all.slice(0, 10)

    const lines = [
      gameName + ' 抽卡记录 ' + uid,
      '总 ' + total + ' 抽 | 五星 ' + fiveCount + ' | 四星 ' + fourCount,
      '最近 ' + recent.length + ' 条:',
    ]
    for (const r of recent) {
      const star = { '5': '★★★★★', '4': '★★★★', '3': '★★★' }[r.rank_type] || ''
      lines.push('  ' + (r.time || '').slice(0, 10) + ' ' + star + ' ' + r.name)
    }
    if (total > recent.length) {
      lines.push('... 以及 ' + (total - recent.length) + ' 条更早记录')
    }
    lines.push('', '查看 #分析' + uid)
    this.reply(lines.join('\n'))
  }
}
