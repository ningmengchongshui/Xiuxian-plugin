import robotapi from "../../model/robotapi.js"
import configyaml from '../../model/configyaml.js'
import { superIndex } from "../../model/robotapi.js"
export class boxadminyaml extends robotapi {
    constructor() {
        super(superIndex([
            {
                reg: '^#修仙配置更改.*',
                fnc: 'configupdata',
            }
        ]))
    }
    configupdata = async (e) => {
        if (!e.isMaster) {
            return
        }
        const config = e.msg.replace('#修仙配置更改', '')
        const code = config.split('\*')
        const [name, size] = code
        e.reply(configyaml.config(name, size))
        return
    }
}