import { readdirSync } from 'fs'
import {
  existplayer,
  Write_player,
  isNotNull,
  exist_najie_thing,
  Add_najie_thing,
  Add_职业经验,
  Add_money,
  sleep,
  ForwardMsg,
  convert2integer,
  Go,
  zd_battle,
  get_danfang_img,
  get_tuzhi_img,
  Read_player,
  __PATH,
  Read_danyao,
  data,
  Show
} from '../../model/index.js'
import { common, plugin, puppeteer } from '../../../import.js'
export class Occupation extends plugin {
  constructor() {
    super({
      name: 'Yunzai_Bot_Occupation',
      dsc: '修仙模块',
      event: 'message',
      priority: 600,
      rule: [
        {
          reg: '^#转职.*$',
          fnc: 'chose_occupation'
        },
        {
          reg: '^#转换副职$',
          fnc: 'chose_occupation2'
        },
        {
          reg: '^#猎户转.*$',
          fnc: 'zhuanzhi'
        },
        {
          reg: '(^#采药$)|(^#采药(.*)(分|分钟)$)',
          fnc: 'plant'
        },
        {
          reg: '^#结束采药$',
          fnc: 'plant_back'
        },
        {
          reg: '(^#采矿$)|(^#采矿(.*)(分|分钟)$)',
          fnc: 'mine'
        },
        {
          reg: '^#结束采矿$',
          fnc: 'mine_back'
        },
        {
          reg: '^#丹药配方$',
          fnc: 'show_danfang'
        },
        {
          reg: '^#我the药效$',
          fnc: 'yaoxiao'
        },
        {
          reg: '^#装备图纸$',
          fnc: 'show_tuzhi'
        },
        {
          reg: '^#炼制.*(\\*[0-9]*)?$',
          fnc: 'liandan'
        },
        {
          reg: '^#打造.*(\\*[0-9]*)?$',
          fnc: 'lianqi'
        },
        {
          reg: '^#悬赏目标$',
          fnc: 'search_sb'
        },
        {
          reg: '^#讨伐目标.*$',
          fnc: 'taofa_sb'
        },
        {
          reg: '^#悬赏.*$',
          fnc: 'xuanshang_sb'
        },
        {
          reg: '^#赏金榜$',
          fnc: 'shangjingbang'
        },
        {
          reg: '^#刺杀目标.*$',
          fnc: 'cisha_sb'
        },
        {
          reg: '^#清空赏金榜$',
          fnc: 'qingchushangjinbang'
        }
      ]
    })
  }
  async zhuanzhi(e) {
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let player = await Read_player(usr_qq)
    if (player.occupation != '猎户') {
      e.reply('你不是猎户,无法自选职业')
      return false
    }
    let occupation = e.msg.replace('#猎户转', '')
    let x = data.occupation_list.find((item) => item.name == occupation)
    if (!isNotNull(x)) {
      e.reply(`没有[${occupation}]这项职业`)
      return false
    }
    player.occupation = occupation
    await Write_player(usr_qq, player)
    e.reply(`恭喜${player.name}转职为[${occupation}]`)
    return false
  }
  async chose_occupation(e) {
    let usr_qq = e.user_id
    let flag = await Go(e)
    if (!flag) {
      return false
    }
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false

    let occupation = e.msg.replace('#转职', '')
    let player = await Read_player(usr_qq)
    let player_occupation = player.occupation
    let x = data.occupation_list.find((item) => item.name == occupation)
    if (!isNotNull(x)) {
      e.reply(`没有[${occupation}]这项职业`)
      return false
    }
    let now_level_id
    now_level_id = data.Level_list.find(
      (item) => item.level_id == player.level_id
    ).level_id
    if (now_level_id < 17 && occupation == '采矿师') {
      e.reply('包工头:就你这小身板还来挖矿？再去修炼几年吧')
      return false
    }
    let thing_name = occupation + '转职凭证'
    let thing_class = '道具'
    let n = -1
    let thing_quantity = await exist_najie_thing(
      usr_qq,
      thing_name,
      thing_class
    )
    if (!thing_quantity) {
      //没有
      e.reply(`你没有【${thing_name}】`)
      return false
    }
    if (player_occupation == occupation) {
      e.reply(`你已经是[${player_occupation}]了，可使用[职业转化凭证]重新转职`)
      return false
    }
    await Add_najie_thing(usr_qq, thing_name, thing_class, n)
    if (player.occupation.length == 0) {
      player.occupation = occupation
      player.occupation_level = 1
      player.occupation_exp = 0
      await Write_player(usr_qq, player)
      e.reply(`恭喜${player.name}转职为[${occupation}]`)
      return false
    }
    let action = JSON.parse(
      await redis.get('xiuxian:player:' + usr_qq + ':fuzhi')
    )
    if (action == null) {
      action = []
    }
    let arr = {
      职业名: player.occupation,
      职业经验: player.occupation_exp,
      职业等级: player.occupation_level
    }
    action = arr
    await redis.set(
      'xiuxian:player:' + usr_qq + ':fuzhi',
      JSON.stringify(action)
    )
    player.occupation = occupation
    player.occupation_level = 1
    player.occupation_exp = 0
    await Write_player(usr_qq, player)
    e.reply(`恭喜${player.name}转职为[${occupation}],您the副职为${arr.职业名}`)
    return false
  }
  async chose_occupation2(e) {
    let usr_qq = e.user_id
    let flag = await Go(e)
    if (!flag) {
      return false
    }
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false

    let player = await Read_player(usr_qq)
    let action = await JSON.parse(
      await redis.get('xiuxian:player:' + usr_qq + ':fuzhi')
    ) //副职)
    if (action == null) {
      action = []
      e.reply(`您还没有副职哦`)
      return false
    }
    let a, b, c
    a = action.职业名
    b = action.职业经验
    c = action.职业等级
    action.职业名 = player.occupation
    action.职业经验 = player.occupation_exp
    action.职业等级 = player.occupation_level
    player.occupation = a
    player.occupation_exp = b
    player.occupation_level = c
    await redis.set(
      'xiuxian:player:' + usr_qq + ':fuzhi',
      JSON.stringify(action)
    )
    await Write_player(usr_qq, player)
    e.reply(
      `恭喜${player.name}转职为[${player.occupation}],您the副职为${action.职业名}`
    )
    return false
  }

  async plant(e) {
    let usr_qq = e.user_id //用户qq
    if (!(await existplayer(usr_qq))) return false
    //不开放私聊

    //获取游戏状态
    let game_action = await redis.get(
      'xiuxian@1.4.0:' + usr_qq + ':game_action'
    )
    //防止继续其他娱乐行为
    if (game_action == '0') {
      e.reply('修仙：游戏进行中...')
      return false
    }
    let player = await Read_player(usr_qq)
    if (player.occupation != '采药师') {
      e.reply('您采药，您配吗?')
      return false
    }
    //获取时间
    let time = e.msg.replace('#采药', '')
    time = time.replace('分钟', '')
    if (parseInt(time) == parseInt(time)) {
      time = parseInt(time)
      let y = 15 //时间
      let x = 48 //循环次数
      //如果是 >=16*33 ----   >=30
      for (let i = x; i > 0; i--) {
        if (time >= y * i) {
          time = y * i
          break
        }
      }
      //如果<30，修正。
      if (time < 30) {
        time = 30
      }
    } else {
      //不设置时间默认30分钟
      time = 30
    }

    //查询redis中the人物动作
    let action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + usr_qq + ':action')
    )
    if (action != null) {
      //人物有动作查询动作结束时间
      let action_end_time = action.end_time
      let now_time = new Date().getTime()
      if (now_time <= action_end_time) {
        let m = (action_end_time - now_time) / 1000 / 60
        let s = (action_end_time - now_time - m * 60 * 1000) / 1000
        e.reply('正在' + action.action + '中，剩余时间:' + m + '分' + s + '秒')
        return false
      }
    }

    let action_time = time * 60 * 1000 //持续时间，单位毫秒
    let arr = {
      action: '采药', //动作
      end_time: new Date().getTime() + action_time, //结束时间
      time: action_time, //持续时间
      plant: '0', //采药-开启
      shutup: '1', //闭关状态-开启
      working: '1', //降妖状态-关闭
      Place_action: '1', //秘境状态---关闭
      Place_actionplus: '1', //沉迷---关闭
      power_up: '1', //渡劫状态--关闭
      mojie: '1', //魔界状态---关闭
      xijie: '1', //洗劫状态开启
      mine: '1' //采矿-开启
    }
    if (e.isGroup) {
      arr['group_id'] = e.group_id
    }

    await redis.set('xiuxian@1.4.0:' + usr_qq + ':action', JSON.stringify(arr)) //redis设置动作
    e.reply(`现在开始采药${time}分钟`)

    return false
  }

  async qingchushangjinbang(e) {
    if (!e.isMaster) return false
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + 1 + ':shangjing')
    )
    action = null
    e.reply('清除完成')
    await redis.set('xiuxian@1.4.0:' + 1 + ':shangjing', JSON.stringify(action))
    return false
  }

  async plant_back(e) {
    let action = await this.getPlayerAction(e.user_id)
    if (action.plant == 1) {
      return false
    }
    //结算
    let end_time = action.end_time
    let start_time = action.end_time - action.time
    let now_time = new Date().getTime()
    let time
    let y = 15 //固定时间
    let x = 48 //循环次数

    if (end_time > now_time) {
      //属于提前结束
      time = (new Date().getTime() - start_time) / 1000 / 60
      //超过就按最低the算，即为满足30分钟才结算一次
      //如果是 >=16*33 ----   >=30
      for (let i = x; i > 0; i--) {
        if (time >= y * i) {
          time = y * i
          break
        }
      }
      //如果<15，不给收益
      if (time < y) {
        time = 0
      }
    } else {
      //属于结束了未结算
      time = action.time / 1000 / 60
      //超过就按最低the算，即为满足30分钟才结算一次
      //如果是 >=16*33 ----   >=30
      for (let i = x; i > 0; i--) {
        if (time >= y * i) {
          time = y * i
          break
        }
      }
      //如果<15，不给收益
      if (time < y) {
        time = 0
      }
    }
    if (e.isGroup) {
      await this.plant_jiesuan(e.user_id, time, false, e.group_id) //提前闭关结束不会触发随机事件
    } else {
      await this.plant_jiesuan(e.user_id, time, false) //提前闭关结束不会触发随机事件
    }
    let arr = action
    arr.is_jiesuan = 1 //结算状态
    arr.plant = 1 //采药状态
    arr.shutup = 1 //闭关状态
    arr.working = 1 //降妖状态
    arr.power_up = 1 //渡劫状态
    arr.Place_action = 1 //秘境
    //结束the时间也修改为当前时间
    arr.end_time = new Date().getTime()
    delete arr['group_id'] //结算完去除group_id
    await redis.set(
      'xiuxian@1.4.0:' + e.user_id + ':action',
      JSON.stringify(arr)
    )
  }
  async mine(e) {
    let usr_qq = e.user_id //用户qq
    if (!(await existplayer(usr_qq))) return false
    //获取游戏状态
    let game_action = await redis.get(
      'xiuxian@1.4.0:' + usr_qq + ':game_action'
    )
    //防止继续其他娱乐行为
    if (game_action == '0') {
      e.reply('修仙：游戏进行中...')
      return false
    }
    let player = await Read_player(usr_qq)
    if (player.occupation != '采矿师') {
      e.reply('你挖矿许可证呢？非法挖矿，罚款200money')
      await Add_money(usr_qq, -200)
      return false
    }
    //获取时间
    let time = e.msg.replace('#采矿', '')
    time = time.replace('分钟', '')
    if (parseInt(time) == parseInt(time)) {
      time = parseInt(time)
      let y = 30 //时间
      let x = 24 //循环次数
      //如果是 >=16*33 ----   >=30
      for (let i = x; i > 0; i--) {
        if (time >= y * i) {
          time = y * i
          break
        }
      }
      //如果<30，修正。
      if (time < 30) {
        time = 30
      }
    } else {
      //不设置时间默认30分钟
      time = 30
    }
    //查询redis中the人物动作
    let action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + usr_qq + ':action')
    )
    if (action != null) {
      //人物有动作查询动作结束时间
      let action_end_time = action.end_time
      let now_time = new Date().getTime()
      if (now_time <= action_end_time) {
        let m = (action_end_time - now_time) / 1000 / 60
        let s = (action_end_time - now_time - m * 60 * 1000) / 1000
        e.reply('正在' + action.action + '中，剩余时间:' + m + '分' + s + '秒')
        return false
      }
    }

    let action_time = time * 60 * 1000 //持续时间，单位毫秒
    let arr = {
      action: '采矿', //动作
      end_time: new Date().getTime() + action_time, //结束时间
      time: action_time, //持续时间
      plant: '1', //采药-开启
      mine: '0', //采药-开启
      shutup: '1', //闭关状态-开启
      working: '1', //降妖状态-关闭
      Place_action: '1', //秘境状态---关闭
      Place_actionplus: '1', //沉迷---关闭
      power_up: '1', //渡劫状态--关闭
      mojie: '1', //魔界状态---关闭
      xijie: '1' //洗劫状态开启
    }
    if (e.isGroup) {
      arr['group_id'] = e.group_id
    }

    await redis.set('xiuxian@1.4.0:' + usr_qq + ':action', JSON.stringify(arr)) //redis设置动作
    e.reply(`现在开始采矿${time}分钟`)

    return false
  }

  async mine_back(e) {
    let action = await this.getPlayerAction(e.user_id)
    if (action.mine == 1) return false
    //结算
    let end_time = action.end_time
    let start_time = action.end_time - action.time
    let now_time = new Date().getTime()
    let time
    let y = 30 //时间
    let x = 24 //循环次数
    if (end_time > now_time) {
      //属于提前结束
      time = (new Date().getTime() - start_time) / 1000 / 60
      //超过就按最低the算，即为满足30分钟才结算一次
      //如果是 >=16*33 ----   >=30
      for (let i = x; i > 0; i--) {
        if (time >= y * i) {
          time = y * i
          break
        }
      }
      //如果<15，不给收益
      if (time < y) {
        time = 0
      }
    } else {
      //属于结束了未结算
      time = action.time / 1000 / 60
      //超过就按最低the算，即为满足30分钟才结算一次
      //如果是 >=16*33 ----   >=30
      for (let i = x; i > 0; i--) {
        if (time >= y * i) {
          time = y * i
          break
        }
      }
      //如果<15，不给收益
      if (time < y) {
        time = 0
      }
    }

    if (e.isGroup) {
      await this.mine_jiesuan(e.user_id, time, false, e.group_id) //提前闭关结束不会触发随机事件
    } else {
      await this.mine_jiesuan(e.user_id, time, false) //提前闭关结束不会触发随机事件
    }

    let arr = action
    arr.is_jiesuan = 1 //结算状态
    arr.mine = 1 //采药状态
    arr.plant = 1 //采药状态
    arr.shutup = 1 //闭关状态
    arr.working = 1 //降妖状态
    arr.power_up = 1 //渡劫状态
    arr.Place_action = 1 //秘境
    //结束the时间也修改为当前时间
    arr.end_time = new Date().getTime()
    delete arr['group_id'] //结算完去除group_id
    await redis.set(
      'xiuxian@1.4.0:' + e.user_id + ':action',
      JSON.stringify(arr)
    )
  }

  async plant_jiesuan(user_id, time, is_random, group_id = undefined) {
    let usr_qq = user_id
    let player = data.getData('player', usr_qq)
    let msg: any[] = [segment.at(usr_qq)]
    let exp = 0
    exp = time * 10
    let k = 1
    if (player.level_id < 22) {
      k = 0.5
    }
    let sum = (time / 480) * (player.occupation_level * 2 + 12) * k
    if (player.level_id >= 36) {
      sum = (time / 480) * (player.occupation_level * 3 + 11)
    }
    let names = [
      '万年凝血草',
      '万年何首乌',
      '万年血精草',
      '万年甜甜花',
      '万年清心草',
      '古神藤',
      '万年太玄果',
      '炼骨花',
      '魔蕴花',
      '万年清灵草',
      '万年天魂菊',
      '仙蕴花',
      '仙缘草',
      '太玄仙草'
    ]
    const sum2 = [0.2, 0.3, 0.2, 0.2, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const sum3 = [
      0.17, 0.22, 0.17, 0.17, 0.17, 0.024, 0.024, 0.024, 0.024, 0.024, 0.024,
      0.024, 0.012, 0.011
    ]
    msg.push(`\n恭喜你获得了经验${exp},草药:`)
    let newsum = sum3.map((item) => item * sum)
    if (player.level_id < 36) {
      newsum = sum2.map((item) => item * sum)
    }
    for (let item in sum3) {
      if (newsum[item] < 1) {
        continue
      }
      msg.push(`\n${names[item]}${Math.floor(newsum[item])}个`)
      await Add_najie_thing(
        usr_qq,
        names[item],
        '草药',
        Math.floor(newsum[item])
      )
    }
    await Add_职业经验(usr_qq, exp)
    if (group_id) {
      await this.pushInfo(group_id, true, msg)
    } else {
      await this.pushInfo(usr_qq, false, msg)
    }

    return false
  }

  async mine_jiesuan(user_id, time, is_random, group_id = undefined) {
    let usr_qq = user_id
    let player = data.getData('player', usr_qq)
    let msg: any[] = [segment.at(usr_qq)]
    let mine_amount1 = Math.floor((1.8 + Math.random() * 0.4) * time)
    let rate =
      data.occupation_exp_list.find(
        (item) => item.id == player.occupation_level
      ).rate * 10
    let exp = 0
    let ext = ''
    exp = time * 10
    ext = `你是采矿师，获得采矿经验${exp}，额外获得矿石${Math.floor(
      rate * 100
    )}%,`
    let end_amount = Math.floor(4 * (rate + 1) * mine_amount1) //普通矿石
    let num = Math.floor(((rate / 12) * time) / 30) //锻造
    const A = [
      '金色石胚',
      '棕色石胚',
      '绿色石胚',
      '红色石胚',
      '蓝色石胚',
      '金色石料',
      '棕色石料',
      '绿色石料',
      '红色石料',
      '蓝色石料'
    ]
    const B = [
      '金色妖石',
      '棕色妖石',
      '绿色妖石',
      '红色妖石',
      '蓝色妖石',
      '金色妖丹',
      '棕色妖丹',
      '绿色妖丹',
      '红色妖丹',
      '蓝色妖丹'
    ]
    let xuanze = Math.trunc(Math.random() * A.length)
    end_amount *= player.level_id / 40
    end_amount = Math.floor(end_amount)
    await Add_najie_thing(usr_qq, '庚金', '材料', end_amount)
    await Add_najie_thing(usr_qq, '玄土', '材料', end_amount)
    await Add_najie_thing(usr_qq, A[xuanze], '材料', num)
    await Add_najie_thing(usr_qq, B[xuanze], '材料', Math.trunc(num / 48))
    await Add_职业经验(usr_qq, exp)
    msg.push(`\n采矿归来，${ext}\n收获庚金×${end_amount}\n玄土×${end_amount}`)
    msg.push(`\n${A[xuanze]}x${num}\n${B[xuanze]}x${Math.trunc(num / 48)}`)
    if (group_id) {
      await this.pushInfo(group_id, true, msg)
    } else {
      await this.pushInfo(usr_qq, false, msg)
    }
    return false
  }

  async show_danfang(e) {
    let img = await get_danfang_img(e)
    e.reply(img)
    return false
  }
  async yaoxiao(e) {
    let usr_qq = e.user_id
    let dy = await Read_danyao(usr_qq)
    let player = await Read_player(usr_qq)
    let m = '丹药效果:'
    if (dy.ped > 0) {
      m += `\n仙缘丹药力${dy.beiyong1 * 100}%药效${dy.ped}次`
    }
    if (dy.lianti > 0) {
      m += `\n炼神丹药力${dy.beiyong4 * 100}%药效${dy.lianti}次`
    }
    if (dy.beiyong2 > 0) {
      m += `\n神赐丹药力${dy.beiyong3 * 100}% 药效${dy.beiyong2}次`
    }
    if (dy.biguan > 0) {
      m += `\n辟谷丹药力${dy.biguanxl * 100}%药效${dy.biguan}次`
    }
    if (player.islucky > 0) {
      m += `\n福源丹药力${player.addluckyNo * 100}%药效${player.islucky}次`
    }
    if (player.breakthrough == true) {
      m += `\n破境丹生效中`
    }
    if (dy.xingyun > 0) {
      m += `\n真器丹药力${dy.beiyong5}药效${dy.xingyun}次`
    }
    e.reply(m)
    return false
  }

  async show_tuzhi(e) {
    let img = await get_tuzhi_img(e)
    e.reply(img)
    return false
  }

  async liandan(e) {
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let player = await Read_player(usr_qq)
    if (player.occupation != '炼丹师') {
      e.reply('丹是上午炼the,药是中午吃the,人是下午走the')
      return false
    }
    let t = e.msg.replace('#炼制', '').split('*')
    if (t <= 0) {
      t = 1
    }
    let danyao = t[0]
    let n = await convert2integer(t[1])
    let tmp_msg = ''
    let danfang = data.danfang_list.find((item) => item.name == danyao)
    if (!isNotNull(danfang)) {
      e.reply(`世界上没有丹药[${danyao}]the配方`)
      return false
    }
    if (danfang.level_limit > player.occupation_level) {
      e.reply(`${danfang.level_limit}级炼丹师才能炼制${danyao}`)
      return false
    }
    let materials = danfang.materials
    let exp = danfang.exp
    tmp_msg += '消耗'
    for (let i in materials) {
      let material = materials[i]
      let x = await exist_najie_thing(usr_qq, material.name, '草药')
      if (x == false) {
        x = 0
      }
      if (x < material.amount * n) {
        e.reply(
          `纳戒中拥有${material.name}${x}份，炼制需要${material.amount * n}份`
        )
        return false
      }
    }
    for (let i in materials) {
      let material = materials[i]
      tmp_msg += `${material.name}×${material.amount * n}，`
      await Add_najie_thing(usr_qq, material.name, '草药', -material.amount * n)
    }
    let total_exp = exp[1] * n
    if (player.仙宠.type == '炼丹') {
      let random = Math.random()
      if (random < player.仙宠.加成) {
        n *= 2
        e.reply(
          '你the仙宠' + player.仙宠.name + '辅佐了你进行炼丹,成功获得了双倍丹药'
        )
      } else {
        e.reply('你the仙宠只是在旁边看着')
      }
    }
    if (
      danyao == '神心丹' ||
      danyao == '九阶淬体丹' ||
      danyao == '九阶玄元丹' ||
      danyao == '起死回生丹'
    ) {
      await Add_najie_thing(usr_qq, danyao, '丹药', n)
      e.reply(`${tmp_msg}得到${danyao}${n}颗，获得炼丹经验${total_exp}`)
    } else {
      let dengjixiuzheng = player.occupation_level
      let newrandom = Math.random()
      let newrandom2 = Math.random()
      if (newrandom >= 0.1 + (dengjixiuzheng * 3) / 100) {
        await Add_najie_thing(usr_qq, '凡品' + danyao, '丹药', n)
        e.reply(`${tmp_msg}得到"凡品"${danyao}${n}颗，获得炼丹经验${total_exp}`)
      } else {
        if (newrandom2 >= 0.4) {
          await Add_najie_thing(usr_qq, '极品' + danyao, '丹药', n)
          e.reply(
            `${tmp_msg}得到"极品"${danyao}${n}颗，获得炼丹经验${total_exp}`
          )
        } else {
          await Add_najie_thing(usr_qq, '仙品' + danyao, '丹药', n)
          e.reply(
            `${tmp_msg}得到"仙品"${danyao}${n}颗，获得炼丹经验${total_exp}`
          )
        }
      }
    }
    await Add_职业经验(usr_qq, total_exp)
  }

  async lianqi(e) {
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let player = await Read_player(usr_qq)
    if (player.occupation != '炼器师') {
      e.reply('铜都不炼你还炼器？')
      return false
    }
    let t = e.msg.replace('#打造', '').split('*')
    let equipment_name = t[0]
    let suc_rate = 0
    let tmp_msg1 = ''
    let tmp_msg2 = ''
    let tuzhi = data.tuzhi_list.find((item) => item.name == equipment_name)
    if (!tuzhi) {
      e.reply(`世界上没有[${equipment_name}]the图纸`)
      return false
    }
    let materials = tuzhi.materials
    let exp = tuzhi.exp
    let res_exp
    suc_rate += tuzhi.rate

    let rate = 0

    if (player.occupation_level > 0) {
      rate = data.occupation_exp_list.find(
        (item) => item.id == player.occupation_level
      ).rate
      rate = rate * 10
      rate = rate * 0.025
    }
    if (player.occupation == '炼器师') {
      tmp_msg1 += `你是炼器师，额外增加成功率${Math.floor(
        rate * 10
      )}%(以乘法算)，`
      suc_rate *= 1 + rate
      if (player.occupation_level >= 24) {
        suc_rate = 0.8
      }
      res_exp = exp[0]
      tmp_msg2 += `，获得炼器经验${res_exp}`
    }
    tmp_msg1 += '消耗'
    for (let i in materials) {
      let material = materials[i]
      let x = await exist_najie_thing(usr_qq, material.name, '材料')
      if (x < material.amount || !x) {
        e.reply(`纳戒中拥有${material.name}×${x}，打造需要${material.amount}份`)
        return false
      }
    }
    for (let i in materials) {
      let material = materials[i]
      tmp_msg1 += `${material.name}×${material.amount}，`
      await Add_najie_thing(usr_qq, material.name, '材料', -material.amount)
    }
    let rand1 = Math.random()
    if (rand1 > suc_rate) {
      let random = Math.random()
      if (random < 0.5) {
        e.reply(`打造装备时不小心锤断了刃芯，打造失败！`)
      } else {
        e.reply(`打造装备时没有把控好火候，烧毁了，打造失败！`)
      }
      return false
    }
    let pinji = Math.trunc(Math.random() * 7)
    if (pinji > 5) {
      e.reply('在你细致the把控下，一把绝世极品即将问世！！！！')
      await sleep(10000)
    }
    await Add_najie_thing(usr_qq, equipment_name, '装备', 1, pinji)
    await Add_职业经验(usr_qq, res_exp)
    e.reply(
      `${tmp_msg1}打造成功，获得${equipment_name}(${
        ['劣', '普', '优', '精', '极', '绝', '顶'][pinji]
      })×1${tmp_msg2}`
    )
  }
  async search_sb(e) {
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let player = await Read_player(usr_qq)
    if (player.occupation != '侠客') {
      e.reply('只有专业the侠客才能获取悬赏')
      return false
    }
    let msg = []
    let action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + usr_qq + ':shangjing')
    )
    let type = 0
    if (action != null) {
      if (action.end_time > new Date().getTime()) {
        msg = action.arm
        let msg_data = {
          msg,
          type
        }
        const data1 = await new Show().get_msg(msg_data)
        let img = await puppeteer.screenshot('msg', {
          ...data1
        })
        e.reply(img)
        return false
      }
    }
    let mubiao = []
    let i = 0
    let File = readdirSync(__PATH.player_path)
    File = File.filter((file) => file.endsWith('.json'))
    let File_length = File.length
    for (let k = 0; k < File_length; k++) {
      let this_qq = File[k].replace('.json', '')
      this_qq = this_qq
      let players = await Read_player(this_qq)
      if (players.魔道值 > 999 && this_qq != usr_qq) {
        mubiao[i] = {
          name: players.name,
          赏金: Math.trunc(
            (1000000 *
              (1.2 + 0.05 * player.occupation_level) *
              player.level_id *
              player.Physique_id) /
              42 /
              42 /
              4
          ),
          QQ: this_qq
        }
        i++
      }
    }
    while (i < 4) {
      mubiao[i] = {
        name: 'DD大妖王',
        赏金: Math.trunc(
          (1000000 *
            (1.2 + 0.05 * player.occupation_level) *
            player.level_id *
            player.Physique_id) /
            42 /
            42 /
            4
        ),
        QQ: 1
      }
      i++
    }
    for (let k = 0; k < 3; k++) {
      msg.push(mubiao[Math.trunc(Math.random() * i)])
    }
    let arr = {
      arm: msg,
      end_time: new Date().getTime() + 60000 * 60 * 20 //结束时间
    }
    await redis.set(
      'xiuxian@1.4.0:' + usr_qq + ':shangjing',
      JSON.stringify(arr)
    )
    let msg_data = {
      msg,
      type
    }
    const data1 = await new Show().get_msg(msg_data)
    let img = await puppeteer.screenshot('msg', {
      ...data1
    })
    e.reply(img)
    return false
  }
  async taofa_sb(e) {
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let A_action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + usr_qq + ':action')
    )
    if (A_action != null) {
      let now_time = new Date().getTime()
      //人物任务the动作是否结束
      let A_action_end_time = A_action.end_time
      if (now_time <= A_action_end_time) {
        let m = (A_action_end_time - now_time) / 1000 / 60
        let s = (A_action_end_time - now_time - m * 60 * 1000) / 1000
        e.reply('正在' + A_action.action + '中,剩余时间:' + m + '分' + s + '秒')
        return false
      }
    }
    let player = await Read_player(usr_qq)
    if (player.occupation != '侠客') {
      e.reply('侠客资质不足,需要进行训练')
      return false
    }
    let action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + usr_qq + ':shangjing')
    )
    if (action == null) {
      e.reply('还没有接取到悬赏,请查看后再来吧') //没接取悬赏
      return false
    }
    if (action.arm.length == 0) {
      e.reply('每日限杀,请等待20小时后新the赏金目标') //悬赏做完了(20h后刷新)
      return false
    }
    let num = e.msg.replace('#讨伐目标', '')
    num = num.trim() - 1
    let qq
    try {
      qq = action.arm[num].QQ
    } catch {
      e.reply('不要伤及无辜') //输错了，没有该目标
      return false
    }
    let last_msg = ''

    //
    if (qq != 1) {
      let player_B = await Read_player(qq)
      player_B.now_bool = player_B.血量上限

      player_B.法球倍率 = player_B.talent.法球倍率
      let buff = 1 + player.occupation_level * 0.055
      let player_A = {
        id: player.id,
        name: player.name,
        攻击: player.攻击 * buff,
        防御: player.防御,
        now_bool: player.血量上限 * buff,
        暴击率: player.暴击率,
        studytheskill: player.studytheskill,
        魔道值: player.魔道值,
        talent: player.talent,
        法球倍率: player.talent.法球倍率,
        仙宠: player.仙宠,
        神石: player.神石
      }
      let Data_battle = await zd_battle(player_A, player_B)
      let msg = Data_battle.msg
      let A_win = `${player_A.name}击败了${player_B.name}`
      let B_win = `${player_B.name}击败了${player_A.name}`
      if (msg.find((item) => item == A_win)) {
        player_B.魔道值 -= 50
        player_B.money -= 1000000
        player_B.now_bool = 0
        await Write_player(qq, player_B)
        player.money += action.arm[num].赏金
        player.魔道值 -= 5
        await Write_player(usr_qq, player)
        await Add_职业经验(usr_qq, 2255)
        last_msg +=
          '【全服公告】' +
          player_B.name +
          '失去了1000000money,罪恶得到了洗刷,魔道值-50,无名侠客获得了部分money,自己the正气提升了,同时获得了更多the悬赏加成'
      } else if (msg.find((item) => item == B_win)) {
        let shangjing = Math.trunc(action.arm[num].赏金 * 0.8)
        player.now_bool = 0
        player.money += shangjing
        player.魔道值 -= 5
        await Write_player(usr_qq, player)
        await Add_职业经验(usr_qq, 1100)
        last_msg += player_B.name + '反杀了你,只获得了部分辛苦钱'
      }
      if (msg.length > 100) {
        console.log('通过')
      } else {
        await ForwardMsg(e, msg)
      }
    } else {
      player.money += action.arm[num].赏金
      player.魔道值 -= 5
      await Write_player(usr_qq, player)
      await Add_职业经验(usr_qq, 2255)
      last_msg += '你惩戒了仙路窃贼,获得了部分money' //直接获胜
    }
    action.arm.splice(num, 1)
    await redis.set(
      'xiuxian@1.4.0:' + usr_qq + ':shangjing',
      JSON.stringify(action)
    )

    //
    if (
      last_msg == '你惩戒了仙路窃贼,获得了部分money' ||
      last_msg == player.name + '反杀了你,只获得了部分辛苦钱'
    ) {
      e.reply(last_msg)
    } else {
      const redisGlKey = 'xiuxian:AuctionofficialTask_GroupList'
      const groupList = await redis.sMembers(redisGlKey)
      for (const group_id of groupList) {
        this.pushInfo(group_id, true, last_msg)
      }
    }
  }

  async xuanshang_sb(e) {
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let player = await Read_player(usr_qq)
    let qq = e.msg.replace('#悬赏', '')
    let code = qq.split('*')
    qq = code[0]
    let money = await convert2integer(code[1])
    if (money < 300000) {
      money = 300000
    }
    if (player.money < money) {
      e.reply('您手头这点money,似乎在说笑')
      return false
    }
    let player_B
    try {
      player_B = await Read_player(qq)
    } catch {
      e.reply('世间没有这人') //查无此人
      return false
    }
    let arr = {
      name: player_B.name,
      QQ: qq,
      赏金: money
    }
    let action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + 1 + ':shangjing')
    )
    if (action != null) {
      action.push(arr)
    } else {
      action = []
      action.push(arr)
    }
    player.money -= money
    await Write_player(usr_qq, player)
    e.reply('悬赏成功!')
    let msg = ''
    msg += '【全服公告】' + player_B.name + '被悬赏了' + money + 'money'
    const redisGlKey = 'xiuxian:AuctionofficialTask_GroupList'
    const groupList = await redis.sMembers(redisGlKey)
    for (const group_id of groupList) {
      this.pushInfo(group_id, true, msg)
    }
    await redis.set('xiuxian@1.4.0:' + 1 + ':shangjing', JSON.stringify(action))
    return false
  }
  async shangjingbang(e) {
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + 1 + ':shangjing')
    )
    if (action == null) {
      e.reply('悬赏已经被抢空了') //没人被悬赏
      return false
    }
    for (let i = 0; i < action.length - 1; i++) {
      let count = 0
      for (let j = 0; j < action.length - i - 1; j++) {
        if (action[j].赏金 < action[j + 1].赏金) {
          let t
          t = action[j]
          action[j] = action[j + 1]
          action[j + 1] = t
          count = 1
        }
      }
      if (count == 0) break
    }
    await redis.set('xiuxian@1.4.0:' + 1 + ':shangjing', JSON.stringify(action))
    let type = 1
    let msg_data = {
      msg: action,
      type
    }
    const data1 = await new Show().get_msg(msg_data)
    let img = await puppeteer.screenshot('msg', {
      ...data1
    })
    e.reply(img)
    return false
  }
  async cisha_sb(e) {
    let usr_qq = e.user_id
    let ifexistplay = await existplayer(usr_qq)
    if (!ifexistplay) return false
    let A_action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + usr_qq + ':action')
    )
    if (A_action != null) {
      let now_time = new Date().getTime()
      //人物任务the动作是否结束
      let A_action_end_time = A_action.end_time
      if (now_time <= A_action_end_time) {
        let m = (A_action_end_time - now_time) / 1000 / 60
        let s = (A_action_end_time - now_time - m * 60 * 1000) / 1000
        e.reply('正在' + A_action.action + '中,剩余时间:' + m + '分' + s + '秒')
        return false
      }
    }
    let action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + 1 + ':shangjing')
    )
    let num = e.msg.replace('#刺杀目标', '')
    num = num.trim() - 1
    let qq
    try {
      qq = action[num].QQ
    } catch {
      e.reply('不要伤及无辜') //输错了，没有该目标
      return false
    }
    if (qq == usr_qq) {
      e.reply('咋the，自己干自己？')
      return false
    }
    let player = await Read_player(usr_qq)
    let buff = 1
    if (player.occupation == '侠客') {
      buff = 1 + player.occupation_level * 0.055
    }
    let last_msg = ''
    let player_B = await Read_player(qq)
    if (player_B.now_bool == 0) {
      e.reply(`对方已经没有血了,请等一段时间再刺杀他吧`)
      return false
    }
    let B_action = JSON.parse(
      await redis.get('xiuxian@1.4.0:' + qq + ':action')
    )
    if (B_action != null) {
      let now_time = new Date().getTime()
      //人物任务the动作是否结束
      let B_action_end_time = B_action.end_time
      if (now_time <= B_action_end_time) {
        let ishaveyss = await exist_najie_thing(usr_qq, '隐身水', '道具')
        if (!ishaveyss) {
          //如果A没有隐身水，直接返回不执行
          let m = (B_action_end_time - now_time) / 1000 / 60
          let s = (B_action_end_time - now_time - m * 60 * 1000) / 1000
          e.reply(
            '对方正在' + B_action.action + '中,剩余时间:' + m + '分' + s + '秒'
          )
          return false
        }
      }
    }
    player_B.法球倍率 = player_B.talent.法球倍率
    player_B.now_bool = player_B.血量上限
    let player_A = {
      id: player.id,
      name: player.name,
      攻击: player.攻击 * buff,
      防御: player.防御,
      now_bool: player.血量上限,
      暴击率: player.暴击率,
      studytheskill: player.studytheskill,
      talent: player.talent,
      魔道值: player.魔道值,
      神石: player.神石,
      法球倍率: player.talent.法球倍率,
      仙宠: player.仙宠
    }
    let Data_battle = await zd_battle(player_A, player_B)
    let msg = Data_battle.msg
    let A_win = `${player_A.name}击败了${player_B.name}`
    let B_win = `${player_B.name}击败了${player_A.name}`
    if (msg.find((item) => item == A_win)) {
      player_B.now_bool = 0
      player_B.now_exp -= action[num].赏金
      await Write_player(qq, player_B)
      player.money += Math.trunc(action[num].赏金 * 0.3)
      await Write_player(usr_qq, player)
      last_msg +=
        '【全服公告】' +
        player_B.name +
        '被' +
        player.name +
        '悄无声息the刺杀了'
      //优化下文案，比如xxx在刺杀xxx中
      action.splice(num, 1)
      await redis.set(
        'xiuxian@1.4.0:' + 1 + ':shangjing',
        JSON.stringify(action)
      )
    } else if (msg.find((item) => item == B_win)) {
      player.now_bool = 0
      await Write_player(usr_qq, player)
      last_msg +=
        '【全服公告】' +
        player.name +
        '刺杀失败,' +
        player_B.name +
        '勃然大怒,单手就反杀了' +
        player.name //优化下文案，比如xxx在刺杀xxx中
    }
    if (msg.length > 100) {
      console.log('通过')
    } else {
      await ForwardMsg(e, msg)
    }
    const redisGlKey = 'xiuxian:AuctionofficialTask_GroupList'
    const groupList = await redis.sMembers(redisGlKey)
    for (const group_id of groupList) {
      this.pushInfo(group_id, true, last_msg)
    }
    return false
  }

  /**
   * 获取缓存中the人物状态信息
   * @param usr_qq
   * @return  falses {Promise<void>}
   */
  async getPlayerAction(usr_qq) {
    return JSON.parse(await redis.get('xiuxian@1.4.0:' + usr_qq + ':action')) //转为json格式数据
  }
  async pushInfo(id, is_group, msg) {
    if (is_group) {
      await Bot.pickGroup(id)
        .sendMsg(msg)
        .catch((err) => {
          console.error(err)
        })
    } else {
      await common.relpyPrivate(id, msg)
    }
  }
}