import { create } from 'zustand'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, none: 3 }

function sortedTodos(todos, sortBy) {
  const copy = [...todos]
  if (sortBy === 'priority') {
    return copy.sort((a, b) => {
      const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      return diff !== 0 ? diff : new Date(a.createdAt) - new Date(b.createdAt)
    })
  }
  if (sortBy === 'dueDate') {
    return copy.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate) - new Date(b.dueDate)
    })
  }
  // manual — insertion order
  return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

const DEFAULTS = {
  todos: [],
  displayMode: 'list',   // 'list' | 'kanban' | 'sticky'
  showCompleted: true,
  sortBy: 'manual',      // 'manual' | 'priority' | 'dueDate'
}

export const useTodoStore = create((set, get) => ({
  ...DEFAULTS,

  // Sorted view — derived, not stored
  getSorted: () => sortedTodos(get().todos, get().sortBy),

  loadFromStore: async () => {
    const [todos, displayMode, showCompleted, sortBy] = await Promise.all([
      window.electronAPI?.storeGet('todos.items'),
      window.electronAPI?.storeGet('todos.displayMode'),
      window.electronAPI?.storeGet('todos.showCompleted'),
      window.electronAPI?.storeGet('todos.sortBy'),
    ])
    set({
      ...(Array.isArray(todos) ? { todos } : {}),
      ...(displayMode ? { displayMode } : {}),
      ...(showCompleted !== null && showCompleted !== undefined ? { showCompleted } : {}),
      ...(sortBy ? { sortBy } : {}),
    })
  },

  addTodo: (text, priority = 'none', dueDate = null) => {
    const todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
    }
    const todos = [...get().todos, todo]
    set({ todos })
    window.electronAPI?.storeSet('todos.items', todos)
  },

  updateTodo: (id, updates) => {
    const todos = get().todos.map((t) => (t.id === id ? { ...t, ...updates } : t))
    set({ todos })
    window.electronAPI?.storeSet('todos.items', todos)
  },

  toggleTodo: (id) => {
    const todos = get().todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    )
    set({ todos })
    window.electronAPI?.storeSet('todos.items', todos)
  },

  deleteTodo: (id) => {
    const todos = get().todos.filter((t) => t.id !== id)
    set({ todos })
    window.electronAPI?.storeSet('todos.items', todos)
  },

  setDisplayMode: (mode) => {
    set({ displayMode: mode })
    window.electronAPI?.storeSet('todos.displayMode', mode)
  },

  setShowCompleted: (show) => {
    set({ showCompleted: show })
    window.electronAPI?.storeSet('todos.showCompleted', show)
  },

  cycleSortBy: () => {
    const ORDER = ['manual', 'priority', 'dueDate']
    const next = ORDER[(ORDER.indexOf(get().sortBy) + 1) % ORDER.length]
    set({ sortBy: next })
    window.electronAPI?.storeSet('todos.sortBy', next)
  },
}))
