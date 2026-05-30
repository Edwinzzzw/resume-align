'use client'

import type { CapabilityProfile } from '@/lib/prompts'

interface CapabilityProfileProps {
  profile: CapabilityProfile | null
}

function CapabilitySection({ title, items, highlight = false }: {
  title: string
  items: string[]
  highlight?: boolean
}) {
  if (!items || items.length === 0) return null

  return (
    <div className="mb-5">
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="tag-capsule"
            style={highlight
              ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
              : { background: 'var(--surface-alt)', color: 'var(--foreground)' }
            }
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CapabilityProfile({ profile }: CapabilityProfileProps) {
  if (!profile) {
    return (
      <div className="card-warm animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
          <div className="text-3xl mb-3">📋</div>
          <p className="text-sm">粘贴 JD 并点击「分析」后，这里显示能力画像</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-warm animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          能力画像
        </h3>
        <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--surface-alt)', color: 'var(--muted)' }}>
          结构化分析结果
        </span>
      </div>

      <CapabilitySection title="硬技能" items={profile.hardSkills} />
      <CapabilitySection title="软能力" items={profile.softSkills} />

      {profile.experience && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
            资历要求
          </h4>
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>{profile.experience}</p>
        </div>
      )}

      <CapabilitySection title="行业用语" items={profile.businessLanguage} />

      <div className="divider-label">门槛与加分</div>

      <CapabilitySection title="必须具备 🔴" items={profile.mustHave} highlight />
      <CapabilitySection title="加分项" items={profile.niceToHave} />
    </div>
  )
}