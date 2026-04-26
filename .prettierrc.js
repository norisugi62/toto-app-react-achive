// .prettierrc.js
export default {
  semi: true, // 文末にセミコロンをつける
  singleQuote: true, // 文字列はシングルクォートにする
  tabWidth: 2, // タブ幅
  trailingComma: 'es5', // 配列・オブジェクトの末尾カンマ
  bracketSpacing: true, // オブジェクトリテラルの括弧内の空白
  bracketSameLine: false, // JSX の閉じタグの位置
  arrowParens: 'always', // アロー関数のパラメータに括弧をつけるか
  printWidth: 130, // 1行の最大文字数
  endOfLine: 'lf', // OSによって違う改行コードをlfに統一
};
