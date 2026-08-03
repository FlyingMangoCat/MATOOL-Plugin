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
   * 取指定 QQ 绑定的 Key
   * 主人（isMaster）额外兼容旧字符串格式/master 归属的 Key
   */
  getKeyByQq(qq, isMaster = false) {
    const keys = this.get('KEY.MOANKEY.keys')
    if (!Array.isArray(keys) || keys.length === 0) return ''
    qq = String(qq)
    for (const k of keys) {
      if (k && typeof k === 'object' && String(k.qq) === qq && k.key) return k.key
    }
    if (isMaster) {
      for (const k of keys) {
        if (k && typeof k === 'object' && String(k.qq) === 'master' && k.key) return k.key
        if (typeof k === 'string') return k // 旧格式兜底
      }
    }
    return ''
  }

  /** 按 QQ 保存 Key（同一 QQ 重复绑定会覆盖旧 Key，不影响其他用户） */
  saveApiKey(key, qq) {
    const filePath = `${PluginPath}/data/KEY/MOANKEY.yaml`
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
