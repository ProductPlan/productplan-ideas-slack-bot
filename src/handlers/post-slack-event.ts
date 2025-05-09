import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

import { lambdaFunctionName, slackApplicationID } from '../config'
import { invokeLambda } from '../services/lambda'
import { LambdaSlackEvent } from '../types'
import status from '../utils/status'

export const postSlackEventHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
  console.log('Received event', { event })
  try {
    const payload = JSON.parse(event.body as string)
    try {
      // Respond to URL verification. Slack requires a challenge response to verify the URL.
      if (payload.type === 'url_verification') {
        console.log('Responding to challenge', { challenge: payload.challenge })
        return {
          ...status.OK,
          body: JSON.stringify({ challenge: payload.challenge }),
        }
      }

      const { api_app_id: apiAppId, event: slackEvent, type: callbackType } = payload
      if (apiAppId !== slackApplicationID) {
        console.warn('Unrecognized application', { actual: apiAppId, expected: slackApplicationID })
        return { ...status.BAD_REQUEST, body: JSON.stringify({ message: 'Unrecognized application' }) }
      } else if (callbackType !== 'event_callback' || slackEvent.type !== 'app_mention') {
        console.warn('Unrecognized event type', { callbackType, slackEvent })
        return { ...status.BAD_REQUEST, body: JSON.stringify({ message: 'Unrecognized event' }) }
      }

      // Respond to app mention events by invoking a lambda to process the message asynchronously
      const lambdaSlackEvent: LambdaSlackEvent = {
        channel: slackEvent.channel,
        text: slackEvent.text,
        threadTs: slackEvent.thread_ts || slackEvent.ts,
        user: slackEvent.user,
      }
      await invokeLambda(lambdaFunctionName, lambdaSlackEvent)

      return status.OK
    } catch (error: any) {
      console.error(error)
      return status.INTERNAL_SERVER_ERROR
    }
  } catch (error: any) {
    // Called for JSON parsing errors
    return { ...status.BAD_REQUEST, body: JSON.stringify({ message: error.message }) }
  }
}
