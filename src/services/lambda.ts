import { InvokeCommand, InvokeCommandOutput, LambdaClient } from '@aws-sdk/client-lambda'

import { awsRegion } from '../config'

const client = new LambdaClient({ region: awsRegion })

type InvocationType = 'Event' | 'RequestResponse' | 'DryRun'

// Reference: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/lambda/command/InvokeCommand/
export const invokeLambda = async (
  name: string,
  payload: any,
  invocationType: InvocationType = 'Event',
): Promise<InvokeCommandOutput> => {
  const command = new InvokeCommand({
    FunctionName: name,
    InvocationType: invocationType,
    Payload: Buffer.from(JSON.stringify(payload)),
  })
  return await client.send(command)
}
