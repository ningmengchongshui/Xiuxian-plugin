import robotapi from "../../model/robot/api/api.js"
import { GameApi } from '../../model/api/gameapi.js'
import { BotApi } from '../../model/robot/api/botapi.js'
export class boxuserinstall extends robotapi {
    constructor() {
        super({
            name: 'xiuxian',
            dsc: 'BoxtWist',
            event: 'notice.group.increase',
            priority: 3000,
            rule: [
                {
                    fnc: 'createinstall'
                }
            ]
        })
    }
    createinstall = async (e) => {
        if (!e.isGroup) {
            return
        }
        const cf = await GameApi.DefsetUpdata.getConfig({ app: 'parameter', name: 'cooling' })
        const T = cf['switch'] ? cf['switch']['come'] : true
        if (!T) {
            return
        }
        const UID = e.user_id
        if (! await GameApi.GameUser.existUserSatus({ UID })) {
            e.reply([BotApi.segment.at(UID), '降临失败...\n天道:请降临者[#再入仙途]后步入轮回!'])
            return
        }
        e.reply([BotApi.segment.at(UID), '降临成功...\n天道:欢迎降临修仙世界\n请降临者[#寻找NPC]以获得\n仙缘与《凡人是如何修仙成功的之修仙生存手册之先抱大腿》'])
        return
    }
}