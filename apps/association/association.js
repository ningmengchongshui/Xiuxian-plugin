import { plugin, segment } from "../../api/api.js";
import config from "../../model/config.js";
import data from "../../model/xiuxiandata.js";
import fs from "fs";
import {
  timestampToTime,
  shijianc,
  get_random_fromARR,
  ForwardMsg,
  player_efficiency,
} from "../../model/xiuxian.js";
const 宗门人数上限 = [6, 9, 12, 15, 18, 21];
const 宗门灵石池上限 = [200000, 500000, 800000, 1100000, 1500000, 2000000];
export class association extends plugin {
  constructor() {
    super({
      name: "association",
      dsc: "association",
      event: "message",
      priority: 600,
      rule: [
        {
          reg: "^#加入宗门.*$",
          fnc: "Join_association",
        },
        {
          reg: "^#退出宗门$",
          fnc: "Exit_association",
        },
        {
          reg: "^#宗门(上交|上缴|捐赠)灵石.*$",
          fnc: "give_association_lingshi",
        },
        {
          reg: "^#宗门俸禄$",
          fnc: "gift_association",
        },
        {
          reg: "^#宗门捐献记录$",
          fnc: "Logs_donate",
        },
        {
          reg: "^#(宗门列表)$",
          fnc: "List_appointment",
        },
      ],
    });
  }

  //宗门俸禄
  async gift_association(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
      return;
    }
    if (!e.isGroup) return;
    let player = data.getData("player", usr_qq);
    if (!isNotNull(player.宗门)) {
      return;
    }
    let ass = data.getAssociation(player.宗门.宗门名称);
    let ismt = isNotMaintenance(ass);
    if (ismt) {
      e.reply(`宗门尚未维护，快找宗主维护宗门`);
      return;
    }
    let now = new Date();
    let nowTime = now.getTime(); //获取当前日期的时间戳
    let Today = await shijianc(nowTime);
    let lastsign_time = await getLastsign_Asso(usr_qq); //获得上次宗门签到日期
    if (
      Today.Y == lastsign_time.Y &&
      Today.M == lastsign_time.M &&
      Today.D == lastsign_time.D
    ) {
      e.reply(`今日已经领取过了`);
      return;
    }
    await redis.set(
      "xiuxian:player:" + usr_qq + ":lastsign_Asso_time",
      nowTime
    ); //redis设置签到时间
    //给奖励
    let temp = player.宗门.职位;
    let n = 1;
    if (temp == "外门弟子") n = 1
    if (temp == "内门弟子") n = 2
    if (temp == "长老") n = 3
    if (temp == "宗主") n = 5;
    let gift_lingshi = ass.宗门等级 * 1200 * n;
    player.灵石 += gift_lingshi;
    data.setData("player", usr_qq, player);
    let msg = [
      segment.at(usr_qq),
      `宗门俸禄领取成功,获得了${gift_lingshi}灵石`,
    ];
    e.reply(msg);
    return;
  }

  //加入宗门
  async Join_association(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
      return;
    }
    if (!e.isGroup) return;
    let player = data.getData("player", usr_qq);
    if (isNotNull(player.宗门)) {
      return;
    }

    let now_level_id;
    if (!isNotNull(player.level_id)) {
      e.reply("请先#同步信息");
      return;
    }
    now_level_id = data.level_list.find(
      (item) => item.level_id == player.level_id
    ).level_id;
    if (now_level_id >= 42) {
      e.reply("仙人不可下界！");
      return;
    }

    let association_name = e.msg.replace("#加入宗门", "");
    association_name = association_name.trim();
    let ifexistass = data.existData("association", association_name);
    if (!ifexistass) {
      return;
    }

    let ass = data.getAssociation(association_name);

    if (ass.最低加入境界 > now_level_id) {
      let level = data.level_list.find(
        (item) => item.level_id === ass.最低加入境界
      ).level;
      e.reply(
        `${association_name}招收弟子的最低境界要求为:${level},当前未达到要求`
      );
      return;
    }
    let mostmem = 宗门人数上限[ass.宗门等级 - 1]; //该宗门目前人数上限
    let nowmem = ass.所有成员.length; //该宗门目前人数
    if (mostmem <= nowmem) {
      e.reply(`${association_name}的弟子人数已经达到目前等级最大,无法加入`);
      return;
    }

    let now = new Date();
    let nowTime = now.getTime(); //获取当前时间戳
    let date = timestampToTime(nowTime);
    player.宗门 = {
      宗门名称: association_name,
      职位: "外门弟子",
      time: [date, nowTime],
    };
    await data.setData("player", usr_qq, player);
    ass.所有成员.push(usr_qq);
    ass.外门弟子.push(usr_qq);
    await player_efficiency(usr_qq);
    await data.setAssociation(association_name, ass);
    e.reply(`恭喜你成功加入${association_name}`);
    return;
  }

  //退出宗门
  async Exit_association(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);

    if (!ifexistplay) {
      return;
    }

    if (!e.isGroup) return;

    let player = data.getData("player", usr_qq);
    if (!isNotNull(player.宗门)) {
      return;
    }

    let now = new Date();
    let nowTime = now.getTime(); //获取当前时间戳
    let addTime;

    var time = config.getconfig("xiuxian", "xiuxian").CD.joinassociation; //分钟

    if (typeof player.宗门.time == "undefined") {
      addTime = player.宗门.加入时间[1] + 60000 * time;
    } else {
      //新版本的数据变成了time
      addTime = player.宗门.time[1] + 60000 * time;
    }
    if (addTime > nowTime) {
      e.reply("加入宗门不满" + `${time}分钟,无法退出`);
      return;
    }

    if (player.宗门.职位 != "宗主") {
      let ass = data.getAssociation(player.宗门.宗门名称);
      ass[player.宗门.职位] = ass[player.宗门.职位].filter(
        (item) => item != usr_qq
      );
      ass["所有成员"] = ass["所有成员"].filter((item) => item != usr_qq);

      await data.setAssociation(ass.宗门名称, ass);
      await delete player.宗门;
      await data.setData("player", usr_qq, player);
      await player_efficiency(usr_qq);
      e.reply("退出宗门成功");
    } else {
      let ass = data.getAssociation(player.宗门.宗门名称);
      if (ass.所有成员.length < 2) {
        fs.rmSync(
          `${data.filePathMap.association}/${player.宗门.宗门名称}.json`
        );

        await delete player.宗门; //删除存档里的宗门信息
        await data.setData("player", usr_qq, player);
        await player_efficiency(usr_qq);
        e.reply("退出宗门成功,推出后宗门空无一人,自动解散");
      } else {
        ass["所有成员"] = ass["所有成员"].filter((item) => item != usr_qq); //原来的成员表删掉这个B
        await delete player.宗门; //删除这个B存档里的宗门信息
        await data.setData("player", usr_qq, player);
        await player_efficiency(usr_qq);
        //随机一个幸运儿的QQ,优先挑选等级高的
        let randmember_qq;
        if (ass.长老.length > 0) {
          randmember_qq = await get_random_fromARR(ass.长老);
        } else if (ass.内门弟子.length > 0) {
          randmember_qq = await get_random_fromARR(ass.内门弟子);
        } else {
          randmember_qq = await get_random_fromARR(ass.所有成员);
        }

        let randmember = await data.getData("player", randmember_qq); //获取幸运儿的存档
        ass[randmember.宗门.职位] = ass[randmember.宗门.职位].filter(
          (item) => item != randmember_qq
        ); //原来的职位表删掉这个幸运儿
        ass["宗主"] = randmember_qq; //新的职位表加入这个幸运儿
        randmember.宗门.职位 = "宗主"; //成员存档里改职位

        await data.setData("player", randmember_qq, randmember); //记录到存档
        await data.setData("player", usr_qq, player);
        await data.setAssociation(ass.宗门名称, ass); //记录到宗门
        e.reply(`退出宗门成功,退出后,宗主职位由${randmember.名号}接管`);
      }
    }
    return;
  }

  //捐赠灵石
  async give_association_lingshi(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
      return;
    }
    if (!e.isGroup) return;
    let player = data.getData("player", usr_qq);
    if (!isNotNull(player.宗门)) {
      return;
    }
    //获取灵石数量
    var reg = new RegExp(/#宗门(上交|上缴|捐赠)灵石/);
    let lingshi = e.msg.replace(reg, "");
    lingshi = lingshi.trim(); //去掉空格

    if (!isNaN(parseFloat(lingshi)) && isFinite(lingshi)) {
    } else {
      return;
    }

    //校验输入灵石数
    if (parseInt(lingshi) == parseInt(lingshi) && parseInt(lingshi) > 0) {
      lingshi = parseInt(lingshi);
    } else {
      return;
    }
    if (player.灵石 < lingshi) {
      e.reply(`你身上只有${player.灵石}灵石,数量不足`);
      return;
    }
    let ass = data.getAssociation(player.宗门.宗门名称);

    if (ass.灵石池 + lingshi > 宗门灵石池上限[ass.宗门等级 - 1]) {
      e.reply(
        `${ass.宗门名称}的灵石池最多还能容纳${宗门灵石池上限[ass.宗门等级 - 1] - ass.灵石池
        }灵石,请重新捐赠`
      );
      return;
    }
    ass.灵石池 += lingshi;
    if (!isNotNull(player.宗门.lingshi_donate)) {
      player.宗门.lingshi_donate = 0; //未定义捐赠数量则为0
    }
    player.宗门.lingshi_donate += lingshi;
    await data.setData("player", usr_qq, player);
    await data.setAssociation(ass.宗门名称, ass);
    await setFileValue(usr_qq, -lingshi, "灵石");
    e.reply(
      `捐赠成功,你身上还有${player.灵石 - lingshi}灵石,宗门灵石池目前有${ass.灵石池
      }灵石`
    );
    return;
  }

  //宗门捐献记录
  async Logs_donate(e) {
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
      return;
    }
    if (!e.isGroup) return;
    let player = data.getData("player", usr_qq);
    if (!isNotNull(player.宗门)) {
      return;
    }
    let ass = data.getAssociation(player.宗门.宗门名称);
    let donate_list = [];
    for (let i in ass.所有成员) {
      //遍历所有成员
      let member_qq = ass.所有成员[i];
      let member_data = data.getData("player", member_qq);
      if (!isNotNull(member_data.宗门.lingshi_donate)) {
        member_data.宗门.lingshi_donate = 0; //未定义捐赠数量则为0
      }
      donate_list[i] = {
        name: member_data.名号,
        lingshi_donate: member_data.宗门.lingshi_donate,
      };
    }
    donate_list.sort(sortBy("lingshi_donate"));
    let msg = [`${ass.宗门名称} 灵石捐献记录表`];
    for (let i = 0; i < donate_list.length; i++) {
      msg.push(
        `第${i + 1}名  ${donate_list[i].name}  捐赠灵石:${donate_list[i].lingshi_donate
        }`
      );
    }
    await ForwardMsg(e, msg);

    return;
  }

  //宗门列表
  async List_appointment(e) {
    if (!e.isGroup) return;
    let usr_qq = e.user_id;
    let ifexistplay = data.existData("player", usr_qq);
    if (!ifexistplay) {
      return;
    }
    let dir = data.filePathMap.association;
    let File = fs.readdirSync(dir);
    File = File.filter((file) => file.endsWith(".json")); //这个数组内容是所有的宗门名称

    let temp = ["宗门列表"];
    if (File.length == 0) {
      temp.push("暂时没有宗门数据");
    }
    for (var i = 0; i < File.length; i++) {
      let this_name = File[i].replace(".json", "");
      let this_ass = await data.getAssociation(this_name);
      //处理一下宗门效率问题
      let this_ass_xiuxian = this_ass.宗门等级 * 0.05 * 100;
      this_ass_xiuxian = Math.trunc(this_ass_xiuxian);

      temp.push(
        `序号:${1 + i} ` +
        "\n" +
        `宗名: ${this_ass.宗门名称}` +
        "\n" +
        `人数: ${this_ass.所有成员.length}/${宗门人数上限[this_ass.宗门等级 - 1]
        }` +
        "\n" +
        `等级: ${this_ass.宗门等级}` +
        "\n" +
        `天赋加成: ${this_ass_xiuxian}%` +
        "\n" +
        `宗主: ${this_ass.宗主}`
      );
    }
    await ForwardMsg(e, temp);
    return;
  }
}

/**
 * 增加player文件某属性的值（在原本的基础上增加）
 * @param user_qq
 * @param num 属性的value
 * @param type 修改的属性
 * @returns {Promise<void>}
 */
async function setFileValue(user_qq, num, type) {
  let user_data = data.getData("player", user_qq);
  let current_num = user_data[type]; //当前灵石数量
  let new_num = current_num + num;
  if (type == "当前血量" && new_num > user_data.血量上限) {
    new_num = user_data.血量上限; //治疗血量需要判读上限
  }
  user_data[type] = new_num;
  await data.setData("player", user_qq, user_data);
  return;
}

/**
 * 判断宗门是否需要维护
 * @param ass 宗门对象
 * @returns true or false
 */
function isNotMaintenance(ass) {
  let now = new Date();
  let nowTime = now.getTime(); //获取当前日期的时间戳
  if (ass.维护时间 > nowTime - 1000 * 60 * 60 * 24 * 7) {
    return false;
  }
  return true;
}

/**
 * 判断对象是否不为undefined且不为null
 * @param obj 对象
 * @returns obj==null/undefined,return false,other return true
 */
function isNotNull(obj) {
  if (obj == undefined || obj == null) return false;
  return true;
}

//对象数组排序
function sortBy(field) {
  //从大到小,b和a反一下就是从小到大
  return function (b, a) {
    return a[field] - b[field];
  };
}

//获取上次签到时间
async function getLastsign_Asso(usr_qq) {
  //查询redis中的人物动作
  let time = await redis.get(
    "xiuxian:player:" + usr_qq + ":lastsign_Asso_time"
  );
  if (time != null) return await shijianc(parseInt(time));
  return false;
}