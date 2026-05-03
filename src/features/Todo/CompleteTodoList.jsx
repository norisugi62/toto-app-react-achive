import CompleteTodoItem from './CompleteTodoItem.jsx';
import styles from './CompleteTodoList.module.scss';

const CompleteTodoList = ({ todos, actions }) => {
  return (
    <div className={styles.complete}>
      <p className="section-title">完了のOTODO</p>
      <ul>
        {todos.map((todo) => (
          <CompleteTodoItem key={todo.id} todo={todo} actions={actions} />
        ))}
      </ul>
    </div>
  );
};
export default CompleteTodoList;
