/**
 * MATOOL-Plugin - 设置指令
 *
 * #墨安绑定[key]       所有用户绑定自己的 Key（按 QQ 存储，覆盖式）
 * #墨安key获取         发送官网/注册/Key 获取方法说明
 * #墨安设置公用[key]   仅主人：设置公用 Key（设置后自动开启公用模式）
 * #墨安切换公用模式    仅主人：启用公用模式（需已设置公用 Key）
 * #墨安切换个人模式    仅主人：切回个人模式（清除公用 Key）
 * #禁用链接解析        仅主人：关闭抽卡链接自动解析（本插件优先级高，避免抢占其他插件）
 * #启用链接解析        仅主人：重新开启抽卡链接自动解析
 */
import plugin from '../../../lib/plugins/plugin.js'
import { Cfg } from '../components/index.js'

export class matSet extends plugin {
  constructor() {
    super({
      name: 'MATOOL:设置',
      dsc: '墨安工具设置',
      event: 'message',
      priority: 500,
      rule: [
        { reg: /^#?墨安绑定\s*\S+/i, fnc: 'bindKey' },
        { reg: /^#?墨安key获取$/i, fnc: 'keyHelp' },
        { reg: /^#?墨安设置公用\s*\S+/i, fnc: 'setCommonKey' },
        { reg: /^#?墨安切换公用模式$/i, fnc: 'switchCommon' },
        { reg: /^#?墨安切换个人模式$/i, fnc: 'switchPersonal' },
        { reg: /^#?禁用链接解析$/i, fnc: 'disableLinkParse' },
        { reg: /^#?启用链接解析$/i, fnc: 'enableLinkParse' },
      ],
    })
  }

  /** 绑定 Key：所有用户可用，按 QQ 存入 data/KEY/MOANKEY.yaml */
  async bindKey() {
    const qq = String(this.e.user_id)
    const key = this.e.msg.replace(/^#?墨安绑定\s*/i, '').trim()
    if (!key || key.length < 6) {
      this.reply('请输入KEY哦~ 格式: #墨安绑定[key]')
      return true
    }
    Cfg.saveApiKey(key, qq)
    this.reply('✅ KEY绑定成功！')
    return true
  }

  /** 设置公用 Key（仅主人）：所有用户导入/导出/链接解析共用 */
  async setCommonKey() {
    if (!this.e.isMaster) {
      this.reply('仅主人可用哦~')
      return true
    }
    const key = this.e.msg.replace(/^#?墨安设置公用\s*/i, '').trim()
    if (!key || key.length < 6) {
      this.reply('请输入KEY哦~ 格式: #墨安设置公用[key]')
      return true
    }
    Cfg.setCommonKey(key)
    this.reply('✅ 公用KEY设置成功！')
    return true
  }

  /** 官网/注册/Key 获取方法说明（所有用户） */
  async keyHelp() {
    this.reply(
      '墨安KEY获取\n' +
      '官网: http://111.170.175.22:5213\n' +
      '注册: 官网 /register 注册，需注册码（加群 872488071 发送 #注册码获取）\n' +
      '生成: 登录控制台 - API Key 处生成（最多5个）\n' +
      '绑定: #墨安绑定[key]'
    )
    return true
  }

  /** 切换公用模式（仅主人）：启用已设置的公用 Key（设置公用 Key 不会自动开启） */
  async switchCommon() {
    if (!this.e.isMaster) {
      this.reply('仅主人可用哦~')
      return true
    }
    const key = Cfg.getCommonKey()
    if (!key) {
      this.reply('未设置公用KEY哦~ 请先 #墨安设置公用[key]')
      return true
    }
    Cfg.setCommonMode(true)
    this.reply('✅ 已切换公用模式！')
    return true
  }

  /** 切换个人模式（仅主人）：清除公用 Key */
  async switchPersonal() {
    if (!this.e.isMaster) {
      this.reply('仅主人可用哦~')
      return true
    }
    if (!Cfg.getCommonKey()) {
      this.reply('当前已是个人模式哦~')
      return true
    }
    Cfg.clearCommonKey()
    this.reply('✅ 已切换个人模式！')
    return true
  }

  /** 禁用链接解析（仅主人） */
  async disableLinkParse() {
    if (!this.e.isMaster) {
      this.reply('仅主人可用哦~')
      return true
    }
    Cfg.setLinkParseEnabled(false)
    this.reply('✅ 已禁用链接解析')
    return true
  }

  /** 启用链接解析（仅主人） */
  async enableLinkParse() {
    if (!this.e.isMaster) {
      this.reply('仅主人可用哦~')
      return true
    }
    Cfg.setLinkParseEnabled(true)
    this.reply('✅ 已启用链接解析')
    return true
  }
}
