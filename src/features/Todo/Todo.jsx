import { useEffect, useState } from 'react';
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

const useConfig = (value) => {
  const [config, setConfig] = useState(value);
  useEffect(() => {
    fetch('/config.json')
      .then((res) => res.json())
      .then((data) => setConfig(data));
  }, []);
  return config;
};

// * ==========================================
// * Todo
// * ==========================================

const Todo = () => {
  const config = useConfig(null);
  const [todos, setTodos] = useLocalStorage('todos', []);

  if (!config) return <p>loading...</p>;

  const sortedTodos = [...todos].sort((a, b) => a.order - b.order);
  const incompleteTodos = filterTodosByStatus(sortedTodos, 'incomplete');
  const completeTodos = filterTodosByStatus(sortedTodos, 'complete');
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

  // * todoの並びを下に移動させる
  const handleMoveDown = (id, status) => {
    setTodos((prevTodos) => moveTodoWithinStatus({ todos: prevTodos, id, offset: 1, status }));
  };

  const todoAction = {
    onComplete: handleCompleteTodo,
    onDelete: handleDeleteTodo,
    onUndo: handleUndoTodo,
    onMoveUp: handleMoveUp,
    onMoveDown: handleMoveDown,
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
