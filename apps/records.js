/**
 * MATOOL-Plugin - 抽卡记录导出/导入
 *
 * 导出： #导出UID记录 → 发链接 → 验证 → JSON文件
 * 导入： #导入UID记录 → 发链接 → 验证 → 发JSON → 导入
 * 拉取： #拉取UID云端记录 → 发链接 → 验证 → 写入本地genshin/miao目录
 *
 * 游戏符号：#原神 *星铁 %绝区零（不指定默认原神）
 *
 * 机制说明：
 *   导出走规则正则，不涉及链接 → 无冲突。
 *   导入用 accept() 钩子接管后续消息（accept 优先于所有规则执行）。
 *   accept 无状态时返回 false，正常流程不受影响。
 */
import plugin from '../../../lib/plugins/plugin.js'
import { exportGacha, importGachaJSON, verifyLink, symbolToGameBiz, gameBizToName } from './api.js'
import { Cfg } from '../components/index.js'
import fs from 'fs'
import path from 'path'

const GACHA_URL_RE = /https?:\/\/[^\s]*(?:authkey|webstatic|mihoyo|hoyolab|hoyoverse)[^\s]*/i

// ── 状态管理 ──

const STATE = new Map()
const TTL = 120_000

export function stGet(uid) {
  const s = STATE.get(uid)
  if (s && Date.now() - s._ts > TTL) { STATE.delete(uid); return null }
  return s || null
}
export function stSet(uid, v) { STATE.set(uid, { ...v, _ts: Date.now() }) }
export function stDel(uid) { STATE.delete(uid) }

setInterval(() => {
  const now = Date.now()
  for (const [k, v] of STATE) if (now - v._ts > TTL) STATE.delete(k)
}, 30_000).unref()

// ── 插件 ──

export class matRecords extends plugin {
  constructor() {
    super({
      name: 'MATOOL:记录',
      dsc: '导出/导入抽卡记录',
      event: 'message',
      priority: 9999,
      rule: [
        { reg: /^#?(?:[*%]|星铁|绝区零)?(导出)\s*\d{8,10}\s*(记录|json)/i, fnc: 'exportCmd' },
        { reg: /^#?(?:[*%]|星铁|绝区零)?(导入)\s*\d{8,10}\s*(记录|json)/i, fnc: 'importStart' },
        { reg: /^#?(?:[*%]|星铁|绝区零)?(拉取)\s*\d{8,10}\s*云端\s*(记录|json)/i, fnc: 'pullCmd' },
      ],
    })
  }

  // ═══════════════ 导出 ═══════════════

  async exportCmd() {
    const { key, mode } = Cfg.resolveUploadKey(this.e.user_id, this.e.isMaster)
    if (!key) {
      this.reply('功能需要绑定墨安助手KEY使用哦~')
      return true
    }
    if (mode === 'common') this.reply('您未绑定墨安key，本操作数据归属于公用账号KEY 如您需要归属于个人账户请发送#墨安key获取 来获取KEY绑定~')
    const uid = this._uid()
    const gameBiz = this._gameBiz()
    const gameName = gameBizToName(gameBiz)
    if (!uid) return false
    stSet(this.e.user_id, { step: 'link', mode: 'export', uid, gameBiz, gameName, key })
    this.reply(`导出 ${gameName} ${uid}\n请发送该账号的抽卡链接验证哦~`)
    return true
  }

  // ═══════════════ 导入 ═══════════════

  async importStart() {
    const { key, mode } = Cfg.resolveUploadKey(this.e.user_id, this.e.isMaster)
    if (!key) {
      this.reply('功能需要绑定墨安助手KEY使用哦~')
      return true
    }
    if (mode === 'common') this.reply('您未绑定墨安key，本操作数据归属于公用账号KEY 如您需要归属于个人账户请发送#墨安key获取 来获取KEY绑定~')
    const uid = this._uid()
    const gameBiz = this._gameBiz()
    const gameName = gameBizToName(gameBiz)
    if (!uid) return false
    stSet(this.e.user_id, { step: 'link', mode: 'import', uid, gameBiz, gameName, key })
    this.reply(`导入 ${gameName} ${uid}\n请发送该账号的抽卡链接验证哦~`)
    return true
  }

  // ═══════════════ 拉取 ═══════════════

  async pullCmd() {
    // 全功能统一规则：个人 Key 优先，其次公用 Key（公用模式开启时）
    const { key, mode } = Cfg.resolveUploadKey(this.e.user_id, this.e.isMaster)
    if (!key) {
      this.reply('功能需要绑定墨安助手KEY使用哦~')
      return true
    }
    if (mode === 'common') this.reply('您未绑定墨安key，本操作数据归属于公用账号KEY 如您需要归属于个人账户请发送#墨安key获取 来获取KEY绑定~')
    const uid = this._uid()
    const gameBiz = this._gameBiz()
    const gameName = gameBizToName(gameBiz)
    if (!uid) return false
    stSet(this.e.user_id, { step: 'link', mode: 'pull', uid, gameBiz, gameName, key })
    this.reply(`拉取 ${gameName} ${uid}\n请发送该账号的抽卡链接验证哦~`)
    return true
  }

  // ═══════════════ accept 钩子 ═══════════════
  // 规则执行前运行。有状态时接管消息，无状态时返回 false（不影响其他插件）

  async accept() {
    const state = stGet(this.e.user_id)
    if (!state) return false

    if (state.step === 'link')    return await this._handleLink(state)
    if (state.step === 'json')    return await this._handleJson(state)
    return false
  }

  async _handleLink(state) {
    const url = this.e.msg.match(GACHA_URL_RE)?.[0]
    if (!url) { stDel(this.e.user_id); this.reply('未检测到链接，已取消哦~'); return 'return' }

    this.reply('正在验证...')
    // 拉取模式用状态中已解析的 Key（个人优先），其余模式按 QQ 模式解析
    const r = await verifyLink(url, this.e.user_id, this.e.isMaster, state.key || '')
    if (r.code !== 0) {
      stDel(this.e.user_id)
      const msg = r.message || '链接无效'
      if (r.code === 401 && Cfg.getKeyByQq(this.e.user_id, this.e.isMaster)) {
        this.reply('KEY绑定错误哦~请查看是否有效或已被禁用')
      } else if (msg.startsWith('未绑定')) {
        this.reply('功能需要绑定墨安助手KEY使用哦~')
      } else {
        this.reply(msg + '哦~')
      }
      return 'return'
    }

    const vu = r.data?.uid ? String(r.data.uid) : ''
    const vb = r.data?.game_biz || state.gameBiz

    // 检查 UID 是否匹配用户指定的 UID
    if (vu && vu !== state.uid) {
      stDel(this.e.user_id)
      this.reply(`链接UID与指定不符哦~（${vu} ≠ ${state.uid}）`)
      return 'return'
    }

    if (state.mode === 'export') {
      // 导出：验证通过后直接导出
      stDel(this.e.user_id)
      this.reply('✅ 验证成功！正在导出...')
      // 使用验证后服务器返回的 game_biz（自动检测），而不是命令输入的默认值
      const actualBiz = vb
      const actualName = gameBizToName(actualBiz)
      return await this._doExport(state.uid, actualBiz, actualName)
    }
    if (state.mode === 'pull') {
      // 拉取：验证通过后从云端拉取并写入本地 genshin/miao 目录（个人 Key 优先，其次公用 Key）
      stDel(this.e.user_id)
      this.reply('✅ 验证成功！正在拉取...')
      const actualBiz = vb
      const actualName = gameBizToName(actualBiz)
      return await this._doPull(state.uid, actualBiz, actualName, state.key || '')
    }
    // 导入：进入等待 JSON 阶段
    const actualName = gameBizToName(vb)
    stSet(this.e.user_id, { step: 'json', mode: 'import', uid: state.uid, gameBiz: vb, gameName: actualName })
    this.reply('✅ 验证成功！请发送JSON文件哦~')
    return 'return'
  }

  async _handleJson(state) {
    const { uid, gameBiz, gameName } = state
    let text = ''

    // 1) QQ 文件附件
    const fe = this.e.message?.find(m => m.type === 'file')
    if (fe) {
      this.reply('正在读取文件...')
      try {
        let fileUrl = ''
        const raw = fe.file || ''
        // 直接是 URL
        if (/^https?:\/\//.test(raw)) {
          fileUrl = raw
        }
        // fid: 格式（OICQ），尝试 resolve
        else if (raw.startsWith('fid:')) {
          const fid = raw.slice(4)
          const friend = this.e.bot?.pickFriend(this.e.user_id)
          if (friend && typeof friend.getFileInfo === 'function') {
            const info = await friend.getFileInfo(fid)
            if (info?.url) fileUrl = info.url
          }
          if (!fileUrl) throw Error('暂不支持从 OICQ fid 下载文件，请发送文件下载链接或粘贴 JSON 内容')
        }
        // 可能是文件路径（Bot 本地文件）
        else if (raw.startsWith('file://')) {
          const resp = await globalThis.fetch(raw)
          if (!resp.ok) throw Error('HTTP ' + resp.status)
          text = await resp.text()
        }
        // fe.file 对象格式
        else if (typeof raw === 'object' && raw !== null) {
          if (raw.url) fileUrl = raw.url
        }
        // fe.url 备用
        else if (fe.url) {
          fileUrl = fe.url
        }

        if (fileUrl) {
          const resp = await globalThis.fetch(fileUrl)
          if (!resp.ok) throw Error('HTTP ' + resp.status)
          text = await resp.text()
        }

        if (!text) throw Error('无法获取文件内容')
      } catch (e) { this.reply('文件读取失败哦~'); return 'return' }
    }

    // 2) 下载链接
    else if (/^https?:\/\//.test(this.e.msg.trim())) {
      this.reply('正在下载...')
      try {
        const resp = await globalThis.fetch(this.e.msg.trim(), {
          signal: AbortSignal.timeout(15000),
          headers: { 'User-Agent': 'MATOOL-Plugin/Yunzai' },
        })
        if (!resp.ok) throw Error('HTTP ' + resp.status)
        text = await resp.text()
      } catch (e) { this.reply('下载失败哦~'); return 'return' }
    }

    // 3) 粘贴的 JSON
    else if (/^\s*[\{\[]/.test(this.e.msg)) { text = this.e.msg.trim() }

    else { return false } // 啥都不是，不处理

    return this._doImport(uid, gameBiz, gameName, text)
  }

  async _doExport(uid, gameBiz, gameName) {
    const r = await exportGacha(uid, gameBiz, this.e.user_id, this.e.isMaster)
    if (r.code !== 0) {
      this.reply('导出失败哦~')
      return 'return'
    }

    try {
      const data = r.data
      const gameMap = { hk4e_cn: 'hk4e', hkrpg_cn: 'hkrpg', nap_cn: 'nap' }
      const uigfKey = gameMap[gameBiz]
      let total = 0
      if (data.info && uigfKey && Array.isArray(data[uigfKey])) {
        // UIGF v4.2 格式：可能有多组 (不同 uid/timezone/lang)
        for (const group of data[uigfKey]) {
          if (Array.isArray(group?.list)) total += group.list.length
        }
      } else {
        total = data.total || 0
      }
      const fc = JSON.stringify(data, null, 2)
      const fn = 'gacha_' + uid + '_' + gameName + '.json'
      const dir = process.cwd() + '/data/MATOOL-Plugin/'
      const fp = path.join(dir, fn)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(fp, fc, 'utf8')
      try { this.e.reply(segment.file(fp)) } catch (_) {}
      this.reply(`✅ 导出成功 ${gameName} ${uid}（${total}条）`)
    } catch (e) {
      this.reply('导出失败哦~')
    }
    return 'return'
  }

  async _doPull(uid, gameBiz, gameName, apiKey = '') {
    // genshin/miao 本地无绝区零标准目录，暂不支持
    if (gameBiz === 'nap_cn') {
      this.reply('暂不支持绝区零拉取哦~')
      return 'return'
    }
    const r = await exportGacha(uid, gameBiz, this.e.user_id, this.e.isMaster, apiKey)
    if (r.code !== 0) {
      this.reply('拉取失败哦~')
      return 'return'
    }
    try {
      const records = extractRecords(r.data, gameBiz)
      if (!records.length) {
        this.reply('云端没有记录哦~')
        return 'return'
      }
      const pools = writeLocal(gameBiz, String(this.e.user_id), uid, records)
      this.reply(`✅ 拉取成功 ${gameName} ${uid}（${records.length}条 → ${pools}个卡池）`)
    } catch (e) {
      this.reply('拉取失败哦~')
    }
    return 'return'
  }

  async _doImport(uid, gameBiz, gameName, text) {
    stDel(this.e.user_id)
    let records
    try {
      const j = JSON.parse(text)
      // UIGF 版本校验：墨安程序导入支持 v2.x（扁平 list）与 v4.x（分区格式）
      const uigfVer = j?.info?.version
      if (uigfVer && !/^v[24]\.\d+$/.test(uigfVer)) {
        this.reply('版本不支持哦~ 仅支持UIGF v2.2/v4.2')
        return 'return'
      }
      // UIGF v4.2 格式：{ hk4e: [{ uid: '...', list: [...] }] }
      const gameMap = { hk4e_cn: 'hk4e', hkrpg_cn: 'hkrpg', nap_cn: 'nap' }
      const uigfKey = gameMap[gameBiz]
      if (j.info && uigfKey && Array.isArray(j[uigfKey]) && Array.isArray(j[uigfKey][0]?.list)) {
        records = j[uigfKey][0].list
      } else if (j.info && !uigfKey) {
        // gameBiz 不匹配，遍历所有游戏
        for (const k of ['hk4e', 'hkrpg', 'nap']) {
          if (Array.isArray(j[k]) && Array.isArray(j[k][0]?.list) && j[k][0].list.length > 0) {
            records = j[k][0].list
            break
          }
        }
      } else if (Array.isArray(j.list) && j.list.length > 0) {
        // UIGF v2.x 扁平格式：{ info: {...}, list: [...] }（与墨安程序一致，有无 info 均可）
        records = j.list
      } else {
        // 旧格式：{ records: { hk4e_cn: [...] } } 或直接数组
        if (j.records && typeof j.records === 'object') {
          const raw = j.records[gameBiz]
          if (Array.isArray(raw)) { records = raw }
          else { records = j.records }
        } else if (Array.isArray(j)) {
          records = j
        } else {
          records = j.records || j
        }
      }
    } catch (_) { this.reply('JSON格式错误哦~'); return 'return' }

    if (!Array.isArray(records) || records.length === 0) {
      this.reply('未找到有效记录哦~'); return 'return'
    }

    this.reply('正在导入 ' + records.length + ' 条...')
    const r = await importGachaJSON(uid, gameBiz, records, this.e.user_id, this.e.isMaster)
    if (r.code !== 0) { this.reply('导入失败哦~'); return 'return' }

    const sym = gameBiz === 'hk4e_cn' ? '#' : gameBiz === 'hkrpg_cn' ? '*' : '%'
    this.reply(`✅ 导入成功 ${gameName} ${uid}（${records.length}条）\n查看 ${sym}分析${uid}`)
    return 'return'
  }

  // ═══════════════ 工具 ═══════════════

  _uid() { const m = this.e.msg.match(/(\d{8,10})/); return m ? m[1] : '' }
  _gameBiz() {
    let m = this.e.msg.replace(/^#/, '')
    // TRSS-Yunzai 把 *前缀 → #星铁，%前缀 → #绝区零
    if (/^星铁/.test(m) || /^崩铁/.test(m)) return 'hkrpg_cn'
    if (/^绝区/.test(m)) return 'nap_cn'
    const c = m.charAt(0)
    return symbolToGameBiz('*%'.includes(c) ? c : '#')
  }
}

// ═══════════════ 拉取写本地（纯函数，便于测试） ═══════════════

/** 从 export-json 响应中提取记录数组（兼容 UIGF v2/v4 与旧格式） */
export function extractRecords(data, gameBiz) {
  if (!data || typeof data !== 'object') return []
  const gameMap = { hk4e_cn: 'hk4e', hkrpg_cn: 'hkrpg', nap_cn: 'nap' }
  const uigfKey = gameMap[gameBiz]
  const list = []
  if (data.info && uigfKey && Array.isArray(data[uigfKey])) {
    // UIGF v4.x 分区格式：[{ uid, timezone, lang, list }]
    for (const group of data[uigfKey]) {
      if (Array.isArray(group?.list)) list.push(...group.list)
    }
  } else if (Array.isArray(data.list)) {
    // UIGF v2.x 扁平格式
    list.push(...data.list)
  } else if (Array.isArray(data)) {
    list.push(...data)
  }
  return list
}

/**
 * 按 gacha_type 拆分记录并写入 genshin/miao 本地目录（data/gachaJson|srJson/{userId}/{uid}/{type}.json）
 * 已存在文件则合并去重（按 id），按时间升序排列。返回写入的卡池文件数。
 */
export function writeLocal(gameBiz, userId, uid, records) {
  const dirName = gameBiz === 'hkrpg_cn' ? 'srJson' : 'gachaJson'
  const base = path.join(process.cwd(), 'data', dirName, String(userId), String(uid))
  fs.mkdirSync(base, { recursive: true })

  // 按 gacha_type 分组
  const groups = {}
  for (const r of records) {
    if (!r || typeof r !== 'object') continue
    const gt = String(r.gacha_type ?? '')
    if (!gt) continue
    const item = { ...r }
    delete item._isoTime // 插件私有字段
    ;(groups[gt] ||= []).push(item)
  }

  let written = 0
  for (const [gt, list] of Object.entries(groups)) {
    const fp = path.join(base, gt + '.json')
    let merged = []
    if (fs.existsSync(fp)) {
      try {
        const old = JSON.parse(fs.readFileSync(fp, 'utf8'))
        if (Array.isArray(old)) merged = old
      } catch (_) { /* 损坏文件跳过 */ }
    }
    const seen = new Set(merged.map(r => String(r.id)))
    for (const r of list) {
      if (r.id == null || seen.has(String(r.id))) continue
      seen.add(String(r.id))
      merged.push(r)
    }
    merged.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
    fs.writeFileSync(fp, JSON.stringify(merged, null, 2), 'utf8')
    written++
  }
  return written
}
