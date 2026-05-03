import GridLayout, { WidthProvider } from 'react-grid-layout'
import { useLayoutStore } from '../store/useLayoutStore'
import { useSettingsStore } from '../store/useSettingsStore'
import WidgetPlaceholder from './WidgetPlaceholder'
import TodoWidget from '../widgets/todos/TodoWidget'
import WeatherWidget from '../widgets/weather/WeatherWidget'
import CryptoWidget from '../widgets/crypto/CryptoWidget'
import CalendarWidget from '../widgets/calendar/CalendarWidget'
import NewsWidget from '../widgets/news/NewsWidget'
import EmailWidget from '../widgets/email/EmailWidget'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const AutoGrid = WidthProvider(GridLayout)

const WIDGETS = {
  todos:    TodoWidget,
  weather:  WeatherWidget,
  crypto:   CryptoWidget,
  calendar: CalendarWidget,
  news:     NewsWidget,
  email:    EmailWidget,
}

function resolveWidget(id) {
  const Component = WIDGETS[id]
  return Component ? <Component /> : <WidgetPlaceholder id={id} />
}

export default function Dashboard() {
  const { layout, setLayout } = useLayoutStore()
  const { widgetVisibility } = useSettingsStore()

  const visibleLayout = layout.filter((item) => widgetVisibility[item.i])

  return (
    <main className="dashboard-root">
      <AutoGrid
        layout={visibleLayout}
        cols={12}
        rowHeight={100}
        margin={[12, 12]}
        containerPadding={[16, 16]}
        draggableHandle=".widget-drag-handle"
        resizeHandles={['se']}
        onLayoutChange={setLayout}
      >
        {visibleLayout.map((item) => (
          <div key={item.i} className="widget-wrapper">
            {resolveWidget(item.i)}
          </div>
        ))}
      </AutoGrid>
    </main>
  )
}
