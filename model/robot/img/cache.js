import puppeteer from '../../../../../lib/puppeteer/puppeteer.js'
import md5 from 'md5'
const helpData = {}
class Cache {
    helpcache = async (parameter) => {
        const {data,i}=parameter
        const tmp = md5(JSON.stringify(data))
        if (!helpData.hasOwnProperty(i)) {
            helpData[i] = {
                'md5': '',
                'img': ''
            }
        }
        if (helpData[i].md5 == tmp) {
            return helpData[i].img
        }
        helpData[i].img = await puppeteer.screenshot('help', data)
        helpData[i].md5 = tmp
        return helpData[i].img
    }
}
export default   new Cache()