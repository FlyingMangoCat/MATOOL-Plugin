/**
 * MATOOL-Plugin - 本地抽卡记录上传云端
 *
 * #128814012记录上传云端     上传本地原神记录（本地其他插件保存的记录，如 genshin-plugin 的 data/gachaJson）
 * *102264384记录上传云端     上传本地星铁记录（data/srJson）
 * #星铁102264384记录上传云端 同上（TRSS 转换写法）
 * #全部记录上传云端          仅主人：本地全部原神+星铁记录上传到公用 Key 账号
 *
 * Key 归属规则（上传专用）：
 *   用户绑定了个人 Key → 上传到个人 Key 账号
 *   未绑定个人 Key 且设置了公用 Key → 上传到公用 Key 账号
 *   都没有 → 提示先绑定 Key
 *
 * 校验：仅能上传「发送命令用户自己的」本地记录
 *   （按 data/gachaJson|srJson/{user_id}/{uid}/ 目录归属判断，
 *     不是本人的 UID 或本地不存在该 UID 记录都会给出对应提示）
 */
import plugin from '../../../lib/plugins/plugin.js'
import fs from 'node:fs'
import path from 'node:path'
import { Cfg } from '../components/index.js'
import { uploadGachaJSON } from './api.js'

const DATA_ROOT = `${process.cwd()}/data`

// 游戏符号：#=原神 *=星铁 %=绝区零（TRSS 会把 * → #星铁、% → #绝区零）
const SYMBOL_GAME = { '*': 'sr', '%': 'zzz', '星铁': 'sr', '崩铁': 'sr', '绝区零': 'zzz' }
const GAME_DIR = { gs: 'gachaJson', sr: 'srJson' }
const GAME_BIZ = { gs: 'hk4e_cn', sr: 'hkrpg_cn', zzz: 'nap_cn' }
const GAME_NAME = { gs: '原神', sr: '星穹铁道', zzz: '绝区零' }

export class matUpload extends plugin {
  constructor() {
    super({
      name: 'MATOOL:上传云端',
      dsc: '本地抽卡记录上传云端',
      event: 'message',
      priority: 9998,
      rule: [
        { reg: /^#?(?:[*%]|星铁|崩铁|绝区零)?\s*\d{8,10}\s*记录\s*上传云端/i, fnc: 'uploadOne' },
        { reg: /^#?\s*全部记录\s*上传云端/i, fnc: 'uploadAll' },
      ],
    })
  }

  /** 解析：#128814012记录上传云端 / *102264384记录上传云端 / #星铁102264384记录上传云端 → { uid, game } */
  _parse(msg) {
    let trimmed = msg.replace(/^#/, '').trim()
    let game = 'gs'
    const m = trimmed.match(/^(星铁|崩铁|绝区零|[*%])/)
    if (m) {
      const g = SYMBOL_GAME[m[1]]
      if (g) {
        game = g
        trimmed = trimmed.slice(m[1].length)
      }
    }
    const uidM = trimmed.match(/(\d{8,10})/)
    return { uid: uidM ? uidM[1] : '', game }
  }

  /** 读取本地某用户某 UID 的全部卡池记录（跨文件合并去重，清理私有字段） */
  _collectLocal(game, userId, uid) {
    const dir = path.join(DATA_ROOT, GAME_DIR[game], String(userId), String(uid))
    if (!fs.existsSync(dir)) return null
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    if (!files.length) return []
    const seen = new Set()
    const list = []
    for (const f of files) {
      try {
        const arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
        if (!Array.isArray(arr)) continue
        for (const r of arr) {
          if (!r || r.id == null || String(r.id) === '') continue
          const id = String(r.id)
          if (seen.has(id)) continue
          seen.add(id)
          const item = { ...r }
          delete item._isoTime // 插件私有字段
          if (game === 'sr' && item.uigf_gacha_type == null) {
            item.uigf_gacha_type = String(item.gacha_type) // SRGF 需要 UIGF 类型字段
          }
          list.push(item)
        }
      } catch (e) { /* 单文件损坏跳过 */ }
    }
    return list.sort((a, b) => String(a.id).localeCompare(String(b.id)))
  }

  /** 全本地查找该 UID 归属（返回归属用户目录名，未找到返回 null） */
  _findOwner(game, uid) {
    const root = path.join(DATA_ROOT, GAME_DIR[game])
    if (!fs.existsSync(root)) return null
    for (const userDir of fs.readdirSync(root)) {
      if (fs.existsSync(path.join(root, userDir, String(uid)))) return userDir
    }
    return null
  }

  /** 上传单个 UID 的本地记录 */
  async uploadOne() {
    const { uid, game } = this._parse(this.e.msg.trim())
    if (!uid) return false

    if (game === 'zzz') {
      this.reply('暂不支持绝区零上传哦~')
      return true
    }

    // 1. 解析 Key 归属（全功能统一：个人 Key 优先，其次公用 Key）
    const { key, mode } = Cfg.resolveUploadKey(this.e.user_id, this.e.isMaster)
    if (!key) {
      this.reply('功能需要绑定墨安助手KEY使用哦~')
      return true
    }
    if (mode === 'common') this.reply('您未绑定墨安key，本操作数据归属于公用账号KEY 如您需要归属于个人账户请发送#墨安key获取 来获取KEY绑定~')

    const gameName = GAME_NAME[game]
    // 2. 校验本地记录归属
    const records = this._collectLocal(game, this.e.user_id, uid)
    if (records === null) {
      const owner = this._findOwner(game, uid)
      if (owner) {
        this.reply(`UID ${uid} 的记录不属于你哦~`)
      } else {
        this.reply(`本地没有 UID ${uid} 的记录哦~`)
      }
      return true
    }
    if (records.length === 0) {
      this.reply(`UID ${uid} 本地记录为空哦~`)
      return true
    }

    // 3. 上传
    this.reply(`正在上传 ${gameName} ${uid}（${records.length}条）...`)

    const r = await uploadGachaJSON(uid, GAME_BIZ[game], records, key)
    if (r.code !== 0) {
      this.reply('上传失败哦~')
      return true
    }
    this.reply(`✅ 有效 UID:${uid} 上传云端成功`)
    return true
  }

  /** 全部记录上传云端（仅主人，原神+星铁，上传到公用 Key 账号） */
  async uploadAll() {
    if (!this.e.isMaster) {
      this.reply('仅主人可用哦~')
      return true
    }
    const commonKey = Cfg.getCommonKey()
    if (!commonKey || !Cfg.isCommonMode()) {
      this.reply('未开启公用模式哦~ 请先 #墨安设置公用[key] 再 #墨安切换公用模式')
      return true
    }

    // 收集本地全部用户/UID 记录（原神 + 星铁）
    const jobs = []
    for (const [game, dir] of Object.entries(GAME_DIR)) {
      const root = path.join(DATA_ROOT, dir)
      if (!fs.existsSync(root)) continue
      for (const userId of fs.readdirSync(root)) {
        const userPath = path.join(root, userId)
        if (!fs.statSync(userPath).isDirectory()) continue
        for (const uid of fs.readdirSync(userPath)) {
          const records = this._collectLocal(game, userId, uid)
          if (records && records.length > 0) jobs.push({ game, userId, uid, records })
        }
      }
    }
    if (!jobs.length) {
      this.reply('本地没有可上传的记录哦~')
      return true
    }

    const total = jobs.reduce((s, j) => s + j.records.length, 0)
    this.reply(`正在上传 ${jobs.length} 个UID共${total}条，请稍候...`)

    const ok = [], fail = []
    for (const j of jobs) {
      const r = await uploadGachaJSON(j.uid, GAME_BIZ[j.game], j.records, commonKey)
      if (r.code === 0) ok.push({ ...j, imported: r.data?.imported ?? j.records.length })
      else fail.push({ ...j, reason: r.message || '未知错误' })
    }

    const gsOk = ok.filter(j => j.game === 'gs').length
    const srOk = ok.filter(j => j.game === 'sr').length
    const gsFail = fail.filter(j => j.game === 'gs').length
    const srFail = fail.filter(j => j.game === 'sr').length
    const lines = [
      ok.length === jobs.length ? '✅ 全部上传完成！' : '✅ 全部上传完成（部分失败）',
      `原神 成功 ${gsOk} / 失败 ${gsFail} · 星铁 成功 ${srOk} / 失败 ${srFail}`,
    ]
    if (fail.length) {
      for (const j of fail.slice(0, 10)) {
        lines.push(`${GAME_NAME[j.game]} ${j.uid} 上传失败哦~`)
      }
      if (fail.length > 10) lines.push(`... 及另外 ${fail.length - 10} 个失败`)
    }
    this.reply(lines.join('\n'))
    return true
  }
}
