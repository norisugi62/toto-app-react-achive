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

// * todo.status でフィルターをかける
const filterTodosByStatus = (todos, status) => {
  return todos.filter((todo) => todo.status === status);
};

// * 更新(status)
const updateTodoStatus = ({ todos, id, status }) => {
  return todos.map((todo) => (todo.id === id ? { ...todo, status } : todo));
};

const moveTodoByOffset = ({ todos, id, offset }) => {
  const fromIndex = todos.findIndex((todo) => todo.id === id);
  if (fromIndex === -1) return todos;

  const toIndex = fromIndex + offset;
  if (toIndex < 0) return todos;
  if (toIndex >= todos.length) return todos;

  const newTodos = [...todos];
  const removedTodo = newTodos.splice(fromIndex, 1)[0];
  newTodos.splice(toIndex, 0, removedTodo);
  return newTodos;
  // const sorted = [...todos].sort((a, b) => a.order - b.order);

  // const index = sorted.findIndex((todo) => todo.id === id);
  // if (index === -1) return todos;

  // const targetIndex = index + offset;
  // if (targetIndex < 0) return todos;
  // if (targetIndex >= sorted.length) return todos;

  // const current = sorted[index];
  // const target = sorted[targetIndex];

  // const newOrder = target.order;

  // const newTodos = todos.map((todo) => {
  //   if (todo.id === current.id) {
  //     return { ...todo, order: newOrder + (offset > 0 ? 0.1 : -0.1) };
  //   }
  //   return todo;
  // });
  // return newTodos;
};

// * ==========================================
// * Todo
// * ==========================================

const Todo = () => {
  const [todos, setTodos] = useLocalStorage('todos', []);
  const sortedTodos = [...todos].sort((a, b) => a.order - b.order);
  const incompleteTodos = filterTodosByStatus(sortedTodos, 'incomplete');
  const completeTodos = filterTodosByStatus(sortedTodos, 'complete');

  // * 新しいtodoを追加する処理
  const handleAddTodo = (text) => {
    const newTodo = { text, id: Date.now(), status: 'incomplete', order: todos.length + 1 };
    setTodos((prevTodos) => [newTodo, ...prevTodos]);
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
  const handleMoveUp = (id) => {
    setTodos((prevTodos) => moveTodoByOffset({ todos: prevTodos, id, offset: -1 }));
  };

  // * todoの並びを下に移動させる
  const handleMoveDown = (id) => {
    setTodos((prevTodos) => moveTodoByOffset({ todos: prevTodos, id, offset: 1 }));
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
      <TodoInput onAddTodo={handleAddTodo} />
      <IncompleteTodoList todos={incompleteTodos} actions={todoAction} />
      <CompleteTodoList todos={completeTodos} actions={todoAction} />
    </div>
  );
};

export default Todo;
