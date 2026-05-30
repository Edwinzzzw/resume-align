/**
 * LLM 可插拔抽象层
 *
 * 工程硬约束（PRD 8.4 节）：运行时 LLM 必须可插拔，换模型 = 改配置，不准把某个模型写死在业务逻辑里。
 *
 * 支持：OpenAI (GPT-4o) / Anthropic (Claude) / DeepSeek / 通义千问 / Kimi (Moonshot) / MiniMax
 * 使用 OpenAI API 兼容接口，切换只需改 LLM_CONFIG.provider。
 */

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'kimi' | 'minimax'

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  baseUrl?: string   // 部分模型需要自定义端点
  model?: string    // 可选，默认值由 provider 决定
}

export interface LLMResponse {
  content: string
  usage: {
    input: number
    output: number
  }
}

interface ProviderDefaults {
  baseUrl?: string
  defaultModel: string
}

const PROVIDER_DEFAULTS: Record<LLMProvider, ProviderDefaults> = {
  openai: {
    defaultModel: 'gpt-4o',
  },
  anthropic: {
    defaultModel: 'claude-sonnet-4-7',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
  },
  minimax: {
    baseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-M2.7',
  },
}

// 当前运行时配置：换模型 = 改这里
const LLM_CONFIG: LLMConfig = {
  provider: (process.env.LLM_PROVIDER as LLMProvider) || 'deepseek',
  apiKey: process.env.LLM_API_KEY || '',
  baseUrl: process.env.LLM_BASE_URL,
  model: process.env.LLM_MODEL,
}

function getEffectiveConfig(): Required<LLMConfig> {
  const defaults = PROVIDER_DEFAULTS[LLM_CONFIG.provider]
  return {
    provider: LLM_CONFIG.provider,
    apiKey: LLM_CONFIG.apiKey,
    baseUrl: LLM_CONFIG.baseUrl || defaults.baseUrl || '',
    model: LLM_CONFIG.model || defaults.defaultModel,
  }
}

/**
 * 从文本中提取 JSON 的最可靠方法
 * 思路：找到第一个 { 和它匹配的 } 之间的内容
 */
function extractJSON(text: string): string {
  // 去掉 markdown 代码块
  let result = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()

  // 找到第一个 {
  const firstBrace = result.indexOf('{')
  if (firstBrace === -1) return ''

  // 从 { 开始，用栈匹配 }
  let depth = 0
  let jsonEnd = -1

  for (let i = firstBrace; i < result.length; i++) {
    const ch = result[i]
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) {
        jsonEnd = i
        break
      }
    }
  }

  if (jsonEnd === -1) return result.slice(firstBrace)
  return result.slice(firstBrace, jsonEnd + 1)
}

/**
 * 统一 LLM 调用接口
 */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<LLMResponse> {
  const config = getEffectiveConfig()

  if (!config.apiKey) {
    throw new Error(`LLM API Key 未配置。请在 .env 中设置 ${config.provider.toUpperCase()}_API_KEY`)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  }

  const isAnthropic = config.provider === 'anthropic'

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  }

  // OpenAI 和通义千问支持 response_format
  if (config.provider === 'openai' || config.provider === 'qwen') {
    body.response_format = { type: 'json_object' }
  }

  // 部分国产模型需要 stream: false
  if (config.provider !== 'openai' && config.provider !== 'anthropic') {
    body.stream = false
  }

  // Anthropic 使用不同的 API 格式
  if (isAnthropic) {
    body.messages = [
      { role: 'user', content: [{ type: 'text', text: systemPrompt + '\n\n' + userPrompt }] },
    ]
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`LLM API 调用失败 (${response.status}): ${error}`)
  }

  const data = await response.json()

  return {
    content: isAnthropic
      ? data.content?.[0]?.text || ''
      : data.choices?.[0]?.message?.content || '',
    usage: {
      input: data.usage?.prompt_tokens || 0,
      output: data.usage?.completion_tokens || 0,
    },
  }
}

/**
 * 带 JSON 输出的 LLM 调用
 */
export async function callLLMJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<T> {
  const result = await callLLM(systemPrompt, userPrompt, {
    ...options,
    temperature: options?.temperature ?? 0.3,
  })

  const content = result.content.trim()

  // 用栈匹配方法提取 JSON
  const jsonStr = extractJSON(content)

  try {
    return JSON.parse(jsonStr) as T
  } catch {
    throw new Error(`LLM 返回的不是有效 JSON：\n${content.slice(0, 300)}`)
  }
}