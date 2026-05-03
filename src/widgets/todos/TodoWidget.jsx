import { useState, useRef, useEffect } from 'react'
import {
  Plus, Eye, EyeOff, ArrowUpDown, List, LayoutGrid, StickyNote,
  Circle, CheckCircle2, X, Calendar, Flag,
} from 'lucide-react'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { useTodoStore } from '../../store/useTodoStore'

// ── Priority config ──────────────────────────────────────────────────
const PRIORITY = {
  none:   { dot: 'bg-white/20',   label: 'None',   ring: 'ring-white/10' },
  low:    { dot: 'bg-blue-400',   label: 'Low',    ring: 'ring-blue-400/30' },
  medium: { dot: 'bg-amber-400',  label: 'Medium', ring: 'ring-amber-400/30' },
  high:   { dot: 'bg-red-400',    label: 'High',   ring: 'ring-red-400/30' },
}

const SORT_LABEL = { manual: 'Manual', priority: 'Priority', dueDate: 'Due date' }

// ── Due date helpers ─────────────────────────────────────────────────
function formatDue(dateStr) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d')
}

function dueColor(dateStr) {
  const d = parseISO(dateStr)
  if (isPast(d) && !isToday(d)) return 'text-red-400'
  if (isToday(d)) return 'text-amber-400'
  return 'text-secondary'
}

// ── AddTodo ──────────────────────────────────────────────────────────
function AddTodo() {
  const { addTodo } = useTodoStore()
  const [text, setText] = useState('')
  const [priority, setPriority] = useState('none')
  const [dueDate, setDueDate] = useState('')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef(null)

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    addTodo(trimmed, priority, dueDate || null)
    setText('')
    setPriority('none')
    setDueDate('')
    setExpanded(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') { setExpanded(false); setText('') }
  }

  return (
    <div className="border-t mt-auto flex-shrink-0" style={{ borderColor: 'var(--border-glass)' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 0) }}
          className="flex-shrink-0 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
        >
          <Plus size={13} />
        </button>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => { setText(e.target.value); if (!expanded) setExpanded(true) }}
          onFocus={() => setExpanded(true)}
          onKeyDown={onKeyDown}
          placeholder="Add a task…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-secondary/50"
          style={{ color: 'var(--text-primary)' }}
        />
        {text && (
          <button
            onClick={submit}
            className="text-xs px-2 py-0.5 rounded-md transition-colors font-medium"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
          >
            Add
          </button>
        )}
      </div>

      {expanded && (
        <div className="flex items-center gap-2 px-3 pb-2.5">
          {/* Priority selector */}
          <div className="flex gap-1">
            {Object.entries(PRIORITY).map(([key, { dot, label }]) => (
              <button
                key={key}
                onClick={() => setPriority(key)}
                title={label}
                className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md transition-all ${
                  priority === key
                    ? 'ring-1 ' + PRIORITY[key].ring
                    : 'opacity-50 hover:opacity-80'
                }`}
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          {/* Due date */}
          <div className="ml-auto flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
            <Calendar size={11} />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent text-xs outline-none"
              style={{ color: 'var(--text-secondary)', colorScheme: 'dark' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── TodoItem ─────────────────────────────────────────────────────────
function TodoItem({ todo }) {
  const { toggleTodo, updateTodo, deleteTodo } = useTodoStore()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const editRef = useRef(null)

  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  const saveEdit = () => {
    const t = editText.trim()
    if (t) updateTodo(todo.id, { text: t })
    else setEditText(todo.text)
    setEditing(false)
  }

  const cyclePriority = (e) => {
    e.stopPropagation()
    const order = ['none', 'low', 'medium', 'high']
    const next = order[(order.indexOf(todo.priority) + 1) % order.length]
    updateTodo(todo.id, { priority: next })
  }

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        todo.completed ? 'opacity-50' : ''
      }`}
      style={{ ':hover': { background: 'var(--bg-glass-hover)' } }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-glass-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
    >
      {/* Checkbox */}
      <button
        onClick={() => toggleTodo(todo.id)}
        className="flex-shrink-0 transition-colors"
        style={{ color: todo.completed ? 'var(--accent)' : 'var(--text-secondary)' }}
      >
        {todo.completed
          ? <CheckCircle2 size={15} />
          : <Circle size={15} />
        }
      </button>

      {/* Text */}
      {editing ? (
        <input
          ref={editRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') { setEditText(todo.text); setEditing(false) }
          }}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
      ) : (
        <span
          onClick={() => !todo.completed && setEditing(true)}
          className={`flex-1 text-sm select-none ${
            todo.completed ? 'line-through' : 'cursor-text'
          }`}
          style={{ color: 'var(--text-primary)' }}
        >
          {todo.text}
        </span>
      )}

      {/* Due date */}
      {todo.dueDate && !editing && (
        <span className={`text-xs flex-shrink-0 ${dueColor(todo.dueDate)}`}>
          {formatDue(todo.dueDate)}
        </span>
      )}

      {/* Priority dot — click to cycle */}
      <button
        onClick={cyclePriority}
        title={`Priority: ${PRIORITY[todo.priority].label}`}
        className={`flex-shrink-0 w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${PRIORITY[todo.priority].dot}`}
      />

      {/* Delete */}
      <button
        onClick={() => deleteTodo(todo.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ── Kanban view ──────────────────────────────────────────────────────
function KanbanView({ active, done, showCompleted }) {
  return (
    <div className="flex gap-2 h-full">
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--text-secondary)' }}>
          Active · {active.length}
        </p>
        <div className="overflow-y-auto flex-1">
          {active.map((t) => <TodoItem key={t.id} todo={t} />)}
        </div>
      </div>
      {showCompleted && done.length > 0 && (
        <>
          <div className="w-px self-stretch" style={{ background: 'var(--border-glass)' }} />
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1 px-1" style={{ color: 'var(--text-secondary)' }}>
              Done · {done.length}
            </p>
            <div className="overflow-y-auto flex-1">
              {done.map((t) => <TodoItem key={t.id} todo={t} />)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Sticky view ──────────────────────────────────────────────────────
function StickyView({ todos }) {
  const { deleteTodo, toggleTodo } = useTodoStore()
  return (
    <div className="flex flex-wrap gap-2 content-start overflow-y-auto h-full">
      {todos.map((t) => (
        <div
          key={t.id}
          className={`relative rounded-lg p-2.5 flex flex-col gap-1 cursor-default group transition-opacity ${
            t.completed ? 'opacity-40' : ''
          }`}
          style={{
            background: 'var(--bg-glass-hover)',
            border: `1px solid var(--border-glass)`,
            minWidth: 110,
            maxWidth: 160,
            flex: '1 1 130px',
          }}
        >
          <div className={`w-full h-0.5 rounded-full mb-1 ${PRIORITY[t.priority].dot}`} />
          <p
            className={`text-xs leading-relaxed ${t.completed ? 'line-through' : ''}`}
            style={{ color: 'var(--text-primary)' }}
            onClick={() => toggleTodo(t.id)}
          >
            {t.text}
          </p>
          {t.dueDate && (
            <span className={`text-xs ${dueColor(t.dueDate)}`}>{formatDue(t.dueDate)}</span>
          )}
          <button
            onClick={() => deleteTodo(t.id)}
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Header mode button ───────────────────────────────────────────────
function ModeBtn({ mode, current, onClick, icon: Icon, title }) {
  const active = mode === current
  return (
    <button
      onClick={() => onClick(mode)}
      title={title}
      className="flex items-center justify-center w-6 h-5 rounded transition-colors"
      style={{
        background: active ? 'var(--accent-glow)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      <Icon size={12} />
    </button>
  )
}

// ── TodoWidget ───────────────────────────────────────────────────────
export default function TodoWidget() {
  const {
    getSorted, displayMode, showCompleted, sortBy,
    setDisplayMode, setShowCompleted, cycleSortBy,
    loadFromStore,
  } = useTodoStore()

  useEffect(() => { loadFromStore() }, [])

  const sorted = getSorted()
  const active = sorted.filter((t) => !t.completed)
  const done = sorted.filter((t) => t.completed)
  const visible = showCompleted ? sorted : active

  return (
    <div className="glass-widget">
      {/* Header */}
      <div className="widget-header widget-drag-handle">
        <div className="flex items-center gap-2">
          <span className="widget-title">To-Dos</span>
          {active.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
            >
              {active.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {/* Display mode */}
          <div
            className="flex gap-0.5 rounded-md p-0.5"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <ModeBtn mode="list"   current={displayMode} onClick={setDisplayMode} icon={List}        title="List" />
            <ModeBtn mode="kanban" current={displayMode} onClick={setDisplayMode} icon={LayoutGrid}  title="Kanban" />
            <ModeBtn mode="sticky" current={displayMode} onClick={setDisplayMode} icon={StickyNote}  title="Sticky notes" />
          </div>

          {/* Show completed */}
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            title={showCompleted ? 'Hide completed' : 'Show completed'}
            className="flex items-center justify-center w-7 h-6 rounded transition-colors"
            style={{ color: showCompleted ? 'var(--accent)' : 'var(--text-secondary)' }}
          >
            {showCompleted ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          {/* Sort cycle */}
          <button
            onClick={cycleSortBy}
            title={`Sort: ${SORT_LABEL[sortBy]}`}
            className="flex items-center justify-center w-7 h-6 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowUpDown size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-hidden py-1.5 px-0">
          {visible.length === 0 ? (
            <p className="text-center text-xs py-6 text-secondary">
              {sorted.length === 0 ? 'No tasks yet — add one below' : 'All done!'}
            </p>
          ) : displayMode === 'kanban' ? (
            <div className="px-2 h-full">
              <KanbanView active={active} done={done} showCompleted={showCompleted} />
            </div>
          ) : displayMode === 'sticky' ? (
            <div className="px-2 h-full">
              <StickyView todos={visible} />
            </div>
          ) : (
            <div className="overflow-y-auto h-full">
              {visible.map((t) => <TodoItem key={t.id} todo={t} />)}
            </div>
          )}
        </div>

        <AddTodo />
      </div>
    </div>
  )
}
