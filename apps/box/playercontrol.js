import { GameApi, plugin } from '../../model/api/index.js'
export class BoxPlayerControl extends plugin {
  constructor() {
    super({
      rule: [
        { reg: /^(#|\/)降妖$/, fnc: 'dagong' },
        { reg: /^(#|\/)闭关$/, fnc: 'biguan' },
        { reg: /^(#|\/)出关$/, fnc: 'chuGuan' },
        { reg: /^(#|\/)归来$/, fnc: 'endWork' }
      ]
    })
  }

  async biguan(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.existUserSatus(e.user_id)) {
      e.reply('已仙鹤')
      return false
    }
    const { state, msg } = GameApi.Wrap.GoMini(e.user_id)
    if (state == 4001) {
      e.reply(msg)
      return false
    }
    const nowTime = new Date().getTime()
    const actionObject = {
      actionID: 0,
      startTime: nowTime
    }
    GameApi.Wrap.setAction(UID, actionObject)
    e.reply('开始两耳不闻窗外事...')
    return false
  }

  async dagong(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.existUserSatus(e.user_id)) {
      e.reply('已仙鹤')
      return false
    }
    const { state, msg } = GameApi.Wrap.Go(e.user_id)
    if (state == 4001) {
      e.reply(msg)
      return false
    }
    const nowTime = new Date().getTime()
    const actionObject = {
      actionID: 1,
      startTime: nowTime
    }
    GameApi.Wrap.setAction(UID, actionObject)
    e.reply('开始外出...')
    return false
  }

  async chuGuan(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.existUserSatus(UID)) {
      e.reply('已仙鹤')
      return false
    }
    let action = GameApi.Wrap.getAction(UID)
    if (!action) return false
    if (action.actionID != 0) return false
    const startTime = action.startTime
    const cf = GameApi.Defset.getConfig({
      name: 'cooling'
    })
    const timeUnit = cf.biguan.time ? cf.biguan.time : 5
    const time = Math.floor((new Date().getTime() - startTime) / 60000)
    if (time < timeUnit) {
      e.reply('只是呆了一会儿...')
      GameApi.Wrap.deleteAction(UID)
      return false
    }
    GameApi.Wrap.deleteAction(UID)
    this.upgrade(UID, time, action.actionID, e)
    return false
  }

  async endWork(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.existUserSatus(UID)) {
      e.reply('已仙鹤')
      return false
    }
    let action = GameApi.Wrap.getAction(UID)
    if (!action) return false
    if (action.actionID != 1) return false
    const startTime = action.startTime
    const cf = GameApi.Defset.getConfig({
      name: 'cooling'
    })
    const timeUnit = cf.work.time ? cf.work.time : 5
    const time = Math.floor((new Date().getTime() - startTime) / 60000)
    if (time < timeUnit) {
      e.reply('只是呆了一会儿...')
      GameApi.Wrap.deleteAction(UID)
      return false
    }
    GameApi.Wrap.deleteAction(UID)
    this.upgrade(UID, time, action.actionID, e)
    return false
  }

  upgrade = (userId, time, name, e) => {
    const UID = userId
    const talent = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'user_talent'
    })
    const buff = Math.floor(talent.talentsize / 100) + Number(1)
    const appSize = GameApi.Defset.getConfig({
      name: 'cooling'
    })
    let map = {
      闭关: 'biguan',
      降妖: 'work'
    }
    let other = Math.floor(appSize[map[name]].size * time * buff)
    if (Math.random() * (100 - 1) + 1 < 20) {
      other -= Math.floor(other / 3)
    }
    let othername = 'experience'
    let msg = `闭关结束\n[修为]*${other}`
    if (name != '闭关') {
      othername = 'experiencemax'
      msg = `降妖归来\n[气血]*${other}`
    }
    GameApi.Player.updataUser({
      UID,
      CHOICE: 'user_level',
      ATTRIBUTE: othername,
      SIZE: other
    })
    GameApi.Player.updataUserBlood({ UID, SIZE: Number(90) })
    msg += '\n[血量状态]90%'
    msg += `\n${name}结束`
    e.reply([segment.at(UID), msg])
    return false
  }
}