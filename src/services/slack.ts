import { ChatPostMessageResponse, WebClient } from '@slack/web-api'

import { slackOAuthToken } from '../config'

const slackClient = new WebClient(slackOAuthToken)

export interface LookupEmailResponse {
  email?: string
  ok: boolean
  realName?: string
}

// Reference: https://api.slack.com/methods/chat.postMessage
export const postMessage = async (
  channel: string,
  text: string,
  threadTs?: string,
): Promise<ChatPostMessageResponse> => {
  return await slackClient.chat.postMessage({
    channel,
    text,
    thread_ts: threadTs,
  })
}

// Reference: https://api.slack.com/methods/users.info
export const lookupUserInfo = async (userId: string): Promise<LookupEmailResponse> => {
  const { ok, user } = await slackClient.users.info({ user: userId })
  return { email: user?.profile?.email, ok, realName: user?.profile?.real_name }
}
