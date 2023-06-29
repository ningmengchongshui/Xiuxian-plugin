import Data from '../data/index.js'
import levels from './levels.js'
import Equipment from './equipment.js'
import Extend from './extend.js'
class Battle {
  /**
   * 写入
   * @param {*} UID
   * @param {*} DATA
   */
  write(UID, DATA) {
    Data.write(UID, 'playerBattle', DATA)
  }

  /**
   * 读取
   * @param {*} UID
   * @param {*} DATA
   */
  read(UID) {
    return Data.read(UID, 'playerBattle')
  }

  /**
   * 更新面板
   * @param {*} UID
   */
  updatePanel(UID) {
    // 数据读取
    const equipment = Equipment.read(UID)
    const LevelData = levels.read(UID)

    // 固定数据读取
    const GaspracticeList = Data.controlAction({ NAME: 'gaspractice', CHOICE: 'fixed_levels' })
    const BodypracticeList = Data.controlAction({ NAME: 'bodypractice', CHOICE: 'fixed_levels' })
    const SoulList = Data.controlAction({ NAME: 'soul', CHOICE: 'fixed_levels' })

    // 当前境界数据
    const gaspractice = GaspracticeList[LevelData.gaspractice.realm]
    const bodypractice = BodypracticeList[LevelData.bodypractice.realm]
    const soul = SoulList[LevelData.soul.realm]

    // 读取
    const UserBattle = this.read(UID)

    // 临时属性读取
    let extend = Extend.readInitial(UID, {})

    const panel = {
      attack: gaspractice.attack + bodypractice.attack,
      defense: gaspractice.defense + bodypractice.defense,
      blood: gaspractice.blood + bodypractice.blood,
      burst: soul.burst,
      burstmax: soul.burstmax + gaspractice.burstmax,
      speed: gaspractice.speed + bodypractice.speed,
      power: 0
    }

    // 装备数据记录
    const equ = {
      attack: 0,
      defense: 0,
      blood: 0,
      burst: 0,
      burstmax: 0,
      speed: 0
    }
    for (let item of equipment) {
      equ.attack = equ.attack + item.attack
      equ.defense = equ.defense + item.defense
      equ.blood = equ.blood + item.blood
      equ.burst = equ.burst + item.burst
      equ.burstmax = equ.burstmax + item.burstmax
      equ.speed = equ.speed + item.speed
    }

    /* 计算插件临时属性及永久属性 */
    if (Object.keys(extend).length !== 0) {
      extend = Object.values(extend)
      extend.forEach((item) => {
        /* 永久属性计算 */
        equ.attack += item.perpetual.attacks
        equ.defense += item.perpetual.defense
        equ.blood += item.perpetual.blood
        equ.burst += item.perpetual.burst
        equ.burstmax += item.perpetual.burstmax
        equ.speed += item.perpetual.speed
        /* 临时属性计算 */
        if (item.times.length != 0) {
          item.times.forEach((timesitem) => {
            if (timesitem.timeLimit > new Date().getTime()) {
              equ[timesitem.type] += timesitem.value
            }
          })
        }
      })
    }

    /* 双境界面板之和 */

    /**
     * 练体 无双暴
     * 练气 无暴击率
     * 练魂 仅有双暴
     */

    /* 血量上限 换装导致血量溢出时需要----------------计算错误:不能增加血量上限 */
    const bloodLimit = gaspractice.blood + bodypractice.blood + equ.blood
    /* 双境界面板之和 */
    panel.attack = Math.floor(panel.attack * (equ.attack * 0.01 + 1))
    panel.defense = Math.floor(panel.defense * (equ.defense * 0.01 + 1))
    panel.blood = bloodLimit
    panel.nowblood = UserBattle.nowblood > bloodLimit ? bloodLimit : UserBattle.nowblood
    panel.burst += equ.burst
    panel.burstmax += equ.burstmax
    panel.speed += equ.speed
    panel.power =
      panel.attack +
      panel.defense +
      bloodLimit / 2 +
      panel.burst * 100 +
      panel.burstmax * 10 +
      panel.speed * 50
    this.write(UID, panel)
  }
}

export default new Battle()