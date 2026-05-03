import IncompleteTodoItem from './IncompleteTodoItem';
import styles from './IncompleteTodoList.module.scss';

const IncompleteTodoList = ({ todos, actions }) => {
  return (
    <div className={styles.incomplete}>
      <p className="section-title">未完了のTODO</p>
      <ul>
        {todos.map((todo) => (
          <IncompleteTodoItem key={todo.id} todo={todo} actions={actions} />
        ))}
      </ul>
    </div>
  );
};
export default IncompleteTodoList;
