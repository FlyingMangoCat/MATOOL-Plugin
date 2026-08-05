/**
 * MATOOL-Plugin - 抽卡链接解析导入
 *
 * 用户发送米游社/HoYoLAB 抽卡链接时，自动解析并导入数据到服务器
 * 成功则提示使用 统计/分析 命令查看
 *
 * API 说明（record.muoan.com）：
 *   POST /api/gacha/proxy  - 代理拉取米游社抽卡数据
 *   POST /api/gacha/import - 导入抽卡记录到数据库
 *
 * 错误码：
 *   400 - URL 格式不正确
 *   401 - API Key 无效
 *   402 - authkey 已过期
 *   403 - authkey 无效
 *   404 - 未找到抽卡记录
 *   408 - 代理请求超时
 *   429 - 请求过于频繁
 *   500 - 导入失败
 */
import plugin from '../../../lib/plugins/plugin.js'
import { importGacha } from './api.js'
import { Cfg } from '../components/index.js'
import { stGet, stDel, stSet } from './records.js'

// Gacha URL 正则：包含 authkey 的米游社/HoYoLAB 链接
const GACHA_URL_RE = /https?:\/\/[^\s]*(?:authkey|webstatic|mihoyo|hoyolab|hoyoverse)[^\s]*/i

export class GachaImport extends plugin {
  constructor() {
    super({
      name: '墨安抽卡导入',
      dsc: '自动解析米游社/HoYoLAB抽卡链接并导入数据',
      event: 'message',
      priority: 1,
      rule: [
        {
          reg: GACHA_URL_RE,
          fnc: 'importUrl',
        },
      ],
    })
  }

  /** Auto-detect gacha URLs in user messages */
  async importUrl() {
    // 主人禁用链接解析时不接管（避免抢占其他插件）
    if (!Cfg.getLinkParseEnabled()) return false

    // ── detect gacha URL ──
    const msg = this.e.msg
    const match = msg.match(GACHA_URL_RE)
    if (!match) return false

    const gachaUrl = match[0]

    // If message also starts with a known command prefix (#/*/%), let normal command handle it
    if (/^[#\*%]/.test(msg.trim())) return false

    // 检查是否有 records.js 遗留的状态（#导入/导出），有则清除避免两个处理器冲突
    const existingState = stGet(this.e.user_id)
    if (existingState) {
      stDel(this.e.user_id)
    }

    // ── process ──
    this.reply('正在解析抽卡链接...')

    const result = await importGacha(gachaUrl, this.e.user_id, this.e.isMaster)

    if (result.code === 0 && result.data?.imported > 0) {
      const data = result.data
      const gameSym = { gs: '#', sr: '*', zzz: '%' }[data.game] || '#'
      const gameName = { gs: '原神', sr: '星穹铁道', zzz: '绝区零' }[data.game] || data.game
      this.reply(
        `✅ 导入成功 ${gameName} ${data.uid}\n` +
        `新增 ${data.imported} 条\n` +
        `查看 ${gameSym}分析${data.uid}`
      )
    } else if (result.code === 0 && (!result.data || result.data.imported === 0)) {
      this.reply('❌ 未导入新记录\n链接可能已过期，请重新生成后重试')
    } else if (result.code === 401) {
      this.reply('❌ 未绑定 Key\n请先 #墨安绑定[key]')
    } else if (result.code === 402) {
      this.reply(`❌ 链接无效: ${result.message}`)
    } else if (result.code === 500) {
      this.reply(`❌ 服务器错误: ${result.message}`)
    } else {
      this.reply(`❌ 解析失败: ${result.message || '未知错误'}`)
    }

    return true
  }
}
