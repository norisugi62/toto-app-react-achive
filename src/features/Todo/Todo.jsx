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

// * idからtodoを取得する
const getTodoById = ({ todos, id }) => {
  return todos.find((todo) => todo.id === id);
};

// * idからtodoIndexを取得する
const getTodoIndexById = ({ list, id }) => {
  return list.findIndex((todo) => todo.id === id);
};

// * todosをsortさせる
const sortTodosByOrder = ({ list, direction = 'asc' }) => {
  const sorted = [...list].sort((a, b) => {
    return direction === 'asc' ? a.order - b.order : b.order - a.order;
  });
  return sorted;
};

// * orderの再設定
const normalizeOrder = (todos) => {
  const sorted = sortTodosByOrder({ list: todos });
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

// * todoのbutton移動
const moveTodoWithinStatus = ({ todos, id, offset, status }) => {
  const sorted = sortTodosByOrder({ list: todos });

  const list = filterTodosByStatus(sorted, status);

  const index = getTodoIndexById({ list, id });

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

  const sortedTodos = sortTodosByOrder({ list: todos });
  const incompleteTodos = filterTodosByStatus(sortedTodos, 'incomplete');
  const completeTodos = filterTodosByStatus(sortedTodos, 'complete');
  const DRAG_THRESHOLD = config?.DRAG_THRESHOLD ?? 5; // 念の為の保険
  const MAX_TODOS = config?.MAX_TODOS ?? 7; // 念の為の保険
  const isLimitReached = todos.length >= MAX_TODOS;

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

  // * pointerの位置がtarget中央より下かどうかを取得する
  const getShouldInsertAfter = ({ target, clientY }) => {
    const rect = target.getBoundingClientRect(); // 位置情報取得
    const middleY = rect.top + rect.height / 2; // 対象の真ん中のY座標取得
    return clientY > middleY; // 中央の座標より大きいなら超えた(true)
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
    draggedIdRef.current = context.draggedId;
    startYRef.current = context.startY;
  };

  const startPointerDragIfNeeded = ({ e, startY, isDragging }) => {
    if (isDragging) return false;
    const currentY = e.clientY;
    const shouldStart = Math.abs(currentY - startY) > DRAG_THRESHOLD;
    if (!shouldStart) return false;
    return true;
  };

  const handlePointerMove = (e) => {
    if (draggedIdRef.current === null) return;
    const dragStarted = startPointerDragIfNeeded({ e, startY: startYRef.current, isDragging: isDraggingRef.current });
    if (dragStarted) {
      isDraggingRef.current = true;
      e.preventDefault();
    }
    if (!isDraggingRef.current) return;
    console.log('drag中');
  };

  const cleanupPointerDrag = (e) => {
    draggedIdRef.current = null;
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const getPointerDropContext = (e) => {
    if (!isDraggingRef.current) return null;
    if (draggedIdRef.current === null) return null;

    // pointer座標上にある実際の要素を取得
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return null;

    const item = el.closest('[data-id]');
    if (!item) return null;

    const toId = Number(item.dataset.id);
    if (Number.isNaN(toId)) return null;

    const fromId = draggedIdRef.current;
    return { fromId, toId, targetItem: item };
  };

  const reorderTodosByPointerDrop = ({ todos, context, clientY }) => {
    const { fromId, toId, targetItem } = context;
    const draggedTodo = getTodoById({ todos, id: fromId });
    if (!draggedTodo) return todos;
    const { status } = draggedTodo;

    const sorted = sortTodosByOrder({ list: todos });
    const list = filterTodosByStatus(sorted, status);
    const fromIndex = getTodoIndexById({ list, id: fromId });
    const toIndex = getTodoIndexById({ list, id: toId });
    if (fromIndex === -1 || toIndex === -1) return todos;
    const shouldInsertAfter = getShouldInsertAfter({ target: targetItem, clientY });

    let insertIndex;

    // 上移動か下移動かでinsert位置が変わる
    const isMovingDown = fromIndex < toIndex;

    if (isMovingDown) {
      insertIndex = shouldInsertAfter ? toIndex : toIndex - 1;
    } else {
      insertIndex = shouldInsertAfter ? toIndex + 1 : toIndex;
    }

    if (fromIndex === insertIndex) return todos;

    const offset = insertIndex - fromIndex;
    const current = list[fromIndex];
    const target = list[insertIndex];

    const tempTodos = todos.map((todo) => {
      if (todo.id === current.id) {
        return { ...todo, order: target.order + (offset > 0 ? 0.1 : -0.1) };
      }
      return todo;
    });
    return normalizeOrder(tempTodos);
  };

  const handlePointerUp = (e) => {
    try {
      const dropContext = getPointerDropContext(e);
      if (!dropContext) return;
      setTodos((prevTodos) => reorderTodosByPointerDrop({ todos: prevTodos, context: dropContext, clientY: e.clientY }));
    } finally {
      // drag状態をリセット
      cleanupPointerDrag(e);
    }
  };

  const handlePointerCancel = (e) => {
    // drag状態をリセット
    cleanupPointerDrag(e);
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
    onPointerCancel: handlePointerCancel,
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
