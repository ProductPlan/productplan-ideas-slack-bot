import eventJson from '@events/post-slack-event.json'
import { postSlackEventHandler } from '@handlers/post-slack-event'
import * as lambda from '@services/lambda'
import status from '@utils/status'
import { APIGatewayProxyEventV2 } from 'aws-lambda'

import { parsedSlackEvent } from '../__mocks__'

jest.mock('@services/lambda')

describe('post-slack-event', () => {
  const event = eventJson as unknown as APIGatewayProxyEventV2

  const challenge = 'challenge-token'
  const threadTs = '1728393163.712429'

  beforeAll(() => {
    console.log = jest.fn()
    console.warn = jest.fn()
    console.error = jest.fn()
  })

  describe('postSlackEventHandler', () => {
    it('returns BAD_REQUEST when extract body fails', async () => {
      const invalidJsonEvent = { ...event, body: 'not-json' }
      const result = await postSlackEventHandler(invalidJsonEvent)
      expect(result).toEqual(expect.objectContaining({ statusCode: status.BAD_REQUEST.statusCode }))
    })

    it('returns OK when responding to challenge', async () => {
      const challengeEvent = { ...event, body: JSON.stringify({ type: 'url_verification', challenge }) }
      const result = await postSlackEventHandler(challengeEvent)

      expect(result).toEqual({ ...status.OK, body: JSON.stringify({ challenge }) })
    })

    it('returns OK when ignoring repeated message', async () => {
      const repeatedMessageEvent = { ...event, headers: { 'x-slack-retry-num': '1' } }
      const result = await postSlackEventHandler(repeatedMessageEvent)

      expect(result).toEqual(status.OK)
    })

    it('returns BAD_REQUEST when unrecognized application', async () => {
      const unrecognizedAppEvent = { ...event, body: JSON.stringify({ ...parsedSlackEvent, api_app_id: 'bad' }) }
      const result = await postSlackEventHandler(unrecognizedAppEvent)

      expect(result).toEqual({ ...status.BAD_REQUEST, body: JSON.stringify({ message: 'Unrecognized application' }) })
    })

    it('returns BAD_REQUEST when unrecognized event', async () => {
      const unrecognizedEvent = { ...event, body: JSON.stringify({ ...parsedSlackEvent, event: { type: 'bad' } }) }
      const result = await postSlackEventHandler(unrecognizedEvent)

      expect(result).toEqual({ ...status.BAD_REQUEST, body: JSON.stringify({ message: 'Unrecognized event' }) })
    })

    it('returns INTERNAL_SERVER_ERROR when invokeLambda fails', async () => {
      jest.mocked(lambda).invokeLambda.mockImplementationOnce(() => {
        throw new Error('Bad request')
      })

      const result = await postSlackEventHandler(event)
      expect(result).toEqual(expect.objectContaining(status.INTERNAL_SERVER_ERROR))
    })

    it('returns OK when invokeLambda succeeds', async () => {
      const result = await postSlackEventHandler(event)

      expect(lambda.invokeLambda).toHaveBeenCalledWith('execute-slack-event', {
        channel: 'C123ABC456',
        text: '<@U07QQDVLYVB> How do I move a bar?',
        threadTs,
        user: 'U123ABC456',
      })
      expect(result).toEqual(status.OK)
    })

    it('uses thread_ts to continue a thread if one exists', async () => {
      const slackEventWithThread = {
        ...event,
        body: JSON.stringify({ ...parsedSlackEvent, event: { ...parsedSlackEvent.event, threadTs } }),
      }
      const result = await postSlackEventHandler(slackEventWithThread)

      expect(lambda.invokeLambda).toHaveBeenCalledWith('execute-slack-event', {
        channel: 'C123ABC456',
        text: '<@U07QQDVLYVB> How do I move a bar?',
        threadTs,
        user: 'U123ABC456',
      })
      expect(result).toEqual(status.OK)
    })
  })
})
