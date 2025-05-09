// Bedrock

export interface InvokeModelResponse {
  complete: boolean
  idea?: {
    name?: string
    description?: string
    customer?: string
  }
  message: string
}

// Lambda event

export interface LambdaSlackEvent {
  channel: string
  text: string
  threadTs: string
  user: string
}

// Sessions

export interface ChatMessage {
  content: string
  role: 'assistant' | 'user'
}

export interface Session {
  complete: boolean
  history: ChatMessage[]
  idea: {
    name?: string
    description?: string
    customer?: string
    sourceName?: string
    sourceEmail?: string
  }
}

// ProductPlan

export interface Idea {
  name: string
  description: string
  // Customer is required for demonstration, it is not required by the API
  // https://productplan.readme.io/reference/post_api-v2-discovery-ideas
  customer: string
  sourceName: string
  sourceEmail: string
}

export interface IdeaResponse {
  id: number
}
