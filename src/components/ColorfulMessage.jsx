export const ColorfulMessage = ({ color, children }) => {
  console.log('colorfulMessage');
  const contentStyleA = {
    color,
    fontSize: '15px',
  };
  return <p style={contentStyleA}>{children}</p>;
};

