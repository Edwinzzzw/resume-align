import { NextRequest, NextResponse } from 'next/server'
import { callLLMJSON } from '@/lib/llm'
import {
  JD_PARSER_SYSTEM,
  buildJDInputPrompt,
  RESUME_MATCHER_SYSTEM,
  buildResumeMatcherPrompt,
  RESUME_REWRITER_SYSTEM,
  buildResumeRewriterPrompt,
  type CapabilityProfile,
  type MatchResult,
  type FollowUpAnswer,
} from '@/lib/prompts'

/**
 * LLM 三步管道 API
 *
 * POST /api/llm
 * Body: {
 *   step: 'jd-parser' | 'resume-matcher' | 'resume-rewriter',
 *   payload: object  // 各步骤需要的参数
 * }
 */

type Step = 'jd-parser' | 'resume-matcher' | 'resume-rewriter'

interface JDParserPayload {
  jdText: string
}

interface ResumeMatcherPayload {
  jdProfile: CapabilityProfile
  resumeText: string
}

interface ResumeRewriterPayload {
  jdProfile: CapabilityProfile
  resumeText: string
  capabilityMatches: MatchResult[]
  followUpAnswers: FollowUpAnswer[]
}

interface RequestBody {
  step: Step
  payload: JDParserPayload | ResumeMatcherPayload | ResumeRewriterPayload
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json()
    const { step, payload } = body

    let systemPrompt: string
    let userPrompt: string

    switch (step) {
      case 'jd-parser': {
        const { jdText } = payload as JDParserPayload
        systemPrompt = JD_PARSER_SYSTEM
        userPrompt = buildJDInputPrompt(jdText)
        break
      }
      case 'resume-matcher': {
        const { jdProfile, resumeText } = payload as ResumeMatcherPayload
        systemPrompt = RESUME_MATCHER_SYSTEM
        userPrompt = buildResumeMatcherPrompt({ jdProfile, resumeText })
        break
      }
      case 'resume-rewriter': {
        const { jdProfile, resumeText, capabilityMatches, followUpAnswers } = payload as ResumeRewriterPayload
        systemPrompt = RESUME_REWRITER_SYSTEM
        userPrompt = buildResumeRewriterPrompt({ jdProfile, resumeText, capabilityMatches, followUpAnswers })
        break
      }
      default:
        return NextResponse.json({ error: '未知步骤' }, { status: 400 })
    }

    const result = await callLLMJSON(systemPrompt, userPrompt)

    return NextResponse.json(result)
  } catch (error) {
    console.error('LLM API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LLM 调用失败' },
      { status: 500 }
    )
  }
}