import { plugin, BotApi, GameApi, AssociationApi } from '../../model/api/index.js'
//汐颜
export class BlessPlace extends plugin {
  constructor() {
    super({
      rule: [
        {
          reg: /^(#|\/)洞天福地列表$/,
          fnc: 'List_blessPlace'
        },
        {
          reg: /^(#|\/)开采灵脉$/,
          fnc: 'exploitation_vein'
        },
        {
          reg: /^(#|\/)入驻洞天.*$/,
          fnc: 'Settled_Blessed_Place'
        },
        {
          reg: /^(#|\/)修建.*$/,
          fnc: 'construction_Guild'
        },
        {
          reg: /^(#|\/)查看宗门建筑$/,
          fnc: 'show_Association_Builder'
        },
        {
          reg: /^(#|\/)集合攻打.*$/,
          fnc: 'Association_Battle'
        }
      ]
    })
  }
  async Association_Battle(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    const ifexistplay = await AssociationApi.assUser.existArchive(UID)
    if (!ifexistplay || !e.isGroup) {
      return false
    }
    const assPlayer = AssociationApi.assUser.getAssOrPlayer(1, UID)
    if (assPlayer.assName == 0 || assPlayer.assJob < 8) {
      return false
    }
    let assName = await e.msg.replace('#集合攻打', '')
    assName = assName.trim()
    const assRelation = AssociationApi.assUser.assRelationList.find((item) => item.name == assName)
    if (!assRelation) {
      e.reply(`该宗门不存在！`)
      return false
    }

    assName = assRelation.id
    const battleAss = AssociationApi.assUser.getAssOrPlayer(2, assName)
    if (battleAss.resident.name == 0 || battleAss.id == assPlayer.assName) {
      return false
    }
    //读取被攻打的宗门势力范围
    const attackAss = AssociationApi.assUser.getAssOrPlayer(2, assPlayer.assName)

    const positionList = await GameApi.UserData.controlAction({
      NAME: 'position',
      CHOICE: 'generate_position'
    })
    const position = positionList.find((item) => item.name == battleAss.resident.name)

    const attack = await getFightMember(attackAss.allMembers, position)
    const battle = await getFightMember(battleAss.allMembers, position)
    let msg = ['___[战斗过程]___']
    msg.push('攻打方参与者:' + attack.toString())
    msg.push('防守方参与者:' + battle.toString())
    const attackObj = await SealingFormation(attack)
    msg.push('你们结成了攻伐大阵，誓要攻破对方的山门，抢夺下这块驻地！')
    const battleObj = await SealingFormation(battle)
    battleObj.defense += Math.trunc(battleAss.facility[5].buildNum / 200) * 2500
    msg.push('防守方依托宗门大阵，誓要将你们击退！')
    switch (battleAss.divineBeast) {
      case 1:
        battleObj.burst += 25
        msg.push('麒麟祥瑞降临，防守方变得幸运，更容易打出暴击了！')
        break
      case 2:
        battleObj.nowblood += 50000
        msg.push('青龙属木主生机，降下生命赐福，防守方血量提升了！')
        break
      case 3:
        battleObj.attack += 8000
        msg.push('白虎属金主杀伐，降下攻击赐福，防守方伤害变高了！')
        break
      case 4:
        battleObj.burstmax += 50
        msg.push('朱雀属火主毁灭，降下伤害赐福，防守方爆伤提升了！')
        break
      case 5:
        battleObj.defense += 8000
        msg.push('玄武属水主守护，降下免伤赐福，防守方防御提升了！')
        break
      default:
        msg.push('防守方没有神兽，并不能获得战斗加成')
    }
    msg.push('掀起宗门大战，波及范围甚广，有违天和，进攻方全体魔力值加2点')
    await BotApi.User.forwardMsg({ e, data: msg })
    //开打！
    const res = await AssBattle(e, attackObj, battleObj)
    //赢！
    if (battleAss.facility[5].status != 0) {
      battleAss.facility[5].buildNum -= 200
    }
    if (res == 1) {
      battleAss.resident = {
        id: 0,
        name: 0,
        level: 0
      }
      battleAss.facility = battleAss.facility.map(function (i) {
        i.buildNum = 0
        i.status = 0
        return i
      })
    }
    await AssociationApi.assUser.checkFacility(battleAss)
    await AddPrestige(attack)
    return false
  }

  //秘境地点
  async List_blessPlace(e) {
    if (!this.verify(e)) return false
    let addres = '洞天福地'
    let weizhi = AssociationApi.assUser.blessPlaceList
    await GoBlessPlace(e, weizhi, addres)
  }

  //入驻洞天
  async Settled_Blessed_Place(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    const ifexistplay = await AssociationApi.assUser.existArchive(UID)
    if (!ifexistplay || !e.isGroup) {
      return false
    }
    const assPlayer = AssociationApi.assUser.getAssOrPlayer(1, UID)
    if (assPlayer.assName == 0 || assPlayer.assJob < 10) {
      return false
    }
    const ass = AssociationApi.assUser.getAssOrPlayer(2, assPlayer.assName)
    let blessed_name = e.msg.replace('#入驻洞天', '')
    blessed_name = blessed_name.trim()
    //洞天不存在
    const dongTan = await AssociationApi.assUser.blessPlaceList.find(
      (item) => item.name == blessed_name
    )
    if (!dongTan) {
      e.reply(`[${blessed_name}]不存在`)
      return false
    }
    const positionList = await GameApi.UserData.controlAction({
      NAME: 'point',
      CHOICE: 'generate_position'
    })
    const point = positionList.find((item) => item.name == blessed_name)

    //取洞天点位，是否在位置，在--->是否被占领
    const action = await GameApi.GameUser.userMsgAction({
      NAME: UID,
      CHOICE: 'user_action'
    })
    if (action.x != point.x || action.y != point.y) {
      e.reply('不在该洞天位置')
      return false
    }

    const allNames = await AssociationApi.assUser.readAssNames('association')

    for (let i = 0; i < allNames.length; i++) {
      const this_name = allNames[i].replace('.json', '')
      const this_ass = await AssociationApi.assUser.getAssOrPlayer(2, this_name)
      if (this_ass.resident.name == dongTan.name) {
        e.reply(`你尝试带着宗门入驻${dongTan.name}，却发现有宗门捷足先登了，只能通过开战强夺驻地了`)
        return false
      }
    }
    ass.resident = dongTan
    ass.facility = ass.facility.map((i) => {
      i.buildNum = Math.trunc(i.buildNum * 0.7)
      i.status = 0
      return i
    })
    AssociationApi.assUser.setAssOrPlayer('association', ass.id, ass)
    e.reply(`入驻成功,${ass.id}当前驻地为:${dongTan.name},原有建设值继承70%，需要重新修建以启用`)
    return false
  }

  async exploitation_vein(e) {
    const UID = e.user_id
    const ifexistplay = await AssociationApi.assUser.existArchive(UID)
    if (!ifexistplay || !e.isGroup) {
      return false
    }

    const assPlayer = AssociationApi.assUser.getAssOrPlayer(1, UID)
    if (assPlayer.assName == 0) {
      return false
    }

    const ass = AssociationApi.assUser.getAssOrPlayer(2, assPlayer.assName)

    if (ass.resident.name == 0) {
      e.reply(`你的宗门还没有驻地哦，没有灵脉可以开采`)
      return false
    }
    const positionList = await GameApi.UserData.controlAction({
      NAME: 'position',
      CHOICE: 'generate_position'
    })
    const position = positionList.find((item) => item.name == ass.resident.name)
    const action = await GameApi.GameUser.userMsgAction({
      NAME: UID,
      CHOICE: 'user_action'
    })
    if (
      action.x < position.x1 ||
      action.x > position.x2 ||
      action.y < position.y1 ||
      action.y > position.y2
    ) {
      e.reply(`请先回驻地范围`)
      return false
    }
    const now = new Date()
    const nowTime = now.getTime() //获取当前日期的时间戳
    const Today = await AssociationApi.assUser.timeInvert(nowTime)
    const lastExplorTime = await await AssociationApi.assUser.timeInvert(assPlayer.lastExplorTime) //获得上次宗门签到日期
    if (Today.Y == lastExplorTime.Y && Today.M == lastExplorTime.M && Today.D == lastExplorTime.D) {
      e.reply(`今日已经开采过灵脉，不可以竭泽而渔哦，明天再来吧`)
      return false
    }
    assPlayer.lastExplorTime = nowTime

    let gift_lingshi = 0
    const player = await GameApi.GameUser.userMsgAction({
      NAME: UID,
      CHOICE: 'user_level'
    })
    gift_lingshi = 500 * ass.resident.level * player.level_id

    const num = Math.trunc(gift_lingshi)

    if (ass.spiritStoneAns + num > AssociationApi.config.spiritStoneAnsMax[ass.level - 1]) {
      ass.spiritStoneAns = AssociationApi.config.spiritStoneAnsMax[ass.level - 1]
    } else {
      ass.spiritStoneAns += num
    }

    assPlayer.contributionPoints += Math.trunc(num / 2000)
    assPlayer.historyContribution += Math.trunc(num / 2000)
    AssociationApi.assUser.setAssOrPlayer('association', ass.id, ass)
    AssociationApi.assUser.setAssOrPlayer('assPlayer', UID, assPlayer)
    e.reply(
      `本次开采灵脉为宗门灵石池贡献了${gift_lingshi}灵石，你获得了` +
        Math.trunc(num / 2000) +
        `点贡献点`
    )

    return false
  }

  async construction_Guild(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    //用户不存在
    const ifexistplay = await AssociationApi.assUser.existArchive(UID)
    if (!ifexistplay || !e.isGroup) {
      return false
    }
    const player = await GameApi.GameUser.userMsgAction({
      NAME: UID,
      CHOICE: 'user_level'
    })
    const assPlayer = AssociationApi.assUser.getAssOrPlayer(1, UID)
    if (assPlayer.assName == 0) {
      return false
    }

    let ass = await AssociationApi.assUser.getAssOrPlayer(2, assPlayer.assName)
    if (ass.resident.name == 0) {
      e.reply(`你的宗门还没有驻地，无法建设宗门`)
      return false
    }

    let buildName = e.msg.replace('#修建', '')
    buildName = buildName.trim()
    //洞天不存在
    const location = AssociationApi.config.buildNameList.findIndex((item) => item == buildName)
    if (location == -1) {
      return false
    }

    const positionList = await GameApi.UserData.controlAction({
      NAME: 'position',
      CHOICE: 'generate_position'
    })
    const position = positionList.find((item) => item.name == ass.resident.name)
    const action = await GameApi.GameUser.userMsgAction({
      NAME: UID,
      CHOICE: 'user_action'
    })
    if (
      action.x < position.x1 ||
      action.x > position.x2 ||
      action.y < position.y1 ||
      action.y > position.y2
    ) {
      e.reply(`请先回宗门`)
      return false
    }

    if (location != 0 && ass.facility[0].status == 0) {
      e.reply(`宗门驻地里连块平地都没有,你修建啥呀,先给山门修修吧`)
      return false
    }

    const CDTime = 60
    const ClassCD = ':buildFacility'
    const now_time = new Date().getTime()

    const cdSecond = GameApi.GamePublic.getRedis(UID, ClassCD)
    if (cdSecond.expire) {
      e.reply(`修建cd中，剩余${cdSecond.expire}！`)
      return false
    }

    GameApi.GamePublic.setRedis(UID + ClassCD, now_time, CDTime)

    let add = Math.trunc(player.level_id / 10) + 3

    ass.facility[location].buildNum += add

    assPlayer.contributionPoints += Math.trunc(add / 2) + 1
    assPlayer.historyContribution += Math.trunc(add / 2) + 1
    await AssociationApi.assUser.checkFacility(ass)
    ass = await AssociationApi.assUser.getAssOrPlayer(2, assPlayer.assName)
    let msg = ass.facility[location].status == 0 ? '未启用' : '启用'
    AssociationApi.assUser.setAssOrPlayer('assPlayer', UID, assPlayer)
    e.reply(
      `建设成功，为${buildName}增加了${add}点建设值，当前该设施建设总值为${ass.facility[location].buildNum},状态为` +
        msg
    )
    return false
  }

  async show_Association_Builder(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    //用户不存在
    const ifexistplay = await AssociationApi.assUser.existArchive(UID)
    if (!ifexistplay || !e.isGroup) {
      return false
    }
    const assPlayer = AssociationApi.assUser.getAssOrPlayer(1, UID)
    if (assPlayer.assName == 0) {
      return false
    }

    const ass = await AssociationApi.assUser.getAssOrPlayer(2, assPlayer.assName)

    let msg = [`__[宗门建筑]__`]

    for (let i = 0; i < ass.facility.length; i++) {
      msg.push(
        '建筑名称:' +
          AssociationApi.config.buildNameList[i] +
          '\n' +
          '建设值:' +
          ass.facility[i].buildNum +
          '\n' +
          '建筑状态:' +
          (ass.facility[i].status == 0 ? '未启用' : '启用')
      )
    }
    await BotApi.User.forwardMsg({ e, data: msg })
  }
}

/**
 * 地点查询
 */
async function GoBlessPlace(e, weizhi, addres) {
  let adr = addres
  let msg = ['***' + adr + '***']
  for (let i = 0; i < weizhi.length; i++) {
    msg.push(
      weizhi[i].name +
        '\n' +
        '等级:' +
        weizhi[i].level +
        '\n' +
        '修炼效率:' +
        weizhi[i].efficiency * 100 +
        '%'
    )
  }
  await BotApi.User.forwardMsg({ e, data: msg })
}
async function getFightMember(members, position) {
  let res = []
  for (let i = 0; i < members.length; i++) {
    const action = await GameApi.GameUser.userMsgAction({
      NAME: members[i],
      CHOICE: 'user_action'
    })
    if (
      action.x >= position.x1 &&
      action.x <= position.x2 &&
      action.y >= position.y1 &&
      action.y <= position.y2
    ) {
      res.push(members[i])
    }
  }
  return res
}
async function SealingFormation(members) {
  let res = {
    nowblood: 0,
    attack: 0,
    defense: 0,
    blood: 999999999,
    burst: 0,
    burstmax: 50,
    speed: 0,
    power: 0
  }
  for (let i = 0; i < members.length; i++) {
    const battle = await GameApi.GameUser.userMsgAction({
      NAME: members[i],
      CHOICE: 'user_battle'
    })
    res.nowblood += battle.nowblood
    res.attack += battle.attack
    res.defense += battle.defense
    res.speed += battle.speed
    res.burst += 5
    res.burstmax += 10
  }
  return res
}
async function AssBattle(e, battleA, battleB) {
  let msg = []
  let qq = 1
  if (battleA.speed >= battleB.speed) {
    let hurt = battleA.attack - battleB.defense >= 0 ? battleA.attack - battleB.defense + 1 : 1

    if (await battle_probability(battleA.burst)) {
      hurt += Math.floor((hurt * battleA.burstmax) / 100)
    }
    battleB.nowblood = battleB.nowblood - hurt
    if (battleB.nowblood < 1) {
      e.reply('你们结成的阵法过于强大，只一招就攻破了对面的山门！')
      return qq
    } else {
      msg.push('你们催动法力，造成' + hurt + '伤害')
    }
  }
  //循环回合，默认从B攻击开始
  var x = 1
  var y = 0
  var z = 1
  while (true) {
    x++
    z++
    //分片发送消息
    if (x == 15) {
      await BotApi.User.forwardMsg({ e, data: msg })
      msg = []
      x = 0
      y++
      if (y == 2) {
        qq = battleA.nowblood > battleB.nowblood ? 1 : 0
        //就打2轮回
        break
      }
    }
    //B开始
    let hurt = battleB.attack - battleA.defense >= 0 ? battleB.attack - battleA.defense + 1 : 1
    if (await battle_probability(battleB.burst)) {
      hurt += Math.floor((hurt * battleB.burstmax) / 100)
    }
    battleA.nowblood = battleA.nowblood - hurt
    if (battleA.nowblood < 0) {
      msg.push('第' + z + '回合:对方依靠大阵回击，造成' + hurt + '伤害')
      await BotApi.User.forwardMsg({ e, data: msg })
      e.reply('你们的进攻被击退了！！')
      qq = 0
      break
    } else {
      msg.push('第' + z + '回合:对方依靠大阵回击，造成' + hurt + '伤害')
    }
    //A开始
    hurt = battleA.attack - battleB.defense >= 0 ? battleA.attack - battleB.defense + 1 : 1
    if (await battle_probability(battleA.burst)) {
      hurt += Math.floor((hurt * battleA.burstmax) / 100)
    }
    battleB.nowblood = battleB.nowblood - hurt
    if (battleB.nowblood < 0) {
      msg.push('第' + z + '回合:你们结阵攻伐，造成' + hurt + '伤害')
      await BotApi.User.forwardMsg({ e, data: msg })
      e.reply('你们击破了对面的山门！')
      break
    } else {
      msg.push('第' + z + '回合:你们结阵攻伐，造成' + hurt + '伤害')
    }
  }
  return qq
}
//暴击率
const battle_probability = async (P) => {
  if (P > 100) {
    return true
  }
  if (P < 0) {
    return false
  }
  const rand = Math.floor(Math.random() * (100 - 1) + 1)
  if (P > rand) {
    return true
  }
  return false
}
const AddPrestige = async (members) => {
  for (let i = 0; i < members.length; i++) {
    await GameApi.GameUser.updataUser({
      UID: members[i],
      CHOICE: 'user_level',
      ATTRIBUTE: 'prestige',
      SIZE: Number(2)
    })
  }
}