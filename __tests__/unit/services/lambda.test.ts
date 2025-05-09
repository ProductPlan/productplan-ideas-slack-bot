import { invokeLambda } from '@services/lambda'

const mockSend = jest.fn()
jest.mock('@aws-sdk/client-lambda', () => ({
  InvokeCommand: jest.fn().mockImplementation((x) => x),
  LambdaClient: jest.fn(() => ({
    send: (...args) => mockSend(...args),
  })),
}))

describe('lambda', () => {
  describe('invokeLambda', () => {
    const functionName = 'my-lambda-function'
    const payload = { key: 'value' }

    it('invokes the Lambda function', async () => {
      await invokeLambda(functionName, payload)

      expect(mockSend).toHaveBeenCalledWith({
        FunctionName: 'my-lambda-function',
        InvocationType: 'Event',
        Payload: Buffer.from(JSON.stringify(payload)),
      })
    })

    it('invokes the Lambda function with RequestResponse invocation type', async () => {
      await invokeLambda(functionName, payload, 'RequestResponse')

      expect(mockSend).toHaveBeenCalledWith({
        FunctionName: 'my-lambda-function',
        InvocationType: 'RequestResponse',
        Payload: Buffer.from(JSON.stringify(payload)),
      })
    })
  })
})
