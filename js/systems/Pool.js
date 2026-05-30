class Pool {
  constructor(scene, ClassRef, size) {
    this._items = [];
    for (let i = 0; i < size; i++) {
      const obj = new ClassRef(scene);
      obj.setActive(false).setVisible(false);
      this._items.push(obj);
    }
  }

  get() {
    return this._items.find(o => !o.active) || null;
  }

  getAll() {
    return this._items;
  }

  active() {
    return this._items.filter(o => o.active);
  }
}
