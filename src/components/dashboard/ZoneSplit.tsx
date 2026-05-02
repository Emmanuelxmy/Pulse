import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { ZoneSplit as ZoneSplitData } from '@/lib/utils'

const COLORS = { zone1: '#00F0B5', zone2: '#F59E0B', hit: '#EF4444' }

export default function ZoneSplit({ data }: { data: ZoneSplitData }) {
  const { zone1_min, zone2_min, hit_min, total_min } = data

  if (total_min === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <p style={{ color: '#444', fontSize: 14 }}>No training this week</p>
      </div>
    )
  }

  const chartData = [
    { name: 'Zone 1', value: zone1_min, color: COLORS.zone1 },
    { name: 'Zone 2', value: zone2_min, color: COLORS.zone2 },
    { name: 'HIT',    value: hit_min,   color: COLORS.hit },
  ].filter(d => d.value > 0)

  const z1Pct = Math.round((zone1_min / total_min) * 100)
  const hitPct = Math.round((hit_min / total_min) * 100)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>Zone Split</h3>
        <span style={{ fontSize: 11, color: '#444' }}>target 80/20</span>
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={34} outerRadius={54}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => `${v}min`}
              contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Zone 1', min: zone1_min, pct: z1Pct, color: COLORS.zone1, target: '80%' },
            { label: 'Zone 2', min: zone2_min, pct: zone2_min ? Math.round((zone2_min / total_min)*100) : 0, color: COLORS.zone2, target: '0%' },
            { label: 'HIT',    min: hit_min,   pct: hitPct, color: COLORS.hit, target: '20%' },
          ].map(({ label, min, pct, color, target }) => (
            <div key={label} className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#888', width: 52 }}>{label}</span>
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: '#F5F5F5', width: 36 }}>
                {pct}%
              </span>
              <span style={{ fontSize: 11, color: '#444' }}>({min}m · {target})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
