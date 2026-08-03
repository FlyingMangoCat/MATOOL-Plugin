/**
 * MATOOL-Plugin - 设置指令
 *
 * #墨安绑定[key]   所有用户绑定自己的 Key（按 QQ 存储，覆盖式）
 * #墨安设置公用[key] 仅主人：设置公用 Key，设置后所有用户均可使用导入/导出/链接解析
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
      '所有用户现在都可以直接使用 #导出[uid]记录 / #导入[uid]记录 / 发送抽卡链接自动导入\n（用户自己绑定了 Key 的仍优先用自己绑定的）'
    )
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
