import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { dayLabel, calcDailyProtein } from '@/lib/utils'
import type { Entry } from '@/types'

interface Props {
  weekDates: string[]
  entriesByDate: Record<string, Entry[]>
  target: number
}

export default function ProteinTracker({ weekDates, entriesByDate, target }: Props) {
  const data = weekDates.map(date => ({
    day: dayLabel(date),
    protein: calcDailyProtein(entriesByDate[date] ?? []),
  }))

  function barColor(value: number) {
    if (value >= target) return '#00F0B5'
    if (value >= target * 0.7) return '#F59E0B'
    return '#EF4444'
  }

  return (
    <div>
      <h3 style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 12 }}>
        Daily Protein <span style={{ color: '#444', fontWeight: 400 }}>target {target}g</span>
      </h3>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={24} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#555' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#444' }}
            axisLine={false} tickLine={false}
            domain={[0, Math.max(target * 1.2, 20)]}
          />
          <ReferenceLine
            y={target}
            stroke="#00F0B540"
            strokeDasharray="4 3"
            label={{ value: `${target}g`, position: 'right', fontSize: 10, fill: '#00F0B5' }}
          />
          <Tooltip
            formatter={(v) => [`${v}g`, 'Protein']}
            contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
            cursor={{ fill: '#ffffff08' }}
          />
          <Bar dataKey="protein" radius={[5, 5, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={barColor(d.protein)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
