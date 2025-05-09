import { executeSlackEventHandler } from '@handlers/execute-slack-event'
import * as bedrock from '@services/bedrock'
import * as dynamodb from '@services/dynamodb'
import * as productplan from '@services/productplan'
import * as slack from '@services/slack'
import { InvokeModelResponse } from '@types'

import { invokeModelResponseData, lambdaSlackEvent, productPlanIdeaResponse, session, userInfo } from '../__mocks__'

jest.mock('@services/bedrock')
jest.mock('@services/dynamodb')
jest.mock('@services/productplan')
jest.mock('@services/slack')

describe('execute-slack-event', () => {
  const eventUserMessage = { content: '<@U07QQDVLYVB> Where are the wild things?', role: 'user' }
  const newHistory = [
    { content: 'My customer Coca-Cola wants to be able to order supplies on our website', role: 'user' },
    {
      content:
        'I captured an idea to order supplies on our website for Coca-Cola. Would you please provide a description of the idea?',
      role: 'assistant',
    },
    eventUserMessage,
  ]
  const successMessage = `${invokeModelResponseData.message}\n\nYou can view your idea here: https://app.productplan.com/discovery/ideas/123456789`

  beforeAll(() => {
    jest.mocked(bedrock).invokeModel.mockResolvedValue(invokeModelResponseData)
    jest.mocked(dynamodb).getSession.mockResolvedValue(session)
    jest.mocked(productplan).submitIdea.mockResolvedValue(productPlanIdeaResponse)
    jest.mocked(slack).postMessage.mockResolvedValue({ ok: true })
    jest.mocked(slack).lookupUserInfo.mockResolvedValue(userInfo)

    console.log = jest.fn()
    console.error = jest.fn()
  })

  it('invokes the model, saves the session, and posts a message', async () => {
    const result = await executeSlackEventHandler(lambdaSlackEvent)

    expect(bedrock.invokeModel).toHaveBeenCalledWith(expect.anything(), newHistory, {
      name: 'Order supplies on our website',
      customer: 'Coca-Cola',
      history: newHistory,
    })
    expect(dynamodb.setSession).toHaveBeenCalledWith('1728393163.712429', {
      complete: true,
      history: [...newHistory, { content: invokeModelResponseData.message, role: 'assistant' }],
      idea: {
        name: 'Remotely update our software',
        description:
          "Customers don't want to have to physically update their planes. We need to be able to perform updates remotely.",
        customer: 'Delta',
        sourceEmail: 'spengler@ghostbusters.example.com',
        sourceName: 'Egon Spengler',
      },
    })
    expect(productplan.submitIdea).toHaveBeenCalledWith({
      name: 'Remotely update our software',
      description:
        "Customers don't want to have to physically update their planes. We need to be able to perform updates remotely.",
      customer: 'Delta',
      sourceEmail: 'spengler@ghostbusters.example.com',
      sourceName: 'Egon Spengler',
    })
    expect(slack.postMessage).toHaveBeenCalledWith('C123ABC456', successMessage, '1728393163.712429')
    expect(result).toEqual({ ok: true })
  })

  it('uses a new session when the existing session is not found', async () => {
    jest.mocked(dynamodb).getSession.mockRejectedValueOnce(undefined)
    const result = await executeSlackEventHandler(lambdaSlackEvent)

    expect(bedrock.invokeModel).toHaveBeenCalledWith(expect.anything(), [eventUserMessage], {
      history: [eventUserMessage],
    })
    expect(dynamodb.setSession).toHaveBeenCalledWith('1728393163.712429', {
      complete: true,
      history: [eventUserMessage, { content: invokeModelResponseData.message, role: 'assistant' }],
      idea: {
        name: 'Remotely update our software',
        description:
          "Customers don't want to have to physically update their planes. We need to be able to perform updates remotely.",
        customer: 'Delta',
        sourceEmail: 'spengler@ghostbusters.example.com',
        sourceName: 'Egon Spengler',
      },
    })
    expect(productplan.submitIdea).toHaveBeenCalledWith({
      name: 'Remotely update our software',
      description:
        "Customers don't want to have to physically update their planes. We need to be able to perform updates remotely.",
      customer: 'Delta',
      sourceEmail: 'spengler@ghostbusters.example.com',
      sourceName: 'Egon Spengler',
    })
    expect(slack.postMessage).toHaveBeenCalledWith('C123ABC456', successMessage, '1728393163.712429')
    expect(result).toEqual({ ok: true })
  })

  it('returns ok: true and posts a message when session is complete', async () => {
    const completeSession = {
      ...session,
      complete: true,
    }
    jest.mocked(dynamodb).getSession.mockResolvedValueOnce(completeSession)
    const result = await executeSlackEventHandler(lambdaSlackEvent)

    expect(result).toEqual(expect.objectContaining({ ok: true }))
    expect(slack.postMessage).toHaveBeenCalledWith(
      'C123ABC456',
      'The idea "Order supplies on our website" has already been recorded. Please start a new thread to submit another idea.',
      '1728393163.712429',
    )
  })

  it("prompts for more information when an idea isn't complete", async () => {
    const incompleteMessage = 'What is a description of the idea? Which customer is this idea for?'
    const incompleteModelResponse: InvokeModelResponse = {
      complete: false,
      idea: {
        name: 'Remotely update our software',
      },
      message: incompleteMessage,
    }
    jest.mocked(bedrock).invokeModel.mockResolvedValueOnce(incompleteModelResponse)
    jest.mocked(dynamodb).getSession.mockRejectedValueOnce(undefined)
    const result = await executeSlackEventHandler(lambdaSlackEvent)

    expect(bedrock.invokeModel).toHaveBeenCalledWith(expect.anything(), [eventUserMessage], {
      history: [eventUserMessage],
    })
    expect(dynamodb.setSession).toHaveBeenCalledWith('1728393163.712429', {
      complete: false,
      history: [
        eventUserMessage,
        { content: 'What is a description of the idea? Which customer is this idea for?', role: 'assistant' },
      ],
      idea: {
        name: 'Remotely update our software',
        sourceEmail: 'spengler@ghostbusters.example.com',
        sourceName: 'Egon Spengler',
      },
    })
    expect(productplan.submitIdea).not.toHaveBeenCalled()
    expect(slack.postMessage).toHaveBeenCalledWith('C123ABC456', incompleteMessage, '1728393163.712429')
    expect(result).toEqual({ ok: true })
  })

  it('returns ok: false when user info lookup fails', async () => {
    jest.mocked(slack).lookupUserInfo.mockResolvedValueOnce({ ...userInfo, ok: false })
    const result = await executeSlackEventHandler(lambdaSlackEvent)

    expect(result).toEqual(expect.objectContaining({ ok: false }))
    expect(slack.postMessage).toHaveBeenCalledWith(
      'C123ABC456',
      "I'm sorry, but an error occurred while gathering your user information. Please try again later.",
      '1728393163.712429',
    )
  })

  it('correctly handles idea missing from model response', async () => {
    const incompleteMessage = 'What is a description of the idea? Which customer is this idea for?'
    const incompleteModelResponse: InvokeModelResponse = {
      complete: false,
      idea: undefined,
      message: incompleteMessage,
    }
    jest.mocked(bedrock).invokeModel.mockResolvedValueOnce(incompleteModelResponse)
    jest.mocked(slack).lookupUserInfo.mockResolvedValueOnce({
      ok: true,
    })
    const result = await executeSlackEventHandler(lambdaSlackEvent)

    expect(bedrock.invokeModel).toHaveBeenCalledWith(expect.anything(), newHistory, {
      name: 'Order supplies on our website',
      customer: 'Coca-Cola',
      history: newHistory,
    })
    expect(dynamodb.setSession).toHaveBeenCalledWith('1728393163.712429', {
      complete: false,
      history: [...newHistory, { content: incompleteMessage, role: 'assistant' }],
      idea: {
        name: 'Order supplies on our website',
        customer: 'Coca-Cola',
      },
    })
    expect(productplan.submitIdea).not.toHaveBeenCalled()
    expect(slack.postMessage).toHaveBeenCalledWith('C123ABC456', incompleteMessage, '1728393163.712429')
    expect(result).toEqual({ ok: true })
  })

  it('returns ok: false when posting message fails', async () => {
    jest.mocked(slack).postMessage.mockResolvedValueOnce({ ok: false })
    const result = await executeSlackEventHandler(lambdaSlackEvent)

    expect(slack.postMessage).toHaveBeenCalledWith('C123ABC456', successMessage, '1728393163.712429')
    expect(slack.postMessage).toHaveBeenCalledTimes(1) // Don't send error message if sending messages errors
    expect(result).toEqual({ ok: false })
  })

  it('returns ok: false and sends an error on exception', async () => {
    jest.mocked(slack).lookupUserInfo.mockRejectedValueOnce(new Error('User lookup failed'))
    const result = await executeSlackEventHandler(lambdaSlackEvent)

    expect(slack.postMessage).toHaveBeenCalledWith(
      'C123ABC456',
      "I'm sorry, but an error occurred while processing your idea. Please try again later.",
      '1728393163.712429',
    )
    expect(slack.postMessage).toHaveBeenCalledTimes(1) // Don't send error message if sending messages errors
    expect(result).toEqual({ ok: false })
  })
})
