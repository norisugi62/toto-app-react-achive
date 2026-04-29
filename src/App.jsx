import { useEffect, useState } from 'react';


// const App = () => {
//   console.log('App');
//   const [num, setNum] = useState(0);
//   const [isShowFace, setIsShowFace] = useState(false);
//   const onClickCountUp = () => {
//     setNum((prev) => prev + 1);
//   };
//   const onClickShowFace = () => {
//     setIsShowFace((prev) => !prev);
//   };

//   useEffect(() => {
//     console.log('useEffect2');
//     if (num > 0) {
//       setIsShowFace(num % 3 === 0);
//     }
//   }, [num]);

//   useEffect(() => {
//     console.log('useEffect1');

//   }, []);
//   return (
//     <>
//       <h1 style={{ color: 'red' }}>こんにちは</h1>
//       <ColorfulMessage color="blue">お元気ですか？</ColorfulMessage>
//       <ColorfulMessage color="green">元気ですよ</ColorfulMessage>
//       <ColorfulMessage color="red">腹減った</ColorfulMessage>
//       <button onClick={onClickCountUp}>カウントアップ</button>
//       <p>{num}</p>
//       <button onClick={onClickShowFace}>{isShowFace ? '非表示' : '表示'}</button>
//       {isShowFace && <p>^s^</p>}
//     </>
//   );
// };
function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  console.log('① レンダリング開始');

  useEffect(() => {
    console.log('④ 初回マウント時のみ実行');
  }, []);

  useEffect(() => {
    console.log('④ count が変わったとき実行:', count);
  }, [count]);

  useEffect(() => {
    console.log('④ text が変わったとき実行:', text);
  }, [text]);

  useEffect(() => {
    console.log('④ count または text が変わったとき実行');
  }, [count, text]);

  const onClick = () => {
    console.log('② クリックイベント');
    setCount((prev) => prev + 1);
  };

  return (
    <>
      <button onClick={onClick}>+1</button>
      <p>{count}</p>
      <input value={text} onChange={(e) => setText(e.target.value)} />
    </>
  );
}

export { App };

