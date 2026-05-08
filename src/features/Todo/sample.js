export default class TodoApp {
  constructor() {
    // ==========================================
    // state
    // ==========================================
    this.todos = JSON.parse(localStorage.getItem('todos')) || []; // localStorage読み込み
    this.isDragging = false;
    this.draggedId = null;
    this.startY = 0;
    this.pointerY = 0;

    // ==========================================
    // DOM
    // ==========================================
    this.input = document.getElementById('todo__input-text');
    this.addButton = document.getElementById('todo__add-button');
    this.incompleteList = document.getElementById('todo__incomplete-list');
    this.completeList = document.getElementById('todo__complete-list');

    // ==========================================
    // bind
    // ==========================================
    this.handleAddTodo = this.handleAddTodo.bind(this);
    this.handleIncompleteListClick = this.handleIncompleteListClick.bind(this);
    this.handleCompleteListClick = this.handleCompleteListClick.bind(this);
    this.handleInputKeyDown = this.handleInputKeyDown.bind(this);
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerCancel.bind(this);

    // ==========================================
    // init
    // ==========================================
    this.handleEvent();
    this.renderTodos();
  }

  // ==========================================
  // ロジック
  // ==========================================

  /**
   * ドラッグ移動時の挿入位置(戻り値: insertIndex)を計算する
   * fromIndex, toIndexで移動方向と、shouldInsertAfterの
   * マウスが閾値を超えたかどうかを元に挿入すべきindexを返す
   */
  calculateInsertIndex({ fromIndex, toIndex, shouldInsertAfter }) {
    const isMovingDown = fromIndex < toIndex;
    if (isMovingDown) {
      return shouldInsertAfter ? toIndex : toIndex - 1;
    } else {
      return shouldInsertAfter ? toIndex + 1 : toIndex;
    }
  }

  // * 5px超えたならdrag開始したと判断する
  shouldStartPointerDrag({ startY, currentY, threshold = 5 }) {
    return Math.abs(currentY - startY) > threshold;
  }

  // ==========================================
  // state操作
  // ==========================================

  // * 新しいtodoを先頭に追加した新しいリストを返す
  addTodo({ text, list, id }) {
    return [{ text, status: 'incomplete', id }, ...list];
  }

  // * 指定したidを削除して新しいリストを返す
  deleteTodoById({ id, list }) {
    return list.filter((todo) => todo.id !== id);
  }

  // * 指定したidのstatusを更新した新しいリストを返す
  updateStatusById({ id, status, list }) {
    return list.map((todo) => (todo.id === id ? { ...todo, status } : todo));
  }

  // * 現在のtodosをローカルストレージに保存
  saveTodos() {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }

  // * todosの並び順を変更して新しいリストを返す
  moveTodos({ fromIndex, toIndex, list }) {
    const newList = [...list];
    const [item] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, item);
    return newList;
  }

  // * todoをoffset分移動させる関数
  moveTodoByOffset({ id, list, offset }) {
    const fromIndex = this.getIndexById({ id, list });
    if (fromIndex === -1) return list; // 見つからない場合は、元のlistを返す
    const toIndex = fromIndex + offset;
    // toIndexが、0未満もしくはlist.length以上になった場合は、元のlistを返す
    if (toIndex < 0 || toIndex >= list.length) return list;
    return this.moveTodos({
      fromIndex,
      toIndex,
      list,
    });
  }

  // * ドラッグ後、idからtodoの順番を変更する関数
  reorderByDrop({ fromId, toId, shouldInsertAfter, list }) {
    const toIndex = this.getIndexById({ id: toId, list });
    const fromIndex = this.getIndexById({ id: fromId, list });
    if (fromIndex === -1 || toIndex === -1) return list;

    const insertIndex = this.calculateInsertIndex({ fromIndex, toIndex, shouldInsertAfter });
    if (fromIndex === insertIndex) return list;
    return this.moveTodos({ fromIndex, toIndex, list });
  }

  // * 保存と描画を同じに実行する
  saveAndRender() {
    this.saveTodos();
    this.renderTodos();
  }

  // ==========================================
  // DOM取得
  // ==========================================

  // * idを使ってindexを取得(ない時は-1を返す。ある時はindexを返す)
  getIndexById({ list, id }) {
    return list.findIndex((todo) => todo.id === id);
  }

  // * 要素から.todo__item[data-id]を取得
  getTodoItem(element) {
    const todoItem = element.closest('.todo__item[data-id]');
    return todoItem ? todoItem : null;
  }

  // * .todo__itemから、idを取得
  getTodoId(todoItem) {
    const id = Number(todoItem.dataset.id);
    return Number.isNaN(id) ? null : id;
  }

  // * 要素から.todo__item[data-id]を探しidを取得する
  getTodoIdFromElement(element) {
    const todoItem = this.getTodoItem(element);
    return todoItem ? this.getTodoId(todoItem) : null;
  }

  // * templateタグからcloneを作り出し取得
  createCloneFromTemplate(templateId) {
    const template = document.getElementById(templateId);
    return template.content.cloneNode(true);
  }

  // * handleDropの中で使うデータを集める関数
  getDropContext(e) {
    const target = this.getTodoItem(e.target);
    if (target === null) return null;
    const toId = this.getTodoId(target);
    if (toId === null) return null;
    const fromId = this.draggedId;
    if (fromId === null) return null;
    const rect = target.getBoundingClientRect(); // 位置情報取得
    const middleY = rect.top + rect.height / 2; // 対象の真ん中のY座標取得
    const shouldInsertAfter = e.clientY > middleY; // 後ろに挿入すべきか?
    return { fromId, toId, shouldInsertAfter };
  }

  calculateInsertIndex({ fromIndex, toIndex, shouldInsertAfter }) {
    const isMovingDown = fromIndex < toIndex;
    if (isMovingDown) {
      return shouldInsertAfter ? toIndex : toIndex - 1;
    } else {
      return shouldInsertAfter ? toIndex + 1 : toIndex;
    }
  }
  // * handlePointerDropの中でデータを集める関数
  getPointerDropContext({ el, clientY }) {
    const target = this.getTodoItem(el);
    if (target === null) return null;
    const toId = this.getTodoId(target);
    if (toId === null) return null;
    const fromId = this.draggedId;
    if (fromId === null) return null;
    const rect = target.getBoundingClientRect(); // 位置情報取得
    const middleY = rect.top + rect.height / 2; // 対象の真ん中のY座標取得
    const shouldInsertAfter = clientY > middleY; // 後ろに挿入すべきか?
    return { fromId, toId, shouldInsertAfter };
  }

  // ==========================================
  // 描画
  // ==========================================

  // * 読み込んだtodoを描画
  renderTodos() {
    // 一旦空にする
    this.incompleteList.innerHTML = '';
    this.completeList.innerHTML = '';
    this.todos.forEach((todo) => {
      const element = this.createTodoElement(todo); // 描画するtodoを取得
      const list = this.getTargetList(todo.status); // 描画するリストを取得
      list.append(element); // リストに要素を追加していく
    });
  }

  // * 描画するtodoを返す
  createTodoElement(todo) {
    const isIncomplete = todo.status === 'incomplete';
    const templateId = isIncomplete ? 'todo__incomplete-template' : 'todo__complete-template';
    const templateClone = this.createCloneFromTemplate(templateId);
    templateClone.querySelector('.todo__item-text').textContent = todo.text;
    templateClone.querySelector('.todo__item').dataset.id = todo.id;
    return templateClone;
  }

  // * 描画するリストを取得
  getTargetList(status) {
    return status === 'incomplete' ? this.incompleteList : this.completeList;
  }

  // ==========================================
  // イベント
  // ==========================================

  // * イベント登録
  handleEvent() {
    this.input.addEventListener('keydown', this.handleInputKeyDown, false);
    this.addButton.addEventListener('click', this.handleAddTodo, false);
    this.incompleteList.addEventListener('click', this.handleIncompleteListClick, false);
    this.completeList.addEventListener('click', this.handleCompleteListClick, false);
    // this.incompleteList.addEventListener('dragstart', this.handleDragStart, false);
    // this.incompleteList.addEventListener('dragover', this.handleDragOver, false);
    // this.incompleteList.addEventListener('drop', this.handleDrop, false);
    this.incompleteList.addEventListener('pointerdown', this.handlePointerDown, false);
    this.incompleteList.addEventListener('pointermove', this.handlePointerMove, false);
    this.incompleteList.addEventListener('pointerup', this.handlePointerUp, false);
    this.incompleteList.addEventListener('pointercancel', this.handlePointerCancel, false);
  }

  // * todo 追加処理
  handleAddTodo() {
    const text = this.input.value;
    if (text.trim() === '') return; // 空文字なら無視
    this.todos = this.addTodo({ text, list: this.todos, id: Date.now() });
    this.saveAndRender();
    this.input.value = '';
  }

  // * Enterでもtodo追加(e.isComposingは、日本語変換中のenter時にtrueになる。)
  handleInputKeyDown(e) {
    if (e.key === 'Enter' && !e.isComposing) {
      this.handleAddTodo();
    }
  }

  // * deleteボタン押した処理
  handleDeleteItem(button) {
    const id = this.getTodoIdFromElement(button);
    if (id === null) return;

    const newTodos = this.todos.filter((todo) => todo.id !== id);
    if (this.todos.length === newTodos.length) return;
    this.todos = newTodos;
    this.saveAndRender();
  }

  // * completeボタン押した処理
  handleCompleteItem(button) {
    const id = this.getTodoIdFromElement(button);
    if (id === null) return;
    this.todos = this.updateStatusById({ id, status: 'complete', list: this.todos });
    this.saveAndRender();
  }

  // * backボタンを押した処理
  handleBackItem(button) {
    const id = this.getTodoIdFromElement(button);
    if (id === null) return;
    this.todos = this.updateStatusById({ id, status: 'incomplete', list: this.todos });
    this.saveAndRender();
  }

  // * ↑ボタンを押した時の処理
  handleMoveUp(button) {
    const id = this.getTodoIdFromElement(button);
    if (id === null) return;
    this.todos = this.moveTodoByOffset({ id, list: this.todos, offset: -1 });
    this.saveAndRender();
  }

  // * ↓ボタンを押した時の処理
  handleMoveDown(button) {
    const id = this.getTodoIdFromElement(button);
    if (id === null) return;
    this.todos = this.moveTodoByOffset({ id, list: this.todos, offset: 1 });
    this.saveAndRender();
  }

  // * 未完了TODOの中の処理
  handleIncompleteListClick(e) {
    const deleteBtn = e.target.closest('.todo__delete-button');
    const completeBtn = e.target.closest('.todo__complete-button');
    const upBtn = e.target.closest('.todo__up-button');
    const downBtn = e.target.closest('.todo__down-button');

    // 上ボタン
    if (upBtn) {
      this.handleMoveUp(upBtn);
      return;
    }

    //下ボタン
    if (downBtn) {
      this.handleMoveDown(downBtn);
      return;
    }

    // 削除
    if (deleteBtn) {
      this.handleDeleteItem(deleteBtn);
      return;
    }

    // 完了
    if (completeBtn) {
      this.handleCompleteItem(completeBtn);
      return;
    }
  }

  // * 完了TODOの中の処理
  handleCompleteListClick(e) {
    const backBtn = e.target.closest('.todo__back-button');
    const upBtn = e.target.closest('.todo__up-button');
    const downBtn = e.target.closest('.todo__down-button');

    // 上ボタン
    if (upBtn) {
      this.handleMoveUp(upBtn);
      return;
    }

    //下ボタン
    if (downBtn) {
      this.handleMoveDown(downBtn);
      return;
    }

    // 戻る
    if (backBtn) {
      this.handleBackItem(backBtn);
      return;
    }
  }

  // ==========================================
  // pointer イベント
  // ==========================================
  handlePointerDown(e) {
    if (e.target.closest('button')) return;
    const id = this.getTodoIdFromElement(e.target);
    if (id === null) return;
    this.draggedId = id;
    this.startY = e.clientY;
  }

  handlePointerMove(e) {
    if (this.draggedId === null) return;
    if (!this.isDragging && this.shouldStartPointerDrag({ startY: this.startY, currentY: e.clientY })) {
      this.startPointerDrag(e);
    }
    if (!this.isDragging) return;
  }

  handlePointerUp(e) {
    try {
      if (!this.isDragging) return;
      if (this.draggedId === null) return;

      // ポインタの下にある本当の要素を取得
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const target = this.getTodoItem(el);
      if (!target) return;
      const context = this.getPointerDropContext({ el, clientY: e.clientY });
      if (!context) return;
      this.todos = this.reorderByDrop({ ...context, list: this.todos });
      this.saveAndRender();
    } finally {
      this.draggedId = null;
      this.isDragging = false;
    }
  }

  reorderByDrop({ fromId, toId, shouldInsertAfter, list }) {
    const toIndex = this.getIndexById({ id: toId, list });
    const fromIndex = this.getIndexById({ id: fromId, list });
    if (fromIndex === -1 || toIndex === -1) return list;

    const insertIndex = this.calculateInsertIndex({ fromIndex, toIndex, shouldInsertAfter });
    if (fromIndex === insertIndex) return list;
    return this.moveTodos({ fromIndex, toIndex, list });
  }

  calculateInsertIndex({ fromIndex, toIndex, shouldInsertAfter }) {
    const isMovingDown = fromIndex < toIndex;
    if (isMovingDown) {
      return shouldInsertAfter ? toIndex : toIndex - 1;
    } else {
      return shouldInsertAfter ? toIndex + 1 : toIndex;
    }
  }
  // * handlePointerDropの中でデータを集める関数
  getPointerDropContext({ el, clientY }) {
    const target = this.getTodoItem(el);
    if (target === null) return null;
    const toId = this.getTodoId(target);
    if (toId === null) return null;
    const fromId = this.draggedId;
    if (fromId === null) return null;
    const rect = target.getBoundingClientRect(); // 位置情報取得
    const middleY = rect.top + rect.height / 2; // 対象の真ん中のY座標取得
    const shouldInsertAfter = clientY > middleY; // 後ろに挿入すべきか?
    return { fromId, toId, shouldInsertAfter };
  }

  // * pointerでドラッグ判定したとき一度だけする処理
  startPointerDrag(e) {
    this.isDragging = true;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  handlePointerCancel() {
    this.draggedId = null;
    this.isDragging = false;
  }

  // ==========================================
  // drag イベント
  // ==========================================
  // * ドラッグ開始処理
  handleDragStart(e) {
    const id = this.getTodoIdFromElement(e.target);
    if (id === null) return;
    this.draggedId = id;
  }

  // * ドラッグ中
  handleDragOver(e) {
    e.preventDefault();
  }

  // * ドロップ処理(離したとき)
  handleDrop(e) {
    e.preventDefault();
    try {
      const result = this.getDropContext(e);
      if (!result) return;
      this.todos = this.reorderByDrop({ ...result, list: this.todos });
      this.saveAndRender();
    } finally {
      this.draggedId = null; // これだけは、早期returnでもしときたいのでfinallyに書いておく
    }
  }
}

