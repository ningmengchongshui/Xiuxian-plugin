import robotapi from "../../model/robot/api/api.js"
import { superIndex } from "../../model/robot/api/api.js"
import gameApi from '../../model/api/api.js'
import botApi from '../../model/robot/api/botapi.js'
export class boxuserinformation extends robotapi {
    constructor() {
        super(superIndex([
            {
                reg: '^#基础信息$',
                fnc: 'showUserMsg'
            },
            {
                reg: '^#面板信息$',
                fnc: 'showQquipment',
            },
            {
                reg: '^#功法信息$',
                fnc: 'showTalent',
            }
        ]))
    }
    showUserMsg = async (e) => {
        const UID = e.user_id
        const exist = await gameApi.existUserSatus({ UID })
        if (!exist) {
            e.reply('已死亡')
            return
        }
        const { path, name, data } = await gameApi.userDataShow({ UID: e.user_id })
        const img = await botApi.showPuppeteer({ path, name, data })
        e.reply(img)
        return
    }
    showQquipment = async (e) => {
        const UID = e.user_id
        const exist = await gameApi.existUserSatus({ UID })
        if (!exist) {
            e.reply('已死亡')
            return
        }
        const { path, name, data } = await gameApi.userEquipmentShow({ UID: e.user_id })
        const img = await botApi.showPuppeteer({ path, name, data })
        e.reply(img)
        return
    }
}