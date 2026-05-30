'use client'

import { useState } from 'react'
import { JDInput, CapabilityProfile, ResumeAnalysis, RewrittenResume } from '@/components'
import type { CapabilityProfile as CapabilityProfileType } from '@/lib/prompts'
import type { RewriteResult, MatchResult, FollowUpAnswer } from '@/lib/prompts'

export default function Home() {
  const [jdProfile, setJdProfile] = useState<CapabilityProfileType | null>(null)
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null)
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState('')

  const handleRewrite = async (data: {
    jdProfile: CapabilityProfileType
    resumeText: string
    capabilityMatches: MatchResult[]
    followUpAnswers: FollowUpAnswer[]
  }) => {
    setIsRewriting(true)
    setRewriteError('')

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'resume-rewriter',
          payload: {
            jdProfile: data.jdProfile,
            resumeText: data.resumeText,
            capabilityMatches: data.capabilityMatches,
            followUpAnswers: data.followUpAnswers,
          },
        }),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || '重写失败')
      }

      const result = await res.json()
      setRewriteResult(result)
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : '重写失败')
    } finally {
      setIsRewriting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="py-8 px-6 text-center border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          简历对齐工具
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          把你的经历对齐到目标岗位，让面试官一眼看到匹配点
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Steps 1 & 2 */}
        <section className="space-y-6 mb-8">
          <JDInput onAnalyzed={setJdProfile} />
          <CapabilityProfile profile={jdProfile} />
        </section>

        <div className="my-8 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--surface-alt)', color: 'var(--muted)' }}>
            三步管道
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Step 2: Resume Analysis */}
        <section className="mb-8">
          <ResumeAnalysis
            jdProfile={jdProfile}
            onRewriteReady={handleRewrite}
          />
        </section>

        {/* Step 3: Rewritten Resume */}
        <section>
          <RewrittenResume result={rewriteResult} loading={isRewriting} />
          {rewriteError && (
            <p className="text-sm mt-3 text-center" style={{ color: 'var(--missing)' }}>
              {rewriteError}
            </p>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs" style={{ color: 'var(--muted)' }}>
        <p>© 2026 简历对齐工具 · 仅供体验测试</p>
      </footer>
    </div>
  )
}