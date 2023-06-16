import { BotApi, GameApi, plugin, name, dsc, verify } from '../../../model/api/api.js'
export class BoxInformation extends plugin {
  constructor() {
    super({
      name,
      dsc,
      rule: [
        { reg: /^(#|\/)基础信息$/, fnc: 'showUserMsg' },
        { reg: /^(#|\/)面板信息$/, fnc: 'showQquipment' },
        { reg: /^(#|\/)功法信息$/, fnc: 'showTalent' }
      ]
    })
  }
  showUserMsg = async (e) => {
    if (!verify(e)) return false
    const UID = e.user_id
    if (!(await GameApi.GameUser.existUserSatus({ UID }))) {
      e.reply('已仙鹤')
      return false
    }
    const { path, name, data } = await GameApi.Information.userDataShow({
      UID: e.user_id
    })
    const isreply = await e.reply(await BotApi.ImgIndex.showPuppeteer({ path, name, data }))
    await BotApi.User.surveySet({ e, isreply })
    return false
  }
  showQquipment = async (e) => {
    if (!verify(e)) return false
    const UID = e.user_id
    if (!(await GameApi.GameUser.existUserSatus({ UID }))) {
      e.reply('已仙鹤')
      return false
    }
    const { path, name, data } = await GameApi.Information.userEquipmentShow({
      UID: e.user_id
    })
    const isreply = await e.reply(await BotApi.ImgIndex.showPuppeteer({ path, name, data }))
    await BotApi.User.surveySet({ e, isreply })
    return false
  }
  showTalent = async (e) => {
    if (!verify(e)) return false
    const UID = e.user_id
    if (!(await GameApi.GameUser.existUserSatus({ UID }))) {
      e.reply('已仙鹤')
      return false
    }
    const { path, name, data } = await GameApi.Information.userTalentShow({
      UID: e.user_id
    })
    const isreply = await e.reply(await BotApi.ImgIndex.showPuppeteer({ path, name, data }))
    await BotApi.User.surveySet({ e, isreply })
    return false
  }
}