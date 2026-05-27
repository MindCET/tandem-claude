import { createAnthropic } from '@ai-sdk/anthropic'

export const anthropic = createAnthropic({
  apiKey: process.env.TANDEM_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com/v1',
})

export const MODEL = 'claude-sonnet-4-6' as const
