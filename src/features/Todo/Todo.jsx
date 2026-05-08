import { useEffect, useRef, useState } from 'react';
import { TodoInput, IncompleteTodoList, CompleteTodoList } from './index.js';
import styles from './Todo.module.scss';

// カスタムフック
const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]); // 中で使ってる変数を依存配列に入れるのが基本ルールです。たとえkeyが変化することなくても。

  return [value, setValue];
};

const useConfig = (value) => {
  const [config, setConfig] = useState(value);

  // * viteではpath書く時、public内は'/'からになる。
  useEffect(() => {
    const fetching = async () => {
      try {
        const res = await fetch('/config.json');
        if (!res.ok) {
          throw new Error('config fetch failed');
        }
        const data = await res.json();
        setConfig(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetching();
  }, []);
  return config;
};

// * orderの再設定
const normalizeOrder = (todos) => {
  const sorted = [...todos].sort((a, b) => a.order - b.order);
  const orderMap = new Map();
  sorted.forEach((todo, index) => {
    orderMap.set(todo.id, index + 1); // Mapにidをkeyとしてindex + 1でorderとなる値を保存
  });
  return todos.map((todo) => ({ ...todo, order: orderMap.get(todo.id) }));
  // idで検索してorderとなる値を渡す
};

// * todo.status でフィルターをかける
const filterTodosByStatus = (todos, status) => {
  return todos.filter((todo) => todo.status === status);
};

// * 更新(status)
const updateTodoStatus = ({ todos, id, status }) => {
  return todos.map((todo) => (todo.id === id ? { ...todo, status } : todo));
};

// * todoの移動
const moveTodoWithinStatus = ({ todos, id, offset, status }) => {
  const sorted = [...todos].sort((a, b) => a.order - b.order);
  const list = sorted.filter((todo) => todo.status === status);

  const index = list.findIndex((todo) => todo.id === id);
  if (index === -1) return todos;

  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= list.length) return todos;

  const current = list[index];
  const target = list[targetIndex];

  const tempTodos = todos.map((todo) => {
    if (todo.id === current.id) {
      return { ...todo, order: target.order + (offset > 0 ? 0.1 : -0.1) };
    }
    return todo;
  });
  return normalizeOrder(tempTodos);
};

// * ==========================================
// * Todo
// * ==========================================

const Todo = () => {
  const config = useConfig(null);
  const [todos, setTodos] = useLocalStorage('todos', []);
  const draggedIdRef = useRef(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  if (!config) return <p>loading...</p>;

  const sortedTodos = [...todos].sort((a, b) => a.order - b.order);
  const incompleteTodos = filterTodosByStatus(sortedTodos, 'incomplete');
  const completeTodos = filterTodosByStatus(sortedTodos, 'complete');
  const MAX_TODOS = config?.MAX_TODOS ?? 7; // 念の為の保険
  const isLimitReached = todos.length >= MAX_TODOS;
  const DRAG_THRESHOLD = config?.DRAG_THRESHOLD ?? 5; // 念の為の保険

  // * 新しいtodoを追加する処理
  const handleAddTodo = (text) => {
    if (isLimitReached) return;
    const maxOrder = todos.length ? Math.max(...todos.map((t) => t.order)) : 0;

    const newTodo = {
      text,
      id: Date.now(),
      status: 'incomplete',
      order: maxOrder + 1,
    };
    setTodos((prevTodos) => [...prevTodos, newTodo]);
  };

  // * todoを削除
  const handleDeleteTodo = (id) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    // * 一致しないidを集めて実質削除を行なっている
  };

  // * todoの状態を完了にする
  const handleCompleteTodo = (id) => {
    setTodos((prevTodos) => updateTodoStatus({ todos: prevTodos, id, status: 'complete' }));
  };

  // * todoの状態を未完了にする
  const handleUndoTodo = (id) => {
    setTodos((prevTodos) => updateTodoStatus({ todos: prevTodos, id, status: 'incomplete' }));
  };

  // * todoの並びを上に移動させる
  const handleMoveUp = (id, status) => {
    setTodos((prevTodos) => moveTodoWithinStatus({ todos: prevTodos, id, offset: -1, status }));
  };

  // * todoの並びを下に移動させる
  const handleMoveDown = (id, status) => {
    setTodos((prevTodos) => moveTodoWithinStatus({ todos: prevTodos, id, offset: 1, status }));
  };

  const createPointerDragContext = (e) => {
    const { target, clientY } = e;
    const item = target.closest('[data-id]');
    if (!item) return null;
    const id = Number(item.dataset.id);
    if (Number.isNaN(id)) return null;
    e.currentTarget.setPointerCapture(e.pointerId);
    return { draggedId: id, startY: clientY };
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('button')) return; // ボタンの時はガード
    const context = createPointerDragContext(e);
    if (!context) return;
    draggedIdRef.current = context.id;
    startYRef.current = context.startY;
  };

  const startPointerDragIfNedded = ({ e, startY, isDragging }) => {
    if (isDragging) return false;
    const currentY = e.clientY;
    const shouldStart = Math.abs(currentY - startY) > DRAG_THRESHOLD;
    if (!shouldStart) return false;
    return true;
  };

  const handlePointerMove = (e) => {
    if (draggedIdRef.current === null) return;
    const dragStarted = startPointerDragIfNedded({ e, startY: startYRef.current, isDragging: isDraggingRef.current });
    if (dragStarted) {
      isDraggingRef.current = true;
      e.preventDefault();
    }
    if (!isDraggingRef.current) return;
    console.log('drag中');
  };

  const getReorderedTodosByPointerDrop = () => {
    // getReorderedTodosByPointerDrop(e);
  };

  const handlePointerUp = (e) => {
    try {
      if (!isDraggingRef.current) return;

      if (draggedIdRef.current === null) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;

      const item = el.closest('[data-id]');
      if (item === null) return;

      const toId = Number(item.dataset.id);
      if (Number.isNaN(toId)) return;

      const fromId = draggedIdRef.current;
      if (fromId === null) return;

      const rect = item.getBoundingClientRect(); // 位置情報取得
      const middleY = rect.top + rect.height / 2; // 対象の真ん中のY座標取得
      const shouldInsertAfter = e.clientY > middleY; // 後ろに挿入すべきか?

      const toIndex = todos.findIndex((todo) => todo.id === toId);
      const fromIndex = todos.findIndex((todo) => todo.id === fromId);
      if (fromIndex === -1 || toIndex === -1) return;

      let insertIndex;
      const isMovingDown = fromIndex < toIndex;
      if (isMovingDown) {
        insertIndex = shouldInsertAfter ? toIndex : toIndex - 1;
      } else {
        insertIndex = shouldInsertAfter ? toIndex + 1 : toIndex;
      }
      if (fromIndex === insertIndex) return;

      setTodos((prevTodos) => moveTodoWithinStatus({ todos: prevTodos, id, offset: -1, status }));
    } finally {
      draggedIdRef.current = null;
      isDraggingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    console.log('pu');
  };

  const handlePointerCancel = () => {
    draggedIdRef.current = null;
    isDraggingRef.current = false;
    console.log('pc');
  };

  const todoAction = {
    onComplete: handleCompleteTodo,
    onDelete: handleDeleteTodo,
    onUndo: handleUndoTodo,
    onMoveUp: handleMoveUp,
    onMoveDown: handleMoveDown,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointercancel: handlePointerCancel,
  };

  return (
    <div className={styles.todo}>
      <TodoInput onAddTodo={handleAddTodo} disabled={isLimitReached} />
      {isLimitReached && <p style={{ color: 'red' }}>登録できるTODOは7個までです。</p>}
      <IncompleteTodoList todos={incompleteTodos} actions={todoAction} />
      <CompleteTodoList todos={completeTodos} actions={todoAction} />
    </div>
  );
};

export default Todo;
