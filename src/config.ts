// General

export const awsRegion = process.env.AWS_REGION as string

// Bedrock Agent

export const bedrockFoundationModel = process.env.BEDROCK_FOUNDATION_MODEL as string

// DynamoDB

export const dynamoDBSessionsTable = process.env.DYNAMODB_TABLE_SESSIONS as string
export const sessionExpireHours = parseInt(process.env.SESSION_EXPIRE_HOURS as string, 10)

// Lambda

export const lambdaFunctionName = process.env.LAMBDA_FUNCTION_NAME as string

// ProductPlan

export const productPlanApiToken = process.env.PRODUCTPLAN_API_TOKEN as string
export const productPlanBaseUrl = process.env.PRODUCTPLAN_BASE_URL as string

// Slack

export const slackApplicationID = process.env.SLACK_APPLICATION_ID as string
export const slackOAuthToken = process.env.SLACK_OAUTH_TOKEN as string
