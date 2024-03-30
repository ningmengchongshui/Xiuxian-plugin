import {
  type PuppeteerLaunchOptions,
  type ScreenshotOptions,
  type PuppeteerLifeCycleEvent
} from 'puppeteer'
import puppeteer, { Browser } from 'puppeteer'
import queryString from 'querystring'

export class BaseConfig<D> {
  #data: D = null
  constructor(val: D) {
    this.#data = val
  }
  /**
   * 设置配置
   * @param key
   * @param val
   */
  set<T extends keyof D>(key: T, val: D[T]) {
    this.#data[key] = val
    return this
  }
  /**
   * 读取配置
   * @param key
   * @returns
   */
  all(): D {
    return this.#data
  }
  /**
   * 读取配置
   * @param key
   * @returns
   */
  get<T extends keyof D>(key: T): D[T] | undefined {
    return this.#data[key]
  }
}

export interface ScreenshotFileOptions {
  SOptions?: {
    type: 'jpeg' | 'png' | 'webp'
    quality: number
  }
  tab?: string
  timeout?: number
}

export interface ScreenshotUrlOptions {
  url: string
  time?: number
  rand?: ScreenshotOptions
  params?: queryString.ParsedUrlQueryInput
  tab?: string
  timeout?: number
  cache?: boolean
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[]
}

export const ALunchConfig = new BaseConfig<PuppeteerLaunchOptions>({
  // 禁用超时
  timeout: 0,
  //
  protocolTimeout: 0,
  // 请求头
  headless: true,
  //
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process'
  ],
  // 设置浏览器默认尺寸
  defaultViewport: {
    width: 414,
    height: 896
  }
})

export class Puppeteer {
  // 截图次数记录
  #pic = 0
  // 重启次数控制
  #restart = 200
  // 应用缓存
  #browser: Browser
  // 状态
  #isBrowser = false
  // 配置
  #launch: PuppeteerLaunchOptions = ALunchConfig.all()
  /**
   * 设置
   * @param val
   */
  setLaunch(val: PuppeteerLaunchOptions) {
    this.#launch = val
    return this
  }
  /**
   * 获取
   * @returns
   */
  getLaunch(): PuppeteerLaunchOptions {
    return this.#launch
  }
  /**
   * 启动pup
   * @returns
   */
  async start() {
    try {
      this.#browser = await puppeteer.launch(this.#launch)
      this.#isBrowser = true
      console.info('[puppeteer] open success')
      return true
    } catch (err) {
      this.#isBrowser = false
      console.error('[puppeteer] err', err)
      return false
    }
  }

  /**
   * 启动pup检查
   * @returns 是否启动成功
   */
  async isStart() {
    /**
     * 检测是否开启
     */
    if (!this.#isBrowser) {
      const T = await this.start()
      if (!T) return false
    }
    if (this.#pic <= this.#restart) {
      /**
       * 记录次数
       */
      this.#pic++
    } else {
      /**
       * 重置次数
       */
      this.#pic = 0
      console.info('[puppeteer] close')
      this.#isBrowser = false
      this.#browser.close().catch((err) => {
        console.error('[puppeteer] close', err)
      })
      console.info('[puppeteer] reopen')
      if (!(await this.start())) return false
      this.#pic++
    }
    return true
  }

  /**
   * 截图并返回buffer
   * @param htmlPath 绝对路径
   * @param tab 截图元素位
   * @param type 图片类型
   * @param quality 清晰度
   * @param timeout 响应检查
   * @returns buffer
   */
  async render(
    htmlPath: string | Buffer | URL,
    Options?: ScreenshotFileOptions
  ) {
    if (!(await this.isStart())) return false
    try {
      const page = await this.#browser.newPage().catch((err) => {
        console.error(err)
      })
      if (!page) return false
      await page.goto(`file://${htmlPath}`, {
        timeout: Options?.timeout ?? 120000
      })
      const body = await page.$(Options?.tab ?? 'body')
      console.info('[puppeteer] success')
      const buff: string | false | Buffer = await body
        .screenshot(
          Options?.SOptions ?? {
            type: 'jpeg',
            quality: 90
          }
        )
        .catch((err) => {
          console.error('[puppeteer]', 'screenshot', err)
          return false
        })
      await page.close().catch((err: any) => {
        console.error('[puppeteer]', 'page close', err)
      })
      if (!buff) {
        console.error('[puppeteer]', htmlPath)
        return false
      }
      return buff
    } catch (err) {
      console.error('[puppeteer] newPage', err)
      return false
    }
  }
}
