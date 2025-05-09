import { DynamoDB, GetItemCommand, PutItemCommand, PutItemCommandOutput } from '@aws-sdk/client-dynamodb'

import { dynamoDBSessionsTable, sessionExpireHours } from '../config'
import { Session } from '../types'

const dynamodb = new DynamoDB({ apiVersion: '2012-08-10' })

/* Sessions */

// Reference: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/command/GetItemCommand/
export const getSession = async (sessionId: string): Promise<Session> => {
  const command = new GetItemCommand({
    TableName: dynamoDBSessionsTable,
    Key: {
      SessionId: { S: sessionId },
    },
  })
  const response = await dynamodb.send(command)
  return JSON.parse(response.Item?.Data?.S as unknown as string)
}

// Referece: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/command/PutItemCommand/
export const setSession = async (sessionId: string, session: Session): Promise<PutItemCommandOutput> => {
  const currentTimeInSeconds = Math.floor(Date.now() / 1000)
  const command = new PutItemCommand({
    TableName: dynamoDBSessionsTable,
    Item: {
      Data: { S: JSON.stringify(session) },
      SessionId: { S: sessionId },
      // hours * 60 minutes / hour * 60 seconds / minute = seconds
      ExpireAt: { N: (currentTimeInSeconds + sessionExpireHours * 3_600).toString() },
    },
  })
  return await dynamodb.send(command)
}
