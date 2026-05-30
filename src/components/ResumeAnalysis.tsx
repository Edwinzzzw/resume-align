'use client'

import { useState } from 'react'
import type { CapabilityProfile, MatchResult, FollowUpAnswer } from '@/lib/prompts'

interface ResumeAnalysisProps {
  jdProfile: CapabilityProfile | null
  onRewriteReady: (results: {
    jdProfile: CapabilityProfile
    resumeText: string
    capabilityMatches: MatchResult[]
    followUpAnswers: FollowUpAnswer[]
  }) => void
  disabled?: boolean
}

type Step = 'idle' | 'analyzing' | 'ready' | 'rewriting'

export default function ResumeAnalysis({ jdProfile, onRewriteReady, disabled }: ResumeAnalysisProps) {
  const [resumeText, setResumeText] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [followUpAnswers, setFollowUpAnswers] = useState<FollowUpAnswer[]>([])
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!jdProfile || !resumeText.trim()) return
    setStep('analyzing')
    setError('')

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'resume-matcher',
          payload: { jdProfile, resumeText: resumeText.trim() },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '分析失败')
      }

      const data = await res.json()
      setMatchResults(data.matches || [])
      setStep('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败')
      setStep('idle')
    }
  }

  const handleAnswer = (question: string, answer: string) => {
    setFollowUpAnswers(prev => {
      const filtered = prev.filter(a => a.question !== question)
      if (!answer.trim()) return filtered
      return [...filtered, { question, answer }]
    })
  }

  const handleRewrite = () => {
    if (!jdProfile) return
    onRewriteReady({
      jdProfile,
      resumeText: resumeText.trim(),
      capabilityMatches: matchResults,
      followUpAnswers,
    })
    setStep('rewriting')
  }

  const weakItems = matchResults.filter(m => m.status === 'weak')
  const sufficientCount = matchResults.filter(m => m.status === 'sufficient').length
  const missingMustHave = matchResults.filter(m => m.status === 'missing').length

  return (
    <div className="card-warm animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            粘贴简历
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            粘贴你的简历内容，我来帮你匹配 JD 并追问
          </p>
        </div>
        <span className="tag-capsule" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          步骤二
        </span>
      </div>

      <textarea
        className="textarea-warm"
        placeholder="例如：
张三
上海交通大学 金融学 本科在读

实习经历：
- 某外资银行市场部实习（2024.06-2024.08）
  - 协助策划季度客户活动，参与 50+ 高净值客户活动现场执行
  - 整理会议纪要，制作每日市场简报

校园经历：
- 商学院学生会外联部干事
  - 策划并执行 3 场企业参访活动，累计参与 200+ 人次
  - 负责活动宣传文案撰写，微信公众号阅读量平均 800+

项目经历：
- 课程项目：某消费品品牌营销方案策划（2024.03）
  - 作为组长带领 5 人小组完成报告
  - 负责竞品分析和定价策略"
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        disabled={disabled || !jdProfile || step === 'analyzing' || step === 'rewriting'}
      />

      {error && (
        <p className="text-sm mt-2" style={{ color: 'var(--missing)' }}>{error}</p>
      )}

      {!jdProfile && (
        <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
          ← 请先完成步骤一（分析 JD）
        </p>
      )}

      <div className="flex justify-end mt-4">
        <button
          className="btn-primary"
          onClick={handleAnalyze}
          disabled={!jdProfile || !resumeText.trim() || step === 'analyzing' || step === 'rewriting'}
        >
          {step === 'analyzing' ? (
            <span className="animate-pulse-soft">分析中...</span>
          ) : '分析匹配'}
        </button>
      </div>

      {/* Match Results */}
      {step !== 'idle' && matchResults.length > 0 && (
        <div className="mt-6">
          <div className="divider-label">匹配分析结果</div>

          <div className="flex gap-4 mb-5">
            <div className="flex-1 text-center p-4 rounded-xl" style={{ background: 'var(--sufficient-bg)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--sufficient)' }}>{sufficientCount}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--sufficient)' }}>充分证据</div>
            </div>
            <div className="flex-1 text-center p-4 rounded-xl" style={{ background: 'var(--weak-bg)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--weak)' }}>{weakItems.length}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--weak)' }}>有但表达弱</div>
            </div>
            <div className="flex-1 text-center p-4 rounded-xl" style={{ background: 'var(--missing-bg)' }}>
              <div className="text-2xl font-bold" style={{ color: 'var(--missing)' }}>{missingMustHave}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--missing)' }}>完全缺失</div>
            </div>
          </div>

          {/* Match List */}
          <div className="space-y-3">
            {matchResults.map((match, i) => (
              <div key={i} className="p-4 rounded-xl border"
                   style={{
                     background: match.status === 'sufficient' ? 'var(--sufficient-bg)'
                       : match.status === 'weak' ? 'var(--weak-bg)'
                       : 'var(--missing-bg)',
                     borderColor: match.status === 'sufficient' ? 'var(--sufficient)'
                       : match.status === 'weak' ? 'var(--weak)'
                       : 'var(--missing)',
                   }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`tag-capsule ${match.status === 'sufficient' ? 'tag-sufficient' : match.status === 'weak' ? 'tag-weak' : 'tag-missing'}`}>
                        {match.status === 'sufficient' ? '✓ 充分' : match.status === 'weak' ? '⚠ 表达弱' : '✗ 缺失'}
                      </span>
                      <span className="text-sm font-medium">{match.capability}</span>
                    </div>
                    {match.evidence && (
                      <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                        原文：{match.evidence}
                      </p>
                    )}
                  </div>
                </div>

                {/* Follow-up questions: weak 或"可能有但没写"的 missing */}
                {match.questions && match.questions.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {match.questions.map((q, qi) => (
                      <div key={qi} className="p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <p className="text-sm font-medium mb-2" style={{ color: 'var(--accent)' }}>
                          💬 追问：{q}
                        </p>
                        <textarea
                          className="textarea-warm text-sm"
                          style={{ minHeight: '72px' }}
                          placeholder="如实回答即可，没有也没关系～"
                          onChange={(e) => handleAnswer(q, e.target.value)}
                        />
                        {followUpAnswers.find(a => a.question === q) && (
                          <p className="text-xs mt-2" style={{ color: 'var(--sufficient)' }}>
                            ✓ 已收到回答
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 真实缺口：诚实建议，不追问、不编造 */}
                {match.status === 'missing' && (!match.questions || match.questions.length === 0) && match.gapNote && (
                  <div className="mt-3 p-3 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                    📝 {match.gapNote}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-5">
            <button
              className="btn-primary"
              onClick={handleRewrite}
              disabled={step === 'rewriting'}
            >
              {step === 'rewriting' ? (
                <span className="animate-pulse-soft">重写中...</span>
              ) : '生成重写简历'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
