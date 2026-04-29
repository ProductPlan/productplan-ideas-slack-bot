import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

import { bedrockFoundationModel } from '../config'
import { ChatMessage, InvokeModelResponse } from '../types'

const runtimeClient = new BedrockRuntimeClient({ region: 'us-east-1' })

// Reference: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-runtime/command/InvokeModelCommand/
export const invokeModel = async (prompt: string, history: ChatMessage[], data?: any): Promise<InvokeModelResponse> => {
  const messageBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 40_000, // Input + output, feel free to adjust
    messages: history,
    system: data ? prompt.replace('{data}', JSON.stringify(data)) : prompt,
    thinking: {
      type: 'enabled',
      budget_tokens: 20_000,
    },
  }
  const command = new InvokeModelCommand({
    body: new TextEncoder().encode(JSON.stringify(messageBody)),
    contentType: 'application/json',
    modelId: bedrockFoundationModel,
  })
  const response = await runtimeClient.send(command)
  const modelResponse = JSON.parse(new TextDecoder().decode(response.body))
  const responseText = modelResponse.content.find((b: { type: string }) => b.type === 'text').text
  try {
    return JSON.parse(responseText.match(/{.*}/s)?.[0] ?? responseText)
  } catch (error: any) {
    console.error('Error parsing model response', { error, response: responseText })
    throw error
  }
}
