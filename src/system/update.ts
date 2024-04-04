/**
 * 存档刷新系统。用来发现存档内与当前版本不符合的字符。
 * 并做重新写入
 */

import { readdirSync, statSync } from 'fs'
import { ArchivePath } from '../model/path'
import { join } from 'path'
import { readArchiveData, writeArchiveData } from '../model/data'
import { UserMessageBase } from '../model/base'
function readFilesInDirectory(directoryPath: string): string[] {
  let fileNames: string[] = []
  const files = readdirSync(directoryPath)
  files.forEach((file) => {
    const filePath = join(directoryPath, file)
    const stat = statSync(filePath)
    if (stat.isFile()) {
      fileNames.push(file)
    } else if (stat.isDirectory()) {
      const subDirectoryFiles = readFilesInDirectory(filePath)
      fileNames = fileNames.concat(subDirectoryFiles)
    }
  })
  return fileNames
}
const fileNames = readFilesInDirectory(ArchivePath['player'])
for (const fileName of fileNames) {
  const split = fileName.split('.')
  if (split.length <= 0) continue
  const uid = split[0]
  if (!uid) continue
  const data = readArchiveData('player', uid)
  for (const key in UserMessageBase) {
    // 不存在的key。
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      data[key] = UserMessageBase[key]
    }

    // 基础类型不相等
    if (typeof data[key] !== typeof UserMessageBase[key]) {
      data[key] = UserMessageBase[key]
    }

    // 数组
    if (Array.isArray(data[key]) !== Array.isArray(UserMessageBase[key])) {
      data[key] = UserMessageBase[key]
    }

    // 不是对象 或者是数组
    if (
      typeof UserMessageBase[key] !== 'object' ||
      Array.isArray(UserMessageBase[key])
    ) {
      continue
    }

    // 深度比对
    for (const key2 in UserMessageBase[key]) {
      // 不存在的key。
      if (!Object.prototype.hasOwnProperty.call(data[key], key2)) {
        data[key][key2] = UserMessageBase[key][key2]
      }

      // 基础类型不相等
      if (typeof data[key] !== typeof UserMessageBase[key][key2]) {
        data[key][key2] = UserMessageBase[key][key2]
      }

      // 数组
      if (
        Array.isArray(data[key]) !== Array.isArray(UserMessageBase[key][key2])
      ) {
        data[key][key2] = typeof UserMessageBase[key][key2]
      }
    }
  }
  writeArchiveData('player', uid, data)
}