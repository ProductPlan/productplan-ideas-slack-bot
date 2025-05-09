import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

import { bedrockFoundationModel } from '../config'
import { ChatMessage, InvokeModelResponse } from '../types'

const runtimeClient = new BedrockRuntimeClient({ region: 'us-east-1' })

// Reference: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-runtime/command/InvokeModelCommand/
export const invokeModel = async (prompt: string, history: ChatMessage[], data?: any): Promise<InvokeModelResponse> => {
  const messageBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 130_000, // Input + output, feel free to adjust
    messages: history,
    system: data ? prompt.replace('{data}', JSON.stringify(data)) : prompt,
    temperature: 0.4, // 0.0 - 1.0, feel free to adjust
    top_k: 250, // 0 - 1000, feel free to adjust
  }
  const command = new InvokeModelCommand({
    body: new TextEncoder().encode(JSON.stringify(messageBody)), // new Uint8Array(), // e.g. Buffer.from("") or new TextEncoder().encode("")
    contentType: 'application/json',
    modelId: bedrockFoundationModel,
  })
  const response = await runtimeClient.send(command)
  const modelResponse = JSON.parse(new TextDecoder().decode(response.body))
  const responseText = modelResponse.content[0].text.replace(/\s*<thinking>.*?<\/thinking>\s*/s, '')
  try {
    return JSON.parse(responseText)
  } catch (error: any) {
    console.error('Error parsing model response', { error, response: responseText })
    throw error
  }
}
