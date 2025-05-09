import { getSession, setSession } from '@services/dynamodb'

import { session, sessionId } from '../__mocks__'

const mockSend = jest.fn()
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDB: jest.fn(() => ({
    send: (...args) => mockSend(...args),
  })),
  GetItemCommand: jest.fn().mockImplementation((x) => x),
  PutItemCommand: jest.fn().mockImplementation((x) => x),
}))

const currentTime = 1732272221010

beforeAll(() => {
  Date.now = jest.fn().mockReturnValue(currentTime)
})

describe('getSession', () => {
  it('returns the session ID and history', async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        Data: { S: JSON.stringify(session) },
      },
    })
    const result = await getSession(sessionId)

    expect(mockSend).toHaveBeenCalledWith({
      TableName: 'productplan-ideas-slack-bot-sessions',
      Key: {
        SessionId: { S: sessionId },
      },
    })
    expect(result).toEqual(session)
  })
})

describe('setSession', () => {
  const expectedTime = '1732358621' // Current time in seconds (1732272221) + session expire time (86_400)

  it('returns the response', async () => {
    const putItemResponse = { pancakes: '& waffles' }
    mockSend.mockResolvedValueOnce(putItemResponse)
    const result = await setSession(sessionId, session)

    expect(mockSend).toHaveBeenCalledWith({
      TableName: 'productplan-ideas-slack-bot-sessions',
      Item: {
        Data: { S: JSON.stringify(session) },
        ExpireAt: { N: expectedTime },
        SessionId: { S: sessionId },
      },
    })
    expect(result).toEqual(putItemResponse)
  })
})
