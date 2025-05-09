import { slackOAuthToken } from '@config'
import { postMessage, lookupUserInfo } from '@services/slack'

import { userInfoResponse } from '../__mocks__'

const mockPostMessage = jest.fn()
const mockUserInfo = jest.fn()
jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation((token) => ({
    chat: {
      postMessage: (...args) => mockPostMessage(token, ...args),
    },
    users: {
      info: (...args) => mockUserInfo(token, ...args),
    },
  })),
}))

describe('postMessage', () => {
  const channel = 'C1234567890'
  const text = 'Hello, world!'

  it('invokes the Slack chat.postMessage API', async () => {
    await postMessage(channel, text)

    expect(mockPostMessage).toHaveBeenCalledWith(slackOAuthToken, { channel, text })
  })

  it('invokes the Slack chat.postMessage API with thread_ts', async () => {
    const thread_ts = '1234567890.123456'
    await postMessage(channel, text, thread_ts)

    expect(mockPostMessage).toHaveBeenCalledWith(slackOAuthToken, { channel, text, thread_ts })
  })
})

describe('lookupUserInfo', () => {
  const userId = 'U1234567890'
  const expectedEmail = 'spengler@ghostbusters.example.com'

  beforeAll(() => {
    mockUserInfo.mockResolvedValue(userInfoResponse)
  })

  it('invokes the Slack users.info API', async () => {
    const { email, ok } = await lookupUserInfo(userId)

    expect(mockUserInfo).toHaveBeenCalledWith(slackOAuthToken, { user: userId })
    expect(email).toEqual(expectedEmail)
    expect(ok).toBeTruthy()
  })

  it('returns undefined if user does not exist', async () => {
    mockUserInfo.mockResolvedValueOnce({ ok: false })
    const { email, ok } = await lookupUserInfo(userId)

    expect(email).toBeUndefined()
    expect(ok).toBeFalsy()
  })

  it('returns undefined if user does not have an email', async () => {
    mockUserInfo.mockResolvedValueOnce({ ok: true, user: { ...userInfoResponse.user, profile: { email: undefined } } })
    const { email, ok } = await lookupUserInfo(userId)

    expect(email).toBeUndefined()
    expect(ok).toBeTruthy()
  })
})
