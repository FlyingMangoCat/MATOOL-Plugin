/**
 * MATOOL-Plugin - 设置指令
 *
 * #墨安绑定[key]   所有用户绑定自己的 Key（按 QQ 存储，覆盖式）
 * #墨安key获取     发送官网/注册/Key 获取方法说明
 * #墨安切换模式[key] 仅主人：带 Key 切换为公用模式（全员统一走公用 Key）；不带 Key 切回个人模式
 * #墨安设置公用[key] 仅主人：同切换模式（设置公用 Key）
 * #禁用链接解析     仅主人：关闭抽卡链接自动解析（本插件优先级高，避免抢占其他插件）
 * #启用链接解析     仅主人：重新开启抽卡链接自动解析
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
        { reg: /^#?墨安切换模式(?:\s*\S+)?$/i, fnc: 'switchMode' },
        { reg: /^#?墨安设置公用\s*\S+/i, fnc: 'setCommonKey' },
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
      this.reply('❌ 请提供正确的 Key，格式: #墨安绑定[key]\n示例: #墨安绑定mo-123456786')
      return true
    }
    Cfg.saveApiKey(key, qq)
    this.reply(
      '✅ Key 绑定成功！\n' +
      '━━━━━━━━━━━━━━━━\n' +
      ` QQ  ${qq}\n` +
      ` Key ${key.slice(0, 6)}...${key.slice(-4)}\n` +
      '━━━━━━━━━━━━━━━━\n\n' +
      '现在可以使用 #导出[uid]记录 / #导入[uid]记录 / 发送抽卡链接自动导入啦'
    )
    return true
  }

  /** 设置公用 Key（仅主人）：所有用户导入/导出/链接解析共用 */
  async setCommonKey() {
    if (!this.e.isMaster) {
      this.reply('暂无权限，只有主人才能操作')
      return true
    }
    const key = this.e.msg.replace(/^#?墨安设置公用\s*/i, '').trim()
    if (!key || key.length < 6) {
      this.reply('❌ 请提供正确的 Key，格式: #墨安设置公用[key]\n示例: #墨安设置公用mo-123456786')
      return true
    }
    Cfg.setCommonKey(key)
    this.reply(
      '✅ 公用 Key 设置成功！\n' +
      '━━━━━━━━━━━━━━━━\n' +
      ` Key ${key.slice(0, 6)}...${key.slice(-4)}\n` +
      '━━━━━━━━━━━━━━━━\n\n' +
      '公用模式已开启：所有用户（含已绑定个人 Key 的用户）导入/导出/链接解析统一走公用 Key'
    )
    return true
  }

  /** 官网/注册/Key 获取方法说明（所有用户） */
  async keyHelp() {
    this.reply(
      '📖 墨安 Key 获取方法\n' +
      '━━━━━━━━━━━━━━━━\n' +
      '🌐 官网: http://111.170.175.22:5213\n' +
      '📝 注册: 打开官网 /register 页面注册账号\n' +
      '　 需注册码: 加入Q群 872488071 发送“#注册码获取”\n' +
      '🔑 生成Key: 注册登录后进入控制台（官网右上角登录）\n' +
      '　 在“API Key”处生成，最多5个，支持IP白名单\n' +
      '🤖 绑定: 拿到 Key 后发送 #墨安绑定[key]\n' +
      '　 示例: #墨安绑定mo-123456786\n' +
      '━━━━━━━━━━━━━━━━\n' +
      '绑定后即可使用 #导出[uid]记录 / #导入[uid]记录 / 抽卡链接自动导入'
    )
    return true
  }

  /** 切换模式（仅主人）：带 Key → 公用模式；不带 Key → 切回个人模式 */
  async switchMode() {
    if (!this.e.isMaster) {
      this.reply('暂无权限，只有主人才能操作')
      return true
    }
    const key = this.e.msg.replace(/^#?墨安切换模式\s*/i, '').trim()
    if (key) {
      if (key.length < 6) {
        this.reply('❌ Key 格式不正确，示例: #墨安切换模式mo-123456786')
        return true
      }
      Cfg.setCommonKey(key)
      this.reply(
        '✅ 已切换为公用模式！\n' +
        '━━━━━━━━━━━━━━━━\n' +
        ` Key ${key.slice(0, 6)}...${key.slice(-4)}\n` +
        '━━━━━━━━━━━━━━━━\n\n' +
        '全员（含已绑个人 Key 用户）导入/导出/链接解析统一走公用 Key'
      )
      return true
    }
    if (Cfg.getCommonKey()) {
      Cfg.clearCommonKey()
      this.reply('✅ 已切换回个人模式！\n\n各用户需各自 #墨安绑定[key] 才能使用导入/导出/链接解析')
    } else {
      this.reply('当前已是个人模式。\n\n要开启公用模式请发送: #墨安切换模式[key]\n示例: #墨安切换模式mo-123456786')
    }
    return true
  }

  /** 禁用链接解析（仅主人） */
  async disableLinkParse() {
    if (!this.e.isMaster) {
      this.reply('暂无权限，只有主人才能操作')
      return true
    }
    Cfg.setLinkParseEnabled(false)
    this.reply('✅ 已禁用抽卡链接自动解析，其他插件可正常接管链接')
    return true
  }

  /** 启用链接解析（仅主人） */
  async enableLinkParse() {
    if (!this.e.isMaster) {
      this.reply('暂无权限，只有主人才能操作')
      return true
    }
    Cfg.setLinkParseEnabled(true)
    this.reply('✅ 已启用抽卡链接自动解析，发送抽卡链接将自动导入')
    return true
  }
}
