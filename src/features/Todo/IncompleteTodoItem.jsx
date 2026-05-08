const IncompleteTodoItem = ({ todo, actions }) => {
  const { onComplete, onDelete, onMoveUp, onMoveDown } = actions;
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
        <button className="button" onClick={() => onComplete(id)}>
          完了
        </button>
        <button className="button" onClick={() => onDelete(id)}>
          削除
        </button>
      </div>
    </li>
  );
};
export default IncompleteTodoItem;
