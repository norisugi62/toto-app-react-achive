import { useState } from 'react';
import styles from './TodoInput.module.scss';

const TodoInput = ({ onAddTodo }) => {
  const [text, setText] = useState('');

  // buttonで登録
  const handleClick = () => {
    const trimedText = text.trim();
    if (trimedText.trim() === '') return;
    onAddTodo(trimedText);
    setText('');
  };

  // キーボードで登録
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleClick();
    }
  };

  return (
    <div className={styles.input}>
      <input
        className={styles.field}
        type="text"
        name="todo"
        value={text}
        placeholder="TODOを入力"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      ></input>
      <button className={`button ${styles.primary}`} onClick={handleClick}>
        追加
      </button>
    </div>
  );
};
export default TodoInput;
