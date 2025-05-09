import { invokeModel } from '../services/bedrock'
import { getSession, setSession } from '../services/dynamodb'
import { submitIdea } from '../services/productplan'
import { lookupUserInfo, postMessage } from '../services/slack'
import { Session, LambdaSlackEvent, ChatMessage, Idea } from '../types'

/* Prompts */
// For demonstration purposes we are including the prompts in the code

const COMPILE_IDEA_PROMPT = `<instructions>
Given the chat history and existing idea information, compile the idea into a standardized format.

- Using the chat history, return the idea in a standardized format.
- If any fields are missing, prompt the user for the missing information.
- Format the fields submitted grammatically, but do not change the meaning.
- ALWAYS return a valid JSON object, correctly escaping \\n and \\" characters. No not give a preamble.
- Think about your response in <thinking> tags.

Return a JSON object with the following key / value pairs:
- \`complete\`: true if the idea is complete, false if it is not
- \`idea\`: the idea object with the following key / value pairs:
  - \`name\`: the name of the idea, omit if no name can be determined
  - \`description\`: the description of the idea, omit if no description can be determined
  - \`customer\`: the customer for the idea, omit if no customer can be determined
- \`message\`: the message response to send to the user
</instructions>

<examples>
<example>
<history>
[{ content: "My customer Coca-Cola wants to be able to order supplies on our website", role: "user" }]
</history>
<input>
{}
</input>
<output>
{
  "complete": false,
  "idea": {
    "name": "Order supplies on our website",
    "customer": "Coca-Cola"
  },
  "message": "I captured an idea to order supplies on our website for Coca-Cola. Would you please provide a description of the idea?"
}
</output>
</example>
<example>
<history>
[
  { content: "My customer Coca-Cola wants to be able to order supplies on our website", role: "user" },
  { content: "I captured an idea to order supplies on our website for Coca-Cola. Would you please provide a description of the idea?", role: "assistant" },
  { content: "Customers don't want to call our agents in order to place an order. They would like a more self-service model.", role: "user" },
]
</history>
<input>
{
  "complete": false,
  "idea": {
    "name": "Order supplies on our website",
    "customer": "Coca-Cola"
  }
}
</input>
<output>
{
  "complete": true,
  "idea": {
    "name": "Order supplies on our website",
    "description": "Customers don't want to call our agents in order to place an order. They would like a more self-service model.",
    "customer": "Coca-Cola"
  },
  "message": "Thank you for submitting your idea. I have captured and submitted the following information:\\n\\n- Name: Order supplies on our website\\n- Description: Customers don't want to call our agents in order to place an order. They would like a more self-service model.\\n- Customer: Coca-Cola"
}
</output>
</example>
<example>
<history>
[{ content: "Delta wants to be able to remotely update our software so planes don't need to be physically updated.", role: "user" }]
</history>
<input>
{}
</input>
<output>
{
  "complete": true,
  "idea": {
    "name": "Remotely update our software",
    "description": "Customers don't want to have to physically update their planes. We need to be able to perform updates remotely.",
    "customer": "Delta"
  },
  "message": "Your idea has been captured and submitted. Here are the details:\\n\\n- Name: Remotely update our software\\n- Description: Customers don't want to have to physically update their planes. We need to be able to perform updates remotely.\\n- Customer: Delta"
}
</output>
</example>
</examples>

<input>
{data}
</input>
`

/* Lambda */

export interface LambdaSlackResponse {
  ok: boolean
}

const establishSession = async (sessionId: string): Promise<Session> => {
  try {
    return await getSession(sessionId)
  } catch (error: any) {
    return { complete: false, history: [], idea: {} }
  }
}

export const executeSlackEventHandler = async (event: LambdaSlackEvent): Promise<LambdaSlackResponse> => {
  console.log('Received event', { event })
  try {
    const sessionId = event.threadTs
    const { complete, history, idea } = await establishSession(sessionId)
    if (complete) {
      await postMessage(
        event.channel,
        `The idea "${idea.name}" has already been recorded. Please start a new thread to submit another idea.`,
        event.threadTs,
      )
      console.log('Session is complete, no action taken', { idea })
      return { ok: true }
    }

    const newHistory = history.concat([{ content: event.text, role: 'user' }])
    console.log('Session data', { complete, history, idea, newHistory })

    const { email, ok: lookupEmailOk, realName } = await lookupUserInfo(event.user)
    if (!lookupEmailOk) {
      console.error('Error looking up user info', { email, ok: lookupEmailOk, realName })
      await postMessage(
        event.channel,
        "I'm sorry, but an error occurred while gathering your user information. Please try again later.",
        event.threadTs,
      )
      return { ok: false }
    }

    const modelResponse = await invokeModel(COMPILE_IDEA_PROMPT, newHistory, { ...idea, history: newHistory })
    const newIdea: Idea = {
      ...(idea as Idea), // Use data we previously saved
      ...(modelResponse.idea ?? {}), // Overlay data extracted by AI
      sourceName: realName ?? (idea.sourceName as string), // Try to recover if getting name fails
      sourceEmail: email ?? (idea.sourceEmail as string), // Try to recover if getting email fails
    }
    console.log('Model response', { response: modelResponse })

    const productPlanResponse = modelResponse.complete ? await submitIdea(newIdea) : undefined
    await setSession(sessionId, {
      complete: modelResponse.complete,
      // There's no benefit to providing a history longer than a handful of messages
      history: newHistory.concat([{ content: modelResponse.message, role: 'assistant' }]).slice(-6) as ChatMessage[],
      idea: newIdea,
    })

    const message = productPlanResponse
      ? `${modelResponse.message}\n\nYou can view your idea here: https://app.productplan.com/discovery/ideas/${encodeURIComponent(productPlanResponse.id)}`
      : modelResponse.message
    const { errors, ok: postMessageOk } = await postMessage(event.channel, message, event.threadTs)
    if (postMessageOk) {
      return { ok: true }
    }
    console.error('Error posting message', { errors, ok: postMessageOk })
  } catch (error: any) {
    console.error('Error executing Slack event', { error })

    await postMessage(
      event.channel,
      "I'm sorry, but an error occurred while processing your idea. Please try again later.",
      event.threadTs,
    )
  }
  return { ok: false }
}
