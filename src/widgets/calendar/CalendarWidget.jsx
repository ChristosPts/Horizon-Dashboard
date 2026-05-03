import { useState, useEffect, useMemo } from 'react'
import {
  Plus, ChevronLeft, ChevronRight, X, CheckSquare,
} from 'lucide-react'
import {
  format, parseISO,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval, addDays,
  isSameMonth,
} from 'date-fns'
import { useCalendarStore } from '../../store/useCalendarStore'
import { useTodoStore } from '../../store/useTodoStore'

// ── Constants ────────────────────────────────────────────────────────
const EVENT_COLORS = {
  purple: '#8B5CF6',
  blue:   '#60A5FA',
  green:  '#34d399',
  red:    '#f87171',
  amber:  '#fbbf24',
  pink:   '#f472b6',
}

const TODO_COLOR_MAP = { none: 'blue', low: 'blue', medium: 'amber', high: 'red' }

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// ── Grid helpers ─────────────────────────────────────────────────────
function getMonthGrid(dateStr) {
  const date = parseISO(dateStr)
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end:   endOfWeek(endOfMonth(date),     { weekStartsOn: 1 }),
  })
}

function getWeekDays(dateStr) {
  const date = parseISO(dateStr)
  const start = startOfWeek(date, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// ── EventChip ────────────────────────────────────────────────────────
function EventChip({ event, onClick, compact = false }) {
  const color = EVENT_COLORS[event.color] ?? EVENT_COLORS.blue
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(event) }}
      className={`truncate cursor-pointer transition-opacity hover:opacity-80 flex items-center gap-0.5 ${
        compact ? 'text-xs px-1 py-px rounded' : 'text-xs px-1 py-0.5 rounded'
      }`}
      style={{
        background:   color + '22',
        borderLeft:   `2px solid ${color}`,
        color:        'var(--text-primary)',
      }}
      title={event.title}
    >
      {event.isTodo && <CheckSquare size={9} style={{ flexShrink: 0, color }} />}
      <span className="truncate">{event.title}</span>
    </div>
  )
}

// ── EventForm overlay ────────────────────────────────────────────────
function EventForm({ initial, onSave, onDelete, onClose }) {
  const isEditing = !!initial?.id
  const [form, setForm] = useState({
    title:     initial?.title     ?? '',
    date:      initial?.date      ?? format(new Date(), 'yyyy-MM-dd'),
    startTime: initial?.startTime ?? '',
    endTime:   initial?.endTime   ?? '',
    notes:     initial?.notes     ?? '',
    color:     initial?.color     ?? 'purple',
  })

  const patch = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSave = () => {
    if (!form.title.trim()) return
    onSave({ ...form, title: form.title.trim() })
  }

  return (
    <div className="absolute inset-0 z-20 rounded-xl overflow-hidden flex flex-col">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)' }}
      />
      {/* Form */}
      <div className="relative flex flex-col h-full p-4 gap-3 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Edit event' : 'New event'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={15} /></button>
        </div>

        {/* Title */}
        <input
          autoFocus
          value={form.title}
          onChange={(e) => patch('title', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Event title"
          className="bg-transparent text-sm outline-none border-b pb-1.5"
          style={{ borderColor: 'var(--border-glass)', color: 'var(--text-primary)' }}
        />

        {/* Date */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={form.date}
            onChange={(e) => patch('date', e.target.value)}
            className="bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-secondary)', colorScheme: 'dark' }}
          />
          <div className="flex items-center gap-1">
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => patch('startTime', e.target.value)}
              className="bg-transparent text-sm outline-none w-20"
              style={{ color: 'var(--text-secondary)', colorScheme: 'dark' }}
            />
            {form.startTime && (
              <>
                <span style={{ color: 'var(--text-secondary)' }}>–</span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => patch('endTime', e.target.value)}
                  className="bg-transparent text-sm outline-none w-20"
                  style={{ color: 'var(--text-secondary)', colorScheme: 'dark' }}
                />
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        <textarea
          value={form.notes}
          onChange={(e) => patch('notes', e.target.value)}
          placeholder="Notes…"
          rows={2}
          className="bg-transparent text-sm outline-none resize-none"
          style={{ color: 'var(--text-secondary)' }}
        />

        {/* Color picker */}
        <div className="flex items-center gap-2">
          {Object.entries(EVENT_COLORS).map(([key, hex]) => (
            <button
              key={key}
              onClick={() => patch('color', key)}
              className="w-5 h-5 rounded-full transition-all"
              style={{
                background:  hex,
                transform:   form.color === key ? 'scale(1.35)' : 'scale(1)',
                boxShadow:   form.color === key ? `0 0 8px ${hex}` : 'none',
              }}
              title={key}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2 flex-shrink-0">
          {isEditing && (
            <button
              onClick={() => onDelete(initial.id)}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ color: '#f87171' }}
            >
              Delete
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1 rounded"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-40 transition-colors"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
            >
              {isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MonthView ────────────────────────────────────────────────────────
function MonthView({ events, selectedDate, today, onDayClick, onEventClick }) {
  const grid        = getMonthGrid(selectedDate)
  const currentDate = parseISO(selectedDate)

  return (
    <div className="flex flex-col h-full">
      {/* Weekday header */}
      <div className="grid grid-cols-7 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-glass)' }}>
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-xs py-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridAutoRows: '1fr' }}>
        {grid.map((day) => {
          const dayStr     = format(day, 'yyyy-MM-dd')
          const dayEvents  = events.filter((e) => e.date === dayStr)
          const isToday    = dayStr === today
          const isSelected = dayStr === selectedDate
          const inMonth    = isSameMonth(day, currentDate)

          return (
            <div
              key={dayStr}
              onClick={() => onDayClick(dayStr)}
              className="flex flex-col gap-0.5 p-0.5 cursor-pointer overflow-hidden transition-colors"
              style={{
                borderRight:  '1px solid var(--border-glass)',
                borderBottom: '1px solid var(--border-glass)',
                opacity:      inMonth ? 1 : 0.35,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              {/* Day number */}
              <div className="flex-shrink-0 flex justify-start pl-0.5 pt-0.5">
                <span
                  className="text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium"
                  style={{
                    background: isToday    ? 'var(--accent)'     : isSelected ? 'var(--accent-glow)' : 'transparent',
                    color:      isToday    ? 'white'             : 'var(--text-primary)',
                    fontWeight: isToday    ? 700                 : 400,
                  }}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Event chips */}
              {dayEvents.slice(0, 2).map((ev) => (
                <EventChip key={ev.id} event={ev} onClick={onEventClick} compact />
              ))}
              {dayEvents.length > 2 && (
                <span className="text-xs px-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                  +{dayEvents.length - 2}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── WeekView ─────────────────────────────────────────────────────────
function WeekView({ events, selectedDate, today, onDayClick, onEventClick }) {
  const days = getWeekDays(selectedDate)

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-glass)' }}>
        {days.map((day) => {
          const dayStr  = format(day, 'yyyy-MM-dd')
          const isToday = dayStr === today
          const isSel   = dayStr === selectedDate
          return (
            <div
              key={dayStr}
              onClick={() => onDayClick(dayStr)}
              className="text-center py-2 cursor-pointer"
            >
              <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                {format(day, 'EEE')}
              </div>
              <div
                className="text-sm w-7 h-7 flex items-center justify-center rounded-full mx-auto font-medium"
                style={{
                  background: isToday ? 'var(--accent)' : isSel ? 'var(--accent-glow)' : 'transparent',
                  color:      isToday ? 'white' : 'var(--text-primary)',
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {format(day, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Event columns */}
      <div className="grid grid-cols-7 flex-1 min-h-0 overflow-hidden">
        {days.map((day) => {
          const dayStr   = format(day, 'yyyy-MM-dd')
          const dayEvents = events.filter((e) => e.date === dayStr)
          return (
            <div
              key={dayStr}
              className="flex flex-col gap-0.5 p-0.5 overflow-y-auto"
              style={{ borderRight: '1px solid var(--border-glass)' }}
            >
              {dayEvents.map((ev) => (
                <EventChip key={ev.id} event={ev} onClick={onEventClick} compact />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── DayView ──────────────────────────────────────────────────────────
function DayView({ events, selectedDate, onEventClick, onAdd }) {
  const dayEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => {
      if (!a.startTime && !b.startTime) return 0
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return a.startTime.localeCompare(b.startTime)
    })

  if (dayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No events</p>
        <button
          onClick={onAdd}
          className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
        >
          Add event
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto p-3">
      {dayEvents.map((event) => {
        const color = EVENT_COLORS[event.color] ?? EVENT_COLORS.blue
        return (
          <div
            key={event.id}
            onClick={() => onEventClick(event)}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
            style={{ borderLeft: `3px solid ${color}`, background: color + '11' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = color + '22')}
            onMouseLeave={(e) => (e.currentTarget.style.background = color + '11')}
          >
            {(event.startTime || event.isTodo) && (
              <div className="text-xs flex-shrink-0 mt-0.5 flex flex-col items-center" style={{ color: 'var(--text-secondary)', minWidth: 36 }}>
                {event.isTodo
                  ? <CheckSquare size={13} style={{ color }} />
                  : <>{event.startTime}{event.endTime && <><br />{event.endTime}</>}</>
                }
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {event.title}
              </p>
              {event.notes && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {event.notes}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── CalendarWidget ───────────────────────────────────────────────────
export default function CalendarWidget() {
  const {
    events, view, selectedDate,
    loadFromStore, addEvent, updateEvent, deleteEvent,
    setView, setSelectedDate, setToday, navigatePrev, navigateNext,
  } = useCalendarStore()

  const todos = useTodoStore((s) => s.todos)

  const [editingEvent, setEditingEvent] = useState(null)

  useEffect(() => { loadFromStore() }, [])

  // Merge calendar events with todos that have due dates
  const todoEvents = useMemo(() =>
    todos
      .filter((t) => t.dueDate && !t.completed)
      .map((t) => ({
        id:     'todo-' + t.id,
        title:  t.text,
        date:   t.dueDate,
        color:  TODO_COLOR_MAP[t.priority] ?? 'blue',
        isTodo: true,
      })),
    [todos]
  )

  const allEvents = useMemo(() => [...events, ...todoEvents], [events, todoEvents])

  const today = format(new Date(), 'yyyy-MM-dd')

  // Navigation label
  const navLabel = useMemo(() => {
    const d = parseISO(selectedDate)
    if (view === 'month') return format(d, 'MMMM yyyy')
    if (view === 'week') {
      const ws = startOfWeek(d, { weekStartsOn: 1 })
      const we = endOfWeek(d,   { weekStartsOn: 1 })
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
    }
    return format(d, 'EEEE, MMMM d')
  }, [view, selectedDate])

  const handleEventClick = (event) => {
    if (event.isTodo) return
    setEditingEvent(event)
  }

  const handleSave = (data) => {
    if (editingEvent?.id) updateEvent(editingEvent.id, data)
    else addEvent(data)
    setEditingEvent(null)
  }

  const openNew = (date) => setEditingEvent({ _new: true, date: date ?? selectedDate })

  return (
    <div className="glass-widget relative overflow-hidden">
      {/* Header */}
      <div className="widget-header widget-drag-handle flex-shrink-0">
        <span className="widget-title">Calendar</span>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {/* Prev / label / Next */}
          <button
            onClick={navigatePrev}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium px-1 select-none" style={{ color: 'var(--text-primary)', minWidth: 100, textAlign: 'center' }}>
            {navLabel}
          </span>
          <button
            onClick={navigateNext}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronRight size={14} />
          </button>

          {/* View toggle */}
          <div
            className="flex gap-0.5 mx-1 rounded-md p-0.5"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="text-xs px-2 py-0.5 rounded transition-colors capitalize"
                style={{
                  background: view === v ? 'var(--accent-glow)' : 'transparent',
                  color:      view === v ? 'var(--accent)'       : 'var(--text-secondary)',
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Today */}
          <button
            onClick={setToday}
            className="text-xs px-2 py-0.5 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Today
          </button>

          {/* Add event */}
          <button
            onClick={() => openNew()}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Add event"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* View body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === 'month' && (
          <MonthView
            events={allEvents}
            selectedDate={selectedDate}
            today={today}
            onDayClick={(d) => { setSelectedDate(d); openNew(d) }}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            events={allEvents}
            selectedDate={selectedDate}
            today={today}
            onDayClick={setSelectedDate}
            onEventClick={handleEventClick}
          />
        )}
        {view === 'day' && (
          <DayView
            events={allEvents}
            selectedDate={selectedDate}
            onEventClick={handleEventClick}
            onAdd={() => openNew()}
          />
        )}
      </div>

      {/* Event form overlay */}
      {editingEvent !== null && (
        <EventForm
          initial={editingEvent?._new ? { date: editingEvent.date } : editingEvent}
          onSave={handleSave}
          onDelete={(id) => { deleteEvent(id); setEditingEvent(null) }}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  )
}
