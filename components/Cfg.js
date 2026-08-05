/**
 * MATOOL-Plugin - 配置管理
 * 读写插件内预先存在的 data/ 文件
 */
import fs from 'node:fs'
import YAML from 'yaml'

const PluginPath = `${process.cwd()}/plugins/MATOOL-Plugin`

class Cfg {
  constructor() {
    this._data = {}
    this._loadAll()
  }

  _loadAll() {
    const dataDir = `${PluginPath}/data`
    if (!fs.existsSync(dataDir)) return
    for (const dir of fs.readdirSync(dataDir)) {
      const dirPath = `${dataDir}/${dir}`
      if (!fs.statSync(dirPath).isDirectory()) continue
      this._data[dir] = this._data[dir] || {}
      for (const file of fs.readdirSync(dirPath)) {
        if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue
        const name = file.replace(/\.(yaml|yml)$/, '')
        try {
          const content = YAML.parse(fs.readFileSync(`${dirPath}/${file}`, 'utf8')) || {}
          this._data[dir][name] = content
        } catch (e) {
          logger.error(`[MATOOL] 加载 ${dir}/${file} 失败: ${e.message}`)
        }
      }
    }
  }

  /** 获取配置: get('KEY.MOANKEY.keys') */
  get(keyPath, def = null) {
    const keys = keyPath.split('.')
    let val = this._data
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k]
      } else {
        return def
      }
    }
    return val !== undefined ? val : def
  }

  getApiBase() {
    const base = this.get('API.MOANAPI.API_BASE')
    return base || 'https://record.muoan.com/api'
  }

  /**
   * 取指定 QQ 的可用 Key（全功能统一规则：个人 Key 优先 → 公用 Key 兜底）
   * 公用模式（主人显式开启且已设置公用 Key）：绑定个人 Key 用个人 Key，未绑定用公用 Key
   * 个人模式：仅个人绑定 Key（> master 旧 key 仅主人）
   */
  getKeyByQq(qq, isMaster = false) {
    return this.resolveUploadKey(qq, isMaster).key
  }

  /** 公用 Key（主人设置，所有用户导入/导出/链接解析共用） */
  getCommonKey() {
    const v = this.get('KEY.MOANKEY.common_key')
    return typeof v === 'string' && v ? v : ''
  }

  /** 是否公用模式：主人显式开启（#墨安切换公用模式）且已设置公用 Key */
  isCommonMode() {
    if (!this.getCommonKey()) return false
    return this.get('KEY.MOANKEY.mode') === 'common'
  }

  /** 显式设置模式开关：common=公用模式 / personal=个人模式 */
  setCommonMode(on) {
    const filePath = `${PluginPath}/data/KEY/MOANKEY.yaml`
    if (typeof this._data['KEY'] !== 'object' || this._data['KEY'] === null) {
      this._data['KEY'] = {}
    }
    if (typeof this._data['KEY']['MOANKEY'] !== 'object' || this._data['KEY']['MOANKEY'] === null) {
      this._data['KEY']['MOANKEY'] = {}
    }
    this._data['KEY']['MOANKEY']['mode'] = on ? 'common' : 'personal'
    this._writeYaml(filePath, this._data['KEY']['MOANKEY'])
  }

  setCommonKey(key) {
    const filePath = `${PluginPath}/data/KEY/MOANKEY.yaml`
    if (typeof this._data['KEY'] !== 'object' || this._data['KEY'] === null) {
      this._data['KEY'] = {}
    }
    if (typeof this._data['KEY']['MOANKEY'] !== 'object' || this._data['KEY']['MOANKEY'] === null) {
      this._data['KEY']['MOANKEY'] = {}
    }
    this._data['KEY']['MOANKEY']['common_key'] = key
    this._writeYaml(filePath, this._data['KEY']['MOANKEY'])
  }

  /** 个人绑定 Key：按 QQ 精确匹配（不含 master 旧数据） */
  getPersonalKey(qq) {
    const keys = this.get('KEY.MOANKEY.keys')
    if (!Array.isArray(keys) || keys.length === 0) return ''
    qq = String(qq)
    for (const k of keys) {
      if (k && typeof k === 'object' && String(k.qq) === qq && k.key) return k.key
    }
    return ''
  }

  /**
   * 上传云端用 Key 归属解析：
   *   用户绑定了个人 Key → 个人 Key（上传到个人账号）
   *   否则设置了公用 Key → 公用 Key（上传到公用账号）
   *   都没有 → 无 Key
   * @returns {{ key: string, mode: 'personal'|'common'|null }}
   */
  resolveUploadKey(qq, isMaster = false) {
    const personal = this.getPersonalKey(qq)
    if (personal) return { key: personal, mode: 'personal' }
    // 旧数据兼容：master 归属 key（仅主人可用）
    if (isMaster) {
      const keys = this.get('KEY.MOANKEY.keys')
      if (Array.isArray(keys)) {
        for (const k of keys) {
          if (k && typeof k === 'object' && String(k.qq) === 'master' && k.key) {
            return { key: k.key, mode: 'personal' }
          }
        }
      }
    }
    const common = this.getCommonKey()
    // 公用兜底仅在公用模式开启时生效（设置公用 Key 不会自动开启）
    if (common && this.isCommonMode()) return { key: common, mode: 'common' }
    return { key: '', mode: null }
  }

  /** 按 QQ 保存 Key（同一 QQ 重复绑定会覆盖旧 Key，不影响其他用户） */
  saveApiKey(key, qq) {
    const filePath = `${PluginPath}/data/KEY/MOANKEY.yaml`
    if (typeof this._data['KEY'] !== 'object' || this._data['KEY'] === null) {
      this._data['KEY'] = {}
    }
    let keys = this.get('KEY.MOANKEY.keys')
    if (!Array.isArray(keys)) keys = []
    // 旧字符串 key 迁移为 master 归属，避免丢失
    keys = keys.map(k => (typeof k === 'string' ? { qq: 'master', key: k } : k))
    qq = String(qq)
    keys = keys.filter(k => k && typeof k === 'object' && String(k.qq) !== qq)
    keys.push({ qq, key })

    if (typeof this._data['KEY']['MOANKEY'] !== 'object' || this._data['KEY']['MOANKEY'] === null) {
      this._data['KEY']['MOANKEY'] = {}
    }
    this._data['KEY']['MOANKEY']['keys'] = keys
    this._writeYaml(filePath, this._data['KEY']['MOANKEY'])
  }

  /** 链接自动解析开关（默认启用，主人可禁用） */
  getLinkParseEnabled() {
    const v = this.get('KEY.MOANKEY.link_parse_enabled')
    return v === undefined || v === null ? true : !!v
  }

  setLinkParseEnabled(on) {
    const filePath = `${PluginPath}/data/KEY/MOANKEY.yaml`
    if (typeof this._data['KEY']['MOANKEY'] !== 'object' || this._data['KEY']['MOANKEY'] === null) {
      this._data['KEY']['MOANKEY'] = {}
    }
    this._data['KEY']['MOANKEY']['link_parse_enabled'] = !!on
    this._writeYaml(filePath, this._data['KEY']['MOANKEY'])
  }

  _writeYaml(filePath, data) {
    try {
      const dir = filePath.substring(0, filePath.lastIndexOf('/'))
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(filePath, YAML.stringify(data, { indent: 2, lineWidth: 200 }), 'utf8')
    } catch (e) {
      logger.error(`[MATOOL] 写入 ${filePath} 失败: ${e.message}`)
    }
  }
}

export default new Cfg()
