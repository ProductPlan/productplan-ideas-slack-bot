import { InvokeModelResponse, LambdaSlackEvent, Session } from '@types'

// Bedrock

export const invokeModelResponseData: InvokeModelResponse = {
  complete: true,
  idea: {
    name: 'Remotely update our software',
    description:
      "Customers don't want to have to physically update their planes. We need to be able to perform updates remotely.",
    customer: 'Delta',
  },
  message:
    "Your idea has been captured and submitted. Here are the details:\n\n- Name: Remotely update our software\n- Description: Customers don't want to have to physically update their planes. We need to be able to perform updates remotely.\n- Customer: Delta",
}

export const invokeModelResponse = {
  $metadata: {
    attempts: 1,
    cfId: undefined,
    extendedRequestId: undefined,
    httpStatusCode: 200,
    requestId: 'fragglerock',
    retryDelay: 0,
    statusCode: 200,
    success: true,
    totalRetryDelay: 0,
  },
  body: new TextEncoder().encode(
    JSON.stringify({
      id: 'msg_bdrk_01YA7pmVfUZvZM9reruSimYT',
      type: 'message',
      role: 'assistant',
      model: 'claude-3-7-sonnet-20250219-v1',
      content: [
        {
          type: 'text',
          text: JSON.stringify(invokeModelResponseData),
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 3398, output_tokens: 99 },
    }),
  ),
}

// DynamoDB

export const sessionId = 'uuuuu-uuuuu-iiiii-ddddd-xxxxx'

export const session: Session = {
  complete: false,
  history: [
    { content: 'My customer Coca-Cola wants to be able to order supplies on our website', role: 'user' },
    {
      content:
        'I captured an idea to order supplies on our website for Coca-Cola. Would you please provide a description of the idea?',
      role: 'assistant',
    },
  ],
  idea: {
    name: 'Order supplies on our website',
    customer: 'Coca-Cola',
  },
}

// Lambda

export const lambdaSlackEvent: LambdaSlackEvent = {
  channel: 'C123ABC456',
  text: '<@U07QQDVLYVB> Where are the wild things?',
  threadTs: '1728393163.712429',
  user: 'W012A3CDE',
}

// ProductPlan

export const productPlanIdeaResponse = {
  id: 123456789,
}

export const idea = {
  name: 'Order supplies on our website',
  description:
    "Customers don't want to call our agents in order to place an order. They would like a more self-service model.",
  customer: 'Coca-Cola',
  sourceName: 'Egon Spengler',
  sourceEmail: 'spengler@ghostbusters.example.com',
}

// Slack

export const parsedSlackEvent = {
  token: 'tttttoooookkkkkeeeeennnnn',
  team_id: 'T123ABC456',
  api_app_id: 'A123ABC456',
  channel: 'C123ABC456',
  event: {
    user: 'U123ABC456',
    type: 'app_mention',
    ts: '1728393163.712429',
    client_msg_id: '3e87d70e-a9e7-4e8b-98a6-661154ef5cfe',
    text: '<@U07QQDVLYVB> How do I move a bar?',
    team: 'T123ABC456',
    channel: 'C123ABC456',
    event_ts: '1465244570.336841',
  },
  type: 'event_callback',
  authed_users: ['U222222222'],
  authed_teams: ['T123ABC456'],
  authorizations: [{ enterprise_id: 'E123ABC456', team_id: 'T123ABC456', user_id: 'U123ABC456', is_bot: false }],
  event_context: 'EC123ABC456',
  event_id: 'Ev123ABC456',
  event_time: 1234567890,
  thread_ts: '1728393163.712429',
}

export const userInfo = {
  email: 'spengler@ghostbusters.example.com',
  ok: true,
  realName: 'Egon Spengler',
}

export const userInfoResponse = {
  ok: true,
  user: {
    id: 'W012A3CDE',
    team_id: 'T012AB3C4',
    name: 'spengler',
    deleted: false,
    color: '9f69e7',
    real_name: 'Egon Spengler',
    tz: 'America/Los_Angeles',
    tz_label: 'Pacific Daylight Time',
    tz_offset: -25200,
    profile: {
      avatar_hash: 'ge3b51ca72de',
      status_text: 'Print is dead',
      status_emoji: ':books:',
      real_name: 'Egon Spengler',
      display_name: 'spengler',
      real_name_normalized: 'Egon Spengler',
      display_name_normalized: 'spengler',
      email: 'spengler@ghostbusters.example.com',
      image_original: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
      image_24: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
      image_32: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
      image_48: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
      image_72: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
      image_192: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
      image_512: 'https://.../avatar/e3b51ca72dee4ef87916ae2b9240df50.jpg',
      team: 'T012AB3C4',
    },
    is_admin: true,
    is_owner: false,
    is_primary_owner: false,
    is_restricted: false,
    is_ultra_restricted: false,
    is_bot: false,
    updated: 1502138686,
    is_app_user: false,
    has_2fa: false,
  },
}
