import { Mail, Cloud, Newspaper, TrendingUp, Calendar, CheckSquare } from 'lucide-react'

const WIDGET_META = {
  email:    { label: 'Email',    Icon: Mail },
  weather:  { label: 'Weather',  Icon: Cloud },
  news:     { label: 'News',     Icon: Newspaper },
  crypto:   { label: 'Crypto',   Icon: TrendingUp },
  calendar: { label: 'Calendar', Icon: Calendar },
  todos:    { label: 'To-Dos',   Icon: CheckSquare },
}

export default function WidgetPlaceholder({ id }) {
  const { label, Icon } = WIDGET_META[id] ?? { label: id, Icon: null }

  return (
    <div className="glass-widget">
      <div className="widget-header widget-drag-handle">
        <span className="widget-title">{label}</span>
      </div>
      <div className="widget-body flex flex-col items-center justify-center gap-3">
        {Icon && <Icon size={28} style={{ color: 'var(--accent)', opacity: 0.4 }} />}
        <p className="text-secondary text-xs">Coming soon</p>
      </div>
    </div>
  )
}
