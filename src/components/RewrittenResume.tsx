'use client'

import type { RewriteResult } from '@/lib/prompts'

interface RewrittenResumeProps {
  result: RewriteResult | null
  loading?: boolean
}

export default function RewrittenResume({ result, loading }: RewrittenResumeProps) {
  if (loading) {
    return (
      <div className="card-warm animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            重写结果
          </h2>
          <span className="tag-capsule" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            步骤三
          </span>
        </div>
        <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
          <div className="animate-pulse-soft">
            <div className="text-3xl mb-3">✍️</div>
            <p className="text-sm">正在生成重写简历...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="card-warm animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            重写结果
          </h2>
          <span className="tag-capsule" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            步骤三
          </span>
        </div>
        <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
          <div className="text-3xl mb-3">📝</div>
          <p className="text-sm">完成前两步后，这里显示重写结果</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-warm animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          重写结果
        </h2>
        <span className="tag-capsule" style={{ background: 'var(--sufficient-bg)', color: 'var(--sufficient)' }}>
          ✓ 完成
        </span>
      </div>

      {/* Rewritten Resume Text */}
      <div className="p-5 rounded-xl mb-5" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
          优化后的简历
        </h4>
        <pre className="text-sm whitespace-pre-wrap" style={{
          fontFamily: 'inherit',
          color: 'var(--foreground)',
          lineHeight: '1.8',
        }}>
          {result.text}
        </pre>
      </div>

      {/* Diff Highlight */}
      {result.diff && result.diff.length > 0 && (
        <div>
          <div className="divider-label">改动说明</div>
          <div className="space-y-2">
            {result.diff.map((item, i) => (
              <div key={i} className="p-3 rounded-lg text-sm"
                   style={{
                     background: item.type === 'add' ? 'var(--sufficient-bg)'
                       : item.type === 'remove' ? 'var(--missing-bg)'
                       : 'var(--weak-bg)',
                   }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold" style={{
                    color: item.type === 'add' ? 'var(--sufficient)'
                      : item.type === 'remove' ? 'var(--missing)'
                      : 'var(--weak)'
                  }}>
                    {item.type === 'add' ? '+ 新增' : item.type === 'remove' ? '- 删除' : '~ 修改'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.reason}</span>
                </div>
                {item.original && (
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    原文：{item.original}
                  </p>
                )}
                {item.rewritten && (
                  <p className="text-xs mt-1" style={{ color: 'var(--foreground)' }}>
                    改后：{item.rewritten}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}