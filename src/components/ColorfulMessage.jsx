export const ColorfulMessage = ({ color, children }) => {
  const contentStyleA = {
    color,
    fontSize: '15px',
  };
  return <p style={contentStyleA}>{children}</p>;
};

// 練習用に作ったでなのでTodoには関係ないコンポーネントです。

