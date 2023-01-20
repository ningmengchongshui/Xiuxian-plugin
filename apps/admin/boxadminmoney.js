import robotapi from "../../model/robot/api/api.js"
import { superIndex } from "../../model/robot/api/api.js"
import gameApi from '../../model/api/api.js'
import botApi from '../../model/robot/api/botapi.js'
export class boxadminmoney extends robotapi {
    constructor() {
        super(superIndex([
            {
                reg: '^#修仙扣除.*$',
                fnc: 'Deduction'
            },
            {
                reg: '^#修仙馈赠.*$',
                fnc: 'gifts'
            }
        ]))
    }
    gifts = async (e) => {
        if (!e.isMaster) {
            return
        }
        const UID = await botApi.at({ e })
        if (!UID) {
            return
        }
        const exist = await gameApi.existUserSatus({ UID })
        if (!exist) {
            e.reply('已死亡')
            return
        }
        const thing_name = e.msg.replace('#修仙馈赠', '')
        const [name, acount] = thing_name.split('\*')
        const quantity = await gameApi.leastOne({ value: acount })
        const bag = await gameApi.userBag({ UID, name, ACCOUNT: quantity })
        if (bag) {
            e.reply(`${UID}获得馈赠:${name}*${quantity}`)
        } else {
            e.reply(`馈赠[${name}]失败`)
        }
        return
    }
    Deduction = async (e) => {
        if (!e.isMaster) {
            return
        }
        const UID = await botApi.at({ e })
        if (!UID) {
            return
        }
        const exist = await gameApi.existUserSatus({ UID })
        if (exist) {
            e.reply('已死亡')
            return
        }
        let lingshi = e.msg.replace('#修仙扣除', '')
        lingshi = await gameApi.leastOne({ value: lingshi })
        const thing = await gameApi.userBagSearch({ UID, name: '下品灵石' })
        if (!thing || thing.acount < lingshi) {
            e.reply('他好穷的')
            return
        }
        await gameApi.userBag({ UID, name: '下品灵石', ACCOUNT: -lingshi })
        e.reply(`已扣除${lingshi}下品灵石`)
        return
    }
}