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
          max_tokens: 130_000,
          messages: history,
          system: prompt,
          temperature: 0.4,
          top_k: 250,
        }),
      ),
      contentType: 'application/json',
      modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    })
  })

  it('should inject passed data into the prompt', async () => {
    const result = await invokeModel(prompt, history, { foo: 'bar' })

    expect(result).toEqual(invokeModelResponseData)
    expect(mockSend).toHaveBeenCalledWith({
      body: new TextEncoder().encode(
        JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 130_000,
          messages: history,
          system: 'You are a helpful assistant. {"foo":"bar"}',
          temperature: 0.4,
          top_k: 250,
        }),
      ),
      contentType: 'application/json',
      modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    })
  })

  it('should throw an error if the response cannot be parsed', async () => {
    mockSend.mockResolvedValueOnce({ body: new TextEncoder().encode(JSON.stringify({ content: [{ text: '' }] })) })
    await expect(invokeModel(prompt, history)).rejects.toThrow('Unexpected end of JSON input')
  })
})
