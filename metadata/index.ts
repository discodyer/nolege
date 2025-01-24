import type { Creator } from '../scripts/types/metadata'
import { getAvatarUrlByGithubName } from '../scripts/utils'

/** 文本 */
export const siteName = 'Nolege'
export const siteShortName = 'Nolege'
export const siteDescription = '记录回忆，知识和畅想的地方'

/** 文档所在目录 */
export const include = ['笔记', '生活']

/** Repo */
export const githubRepoLink = 'https://github.com/discodyer/nolege'
/** Discord */
// export const discordLink = 'https://discord.gg/XuNFDcDZGj'

/** 无协议前缀域名 */
export const plainTargetDomain = 'nolege.cd.al'
/** 完整域名 */
export const targetDomain = `https://${plainTargetDomain}`

/** 创作者 */
export const creators: Creator[] = [
  {
    name: 'Cody Gu',
    avatar: '',
    username: 'discodyer',
    title: '内容创作者',
    desc: '电子发烧友',
    links: [
      { type: 'github', icon: 'github', link: 'https://github.com/discodyer' },
      { type: 'twitter', icon: 'twitter', link: 'https://twitter.com/cody2333' },
    ],
    nameAliases: ['discodyer', 'Cody Gu'],
    emailAliases: ['cody@cd.al'],
  },
].map<Creator>((c) => {
  c.avatar = c.avatar || getAvatarUrlByGithubName(c.username)
  return c as Creator
})

export const creatorNames = creators.map(c => c.name)
export const creatorUsernames = creators.map(c => c.username || '')
