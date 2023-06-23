import Data from '../data/index.js'
import Burial from '../wrap/burial.js'
import Defset from '../data/defset.js'
import Method from '../wrap/method.js'
import Talent from './talent.js'
import Battle from './battle.js'
class Player {
  constructor() {
    this.playerSpecialData = {
      spiritual: 100, // 灵力
      spiritualUpper: 100, // 灵力上限
      prestige: 50, // 煞气
      reputation: 0, // 声望
      virtues: 0
    }
    this.playerLevelData = {
      gaspractice: {
        experience: 0, // 经验
        realm: 0 // 境界
      },
      bodypractice: {
        experience: 0,
        realm: 0
      },
      soul: {
        experience: 0,
        realm: 0
      }
    }
    this.playerActionData = {
      game: 1, // 游戏状态
      Couple: 1, // 双修
      newnoe: 1 // 新人
    }
    this.playerBagData = {
      grade: 1,
      thing: []
    }
    this.FullName = {
      full: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
      name: ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
    }
    this.playerTalent = {
      talentshow: 1, // 显示0,隐藏1
      talentsize: 0, // 天赋
      AllSorcery: [] // 功法
    }
  }

  /**
   * 更新寿命信息
   */
  startLife() {
    const LifeData = Data.controlActionInitial({
      NAME: 'life',
      CHOICE: 'playerLife',
      INITIAL: {}
    })
    // 记录死亡
    const die = []
    const cf = Defset.getConfig('cooling')
    for (let UID in LifeData) {
      LifeData[UID].Age += cf.Age.size ? cf.Age.size : 1
      if (LifeData[UID].Age >= LifeData[UID].life) {
        LifeData[UID].status = 0
        die.push(LifeData[UID].UID)
      }
    }
    Data.controlAction({
      NAME: 'life',
      CHOICE: 'playerLife',
      DATA: LifeData
    })
    // 清除死亡uid
    for (let UID of die) {
      Burial.deleteAction(UID)
    }
  }

  /**
   * 初始化用户信息
   * @param UID  param0
   * @returns
   */
  createPlayer(UID) {
    const NowTime = new Date().getTime()
    const LevelList = Data.controlAction({
      CHOICE: 'fixed_levels',
      NAME: 'gaspractice'
    })
    const LevelMaxList = Data.controlAction({
      CHOICE: 'fixed_levels',
      NAME: 'bodypractice'
    })
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerBattle',
      DATA: {
        nowblood: LevelList[0].blood + LevelMaxList[0].blood // 血量
      }
    })
    // 特殊值
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerSpecial',
      DATA: this.playerSpecialData
    })
    // 境界信息
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerLevel',
      DATA: this.playerLevelData
    })
    const PosirionList = Data.controlAction({
      CHOICE: 'generate_position',
      NAME: 'position'
    })
    const position = PosirionList.find((item) => item.name == '极西')
    const positionID = position.id.split('-')
    const coordinate = {
      mx: Math.floor((position.x2 - position.x1) * Math.random()) + position.x1,
      my: Math.floor((position.y2 - position.y1) * Math.random()) + position.y1
    }
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerAction',
      DATA: {
        ...this.playerActionData,
        x: coordinate.mx,
        y: coordinate.my,
        z: positionID[0], // 位面
        region: positionID[1], // 区域
        address: positionID[2], // 属性
        Exchange: 0
      }
    })
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerBag',
      DATA: this.playerBagData
    })
    const newtalent = Talent.getTalent()
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerTalent',
      DATA: {
        ...this.playerTalent,
        talent: newtalent // 灵根
      }
    })
    const name = Method.Anyarray(this.FullName.full) + Method.Anyarray(this.FullName.name)
    /**
     * ******
     * ******
     */
    const LifeData = Data.controlActionInitial({
      CHOICE: 'playerLife',
      NAME: 'life',
      INITIAL: {}
    })
    LifeData[UID] = {
      name: `${name}`,
      autograph: '无', // 道宣
      Age: 1, // 年龄
      life: Math.floor(Math.random() * (84 - 60) + 60), // 寿命
      createTime: NowTime, // 建立时间
      status: 1 // 是否死亡
    }
    /** 更新用户表 */
    Data.controlAction({
      CHOICE: 'playerLife',
      NAME: 'life',
      DATA: LifeData
    })
    /**
     * ******
     * ******
     */
    // 签到
    const SignData = Data.controlActionInitial({
      CHOICE: 'playerLife',
      NAME: 'sign',
      INITIAL: {}
    })
    SignData[UID] = {
      signTine: NowTime, // 签到时间-超过24h,重置size
      signSize: 0, // 签到次数
      signDay: 0, // 签到日为 0
      sginMath: 0 // 签到的月份,不同月重置size
    }
    Data.controlAction({
      CHOICE: 'playerLife',
      NAME: 'sign',
      DATA: SignData
    })

    /**
     * ****
     * ****
     */

    // 临时属性
    Data.controlAction({ NAME: UID, CHOICE: 'playerExtend', DATA: {} })

    /** 更新装备 */
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerEquipment',
      DATA: []
    })

    /** 更新天赋面板 */
    Talent.updataEfficiency(UID)
    /** 更新战斗面板 */
    Battle.updatePanel(UID)
    return true
  }

  /**
   * 得到用户寿命
   * @param UID  UID
   * @returns 不存在则undifind
   */
  getUserLife(UID) {
    const LifeData = Data.controlActionInitial({
      CHOICE: 'playerLife',
      NAME: 'life',
      INITIAL: {}
    })
    if (LifeData[UID]) {
      return LifeData[UID]
    }
    return false
  }

  /**
   * 判断是否已死亡
   * @param UID  UID
   * @returns
   */
  getUserLifeSatus(UID) {
    let LifeData = this.getUserLife(UID)
    if (LifeData) {
      if (LifeData.status == 0) {
        return false
      }
      return true
    }
    // 建立新人
    const PlaterData = this.createPlayer(UID)
    if (!PlaterData) {
      return false
    }
    return true
  }

  /**
   * 判断是否存在该用户
   * @param {*} UID
   * @returns
   */
  isUser(UID) {
    let find = this.getUserLife(UID)
    if (find) {
      return true
    }
    return false
  }

  /**
   * 得到所有用户UID
   * @returns
   */
  getAllUser() {
    const GPList = []
    const LifeData = Data.controlActionInitial({
      CHOICE: 'playerLife',
      NAME: 'life',
      INITIAL: {}
    })
    for (let UID in LifeData) {
      GPList.push(UID)
    }
    return GPList
  }

  /**
   * 提升血量
   * @param {*} UID
   * @param {*} SIZE
   * @returns
   */
  addBlood(UID, SIZE) {
    const BattleData = Data.controlAction({
      NAME: UID,
      CHOICE: 'playerBattle'
    })
    // 血量 增加 原来的百分之几
    BattleData.nowblood += Math.floor((BattleData.blood * SIZE) / 100)
    if (BattleData.nowblood > BattleData.blood) {
      BattleData.nowblood = BattleData.blood
    }
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerBattle',
      DATA: BattleData
    })
    return BattleData.nowblood
  }

  /**
   * 下降血量
   * @param {*} UID
   * @param {*} SIZE
   */
  reduceBlood(UID, SIZE) {
    const BattleData = Data.controlAction({
      NAME: UID,
      CHOICE: 'playerBattle'
    })
    BattleData.nowblood -= Math.floor(BattleData.blood * SIZE * 0.01)
    if (BattleData.nowblood < 0) {
      BattleData.nowblood = 0
    }
    Data.controlAction({
      NAME: UID,
      CHOICE: 'playerBattle',
      DATA: BattleData
    })
    return BattleData.nowblood
  }
}
export default new Player()
