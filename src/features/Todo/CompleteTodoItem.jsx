const CompleteTodoItem = ({ todo, actions }) => {
  const { onUndo, onMoveUp, onMoveDown } = actions;
  const { text, id, status } = todo;
  return (
    <li className="todo-item" data-id={id}>
      <div className="item-content">
        <p className="item-text">{text}</p>
        <button className="button" onClick={() => onMoveUp(id, status)}>
          ↑
        </button>
        <button className="button" onClick={() => onMoveDown(id, status)}>
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
