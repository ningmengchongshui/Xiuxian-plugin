import plugin from '../../../../lib/plugins/plugin.js'
import { BotApi } from './botapi.js'
import { GameApi } from './gameapi.js'
import { HomeApi } from './homeapi.js'
const name = 'xiuxian@2.0.0'
const dsc = 'xiuxian@2.0.0'
function verify(e) {
  if (!e.isGroup || e.user_id == 80000000) return false
  if (!BotApi.User.controlMessage({ e })) return false
  return true
}
export { plugin }
export { BotApi, GameApi, HomeApi, name, dsc, verify }