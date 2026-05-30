'use client'

import { useState } from 'react'

import type { CapabilityProfile } from '@/lib/prompts'

interface JDInputProps {
  onAnalyzed: (profile: CapabilityProfile) => void
  disabled?: boolean
}

export default function JDInput({ onAnalyzed, disabled }: JDInputProps) {
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!jdText.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'jd-parser',
          payload: { jdText: jdText.trim() },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '分析失败')
      }

      const profile = await res.json()
      onAnalyzed(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-warm animate-fade-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            粘贴招聘广告
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            粘贴目标岗位的 JD，我来帮你拆解能力画像
          </p>
        </div>
        <span className="tag-capsule" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          步骤一
        </span>
      </div>

      <textarea
        className="textarea-warm"
        placeholder="例如：
我们正在寻找一位产品运营实习生。

岗位职责：
1. 负责微信社群运营，维护 500+ 用户活跃度
2. 策划并执行线上活动，参与人数 1000+
3. 协助进行用户调研，收集反馈优化产品

任职要求：
1. 本科及以上在读学生，商科/传媒专业优先
2. 有社群运营或活动策划经验优先
3. 熟练使用 Excel，具备基础数据分析能力
4. 沟通能力强，能快速学习"
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        disabled={disabled || loading}
      />

      {error && (
        <p className="text-sm mt-2" style={{ color: 'var(--missing)' }}>{error}</p>
      )}

      <div className="flex justify-end mt-4">
        <button
          className="btn-primary"
          onClick={handleAnalyze}
          disabled={!jdText.trim() || loading}
        >
          {loading ? (
            <span className="animate-pulse-soft">分析中...</span>
          ) : (
            '分析 JD'
          )}
        </button>
      </div>
    </div>
  )
}