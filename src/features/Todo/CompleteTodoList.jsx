import CompleteTodoItem from './CompleteTodoItem.jsx';
import styles from './CompleteTodoList.module.scss';

const CompleteTodoList = ({ todos, actions }) => {
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = actions;
  return (
    <div className={styles.complete}>
      <p className="section-title">完了のOTODO</p>
      <ul onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
        {todos.map((todo) => (
          <CompleteTodoItem key={todo.id} todo={todo} actions={actions} />
        ))}
      </ul>
    </div>
  );
};
export default CompleteTodoList;
