import IncompleteTodoItem from './IncompleteTodoItem';
import styles from './IncompleteTodoList.module.scss';

const IncompleteTodoList = ({ todos, actions }) => {
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = actions;
  return (
    <div className={styles.incomplete}>
      <p className="section-title">未完了のTODO</p>
      <ul onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
        {todos.map((todo) => (
          <IncompleteTodoItem key={todo.id} todo={todo} actions={actions} />
        ))}
      </ul>
    </div>
  );
};
export default IncompleteTodoList;
