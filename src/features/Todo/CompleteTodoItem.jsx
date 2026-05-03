const CompleteTodoItem = ({ todo, actions }) => {
  const { onUndo, onMoveUp, onMoveDown } = actions;
  const { text, id } = todo;
  return (
    <li className="todo-item">
      <div className="item-content">
        <p className="item-text">{text}</p>
        <button className="button" onClick={() => onMoveUp(id)}>
          ↑
        </button>
        <button className="button" onClick={() => onMoveDown(id)}>
          ↓
        </button>
        <button className="button" onClick={() => onUndo(id)}>
          戻す
        </button>
      </div>
    </li>
  );
};
export default CompleteTodoItem;
