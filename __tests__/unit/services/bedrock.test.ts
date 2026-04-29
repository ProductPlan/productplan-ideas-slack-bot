import { invokeModel } from '@services/bedrock'
import { ChatMessage } from '@types'

import { invokeModelResponse, invokeModelResponseData } from '../__mocks__'

const mockSend = jest.fn()
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn(() => ({
    send: (...args) => mockSend(...args),
  })),
  InvokeModelCommand: jest.fn().mockImplementation((x) => x),
}))

const assistantMessage: ChatMessage = { content: 'assistant message', role: 'assistant' }
const userMessage: ChatMessage = { content: 'user message', role: 'user' }

describe('invokeModel', () => {
  const history = [assistantMessage, userMessage]
  const prompt = 'You are a helpful assistant. {data}'

  beforeAll(() => {
    mockSend.mockResolvedValue(invokeModelResponse)

    console.error = jest.fn()
  })

  it('should invoke the correct model based on the prompt', async () => {
    const result = await invokeModel(prompt, history)

    expect(result).toEqual(invokeModelResponseData)
    expect(mockSend).toHaveBeenCalledWith({
      body: new TextEncoder().encode(
        JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 40_000,
          messages: history,
          system: prompt,
          thinking: {
            type: 'enabled',
            budget_tokens: 20_000,
          },
        }),
      ),
      contentType: 'application/json',
      modelId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    })
  })

  it('should inject passed data into the prompt', async () => {
    const result = await invokeModel(prompt, history, { foo: 'bar' })

    expect(result).toEqual(invokeModelResponseData)
    expect(mockSend).toHaveBeenCalledWith({
      body: new TextEncoder().encode(
        JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 40_000,
          messages: history,
          system: 'You are a helpful assistant. {"foo":"bar"}',
          thinking: {
            type: 'enabled',
            budget_tokens: 20_000,
          },
        }),
      ),
      contentType: 'application/json',
      modelId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    })
  })

  it('should throw an error if the response cannot be parsed', async () => {
    mockSend.mockResolvedValueOnce({
      body: new TextEncoder().encode(JSON.stringify({ content: [{ type: 'text', text: '' }] })),
    })
    await expect(invokeModel(prompt, history)).rejects.toThrow('Unexpected end of JSON input')
  })
})
