// General

process.env.AWS_REGION = 'us-east-1'

// Bedrock Agent

process.env.BEDROCK_FOUNDATION_MODEL = 'us.anthropic.claude-3-7-sonnet-20250219-v1:0'

// DynamoDB

process.env.DYNAMODB_TABLE_SESSIONS = 'productplan-ideas-slack-bot-sessions'
process.env.SESSION_EXPIRE_HOURS = '24'

// Lambda

process.env.LAMBDA_FUNCTION_NAME = 'execute-slack-event'

// ProductPlan

process.env.PRODUCTPLAN_API_TOKEN = 'what-a-great-yet-secret-token'
process.env.PRODUCTPLAN_BASE_URL = 'https://api.productplan.com/v1'

// Slack

process.env.SLACK_APPLICATION_ID = 'A123ABC456'
process.env.SLACK_OAUTH_TOKEN = 'a-really-long-and-probably-secret-token'
