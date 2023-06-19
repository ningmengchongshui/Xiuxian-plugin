import listdata from '../data/listdata.js'

class Levels {
  constructor() {
    this.LEVELMAP = {
      // 练气
      0: 'gaspractice',
      // 练体
      1: 'bodypractice',
      // 练魂
      2: 'soul'
    }
    this.NAMEMAP = {
      // 练气
      0: '修为',
      // 练体
      1: '气血',
      // 练魂
      2: '魂力'
    }
  }

  // 提升境界
  enhanceRealm(UID, id) {
    const LevelList = listdata.controlAction({ NAME: this.LEVELMAP[id], CHOICE: 'fixed_levels' })
    const UserLevel = listdata.controlAction({ NAME: UID, CHOICE: 'user_level' })
    let realm = UserLevel.level[this.LEVELMAP[id]].realm
    realm += 1
    // 境界上限了
    if (!LevelList[realm]) {
      return {
        state: 4001,
        msg: null
      }
    }
    let experience = UserLevel.level[this.LEVELMAP[id]].experience
    /** 判断经验够不够 */
    if (experience < LevelList[realm].exp) {
      return {
        state: 4001,
        msg: `${this.NAMEMAP[id]}不足`
      }
    }
    // 减少境界
    UserLevel.level[this.LEVELMAP[id]].experience -= LevelList[realm].exp
    // 调整境界
    UserLevel.level[this.LEVELMAP[id]].realm = realm
    /** 保存境界信息  */
    listdata.controlAction({ NAME: UID, CHOICE: 'user_level', DATA: UserLevel })
    return {
      state: 2000,
      msg: `境界提升至${LevelList[realm].name}`
    }
  }

  // 掉落境界
  fallingRealm(UID, id) {
    // 读取境界
    const LevelList = listdata.controlAction({ NAME: this.LEVELMAP[id], CHOICE: 'fixed_levels' })
    const UserLevel = listdata.controlAction({ NAME: UID, CHOICE: 'user_level' })
    let realm = UserLevel.level[this.LEVELMAP[id]].realm
    realm -= 1
    // 已经是最低境界
    if (!LevelList[realm]) {
      return {
        state: 4001,
        msg: null
      }
    }
    // 调整境界
    UserLevel.level[this.LEVELMAP[id]].realm = realm
    /** 保存境界信息 */
    listdata.controlAction({ NAME: UID, CHOICE: 'user_level', DATA: UserLevel })
    return {
      state: 2000,
      msg: `境界跌落至${LevelList[realm].name}`
    }
  }
}

export default new Levels()