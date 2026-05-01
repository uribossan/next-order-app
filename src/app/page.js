"use client";
import { useState, useEffect } from 'react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentTab, setCurrentTab] = useState('inventory');
  
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('食材');
  const [addCourse, setAddCourse] = useState('');
  const [addSupplier, setAddSupplier] = useState('');
  const [addMin, setAddMin] = useState(10);
  const [addQty, setAddQty] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const resItems = await fetch('/api/items');
    if (resItems.ok) setItems(await resItems.json());

    const resOrders = await fetch('/api/orders');
    if (resOrders.ok) setOrders(await resOrders.json());
  };

  const updateStock = async (itemId, delta) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const newStock = Math.max(0, item.currentStock + delta);
    
    // Optimistic
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, currentStock: newStock } : i));
    
    await fetch('/api/items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, currentStock: newStock })
    });
    
    if (newStock < item.minStock) {
      const activeOrder = orders.find(o => o.itemId === itemId && o.status !== '納品済');
      if (!activeOrder) {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id,
            quantity: item.defaultOrderQty,
            status: '未発注',
            supplier: item.supplier
          })
        });
      }
    }
    fetchData();
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status: newStatus })
    });
    fetchData();
  };

  const addNewItem = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: addName,
        category: addCategory,
        course: addCourse,
        supplier: addSupplier,
        minStock: parseInt(addMin),
        defaultOrderQty: parseInt(addQty),
        currentStock: parseInt(addMin)
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      alert('エラーが発生しました: ' + (errorData.error || '通信エラー'));
      return;
    }
    
    alert('追加しました！');
    fetchData();
    setAddName(''); setAddCourse(''); setAddSupplier('');
  };

  const deleteItem = async (id) => {
    if(confirm('本当に削除しますか？関連する発注データも削除されます。')) {
      await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const renderInventory = () => {
    const uniqueSuppliers = [...new Set(items.map(i => i.supplier))];
    const uniqueCourses = [...new Set(items.map(i => i.course))];

    const filteredItems = items.filter(i => {
      const matchCategory = inventoryFilter === 'all' || i.category === inventoryFilter;
      const matchSupplier = supplierFilter === 'all' || i.supplier === supplierFilter;
      const matchCourse = courseFilter === 'all' || i.course === courseFilter;
      return matchCategory && matchSupplier && matchCourse;
    });

    return (
      <>
        <div className="page-header">
          <h2>現在の在庫</h2>
          <div className="filters-container">
            <div className="filter-chips">
              {['all', '食材', '飲料', '消耗品'].map(filter => (
                <button 
                  key={filter}
                  className={`chip ${inventoryFilter === filter ? 'active' : ''}`}
                  onClick={() => setInventoryFilter(filter)}
                >
                  {filter === 'all' ? 'すべて' : filter}
                </button>
              ))}
            </div>
            <div className="advanced-filters">
              <select className="filter-select" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
                <option value="all">すべての業者</option>
                {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="filter-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
                <option value="all">すべてのコース</option>
                {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        <div className="item-list">
          {filteredItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>該当する品目がありません。管理タブから追加してください。</p>
          ) : (
            filteredItems.map(item => {
              const isWarning = item.currentStock < item.minStock;
              return (
                <div key={item.id} className="item-card">
                  <div className="item-header">
                    <div>
                      <div className="item-title">{item.name}</div>
                      <div className="item-meta">
                        <span className="badge">{item.category}</span>
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>{item.course}</span>
                        <span>{item.supplier}</span>
                      </div>
                    </div>
                  </div>
                  <div className="item-controls">
                    <div className="stock-info">
                      <span className="stock-label">現在庫 (基準: {item.minStock})</span>
                      <span className={`stock-value ${isWarning ? 'warning' : ''}`}>{item.currentStock}</span>
                    </div>
                    <div className="stepper">
                      <button onClick={() => updateStock(item.id, -1)}>−</button>
                      <button onClick={() => updateStock(item.id, 1)}>＋</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  const renderOrders = () => {
    const activeOrders = orders.filter(o => o.status !== '納品済');

    return (
      <>
        <div className="page-header">
          <h2>発注リスト</h2>
          <p className="subtitle">基準在庫を下回った品目</p>
        </div>
        <div className="order-list">
          {activeOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>現在、発注が必要な品目はありません。</p>
          ) : (
            activeOrders.map(order => {
              const isUnordered = order.status === '未発注';
              return (
                <div key={order.id} className={`item-card order-card ${isUnordered ? 'status-unordred' : 'status-ordered'}`}>
                  <div className="item-header">
                    <div>
                      <div className="item-title">{order.item?.name} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>(発注: {order.quantity})</span></div>
                      <div className="item-meta">
                        <span className="badge" style={{ background: 'var(--background)' }}>{order.status}</span>
                        <span>業者: {order.supplier}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <button 
                      className={`status-button ${isUnordered ? 'unordred' : 'ordered'}`}
                      onClick={() => updateOrderStatus(order.id, isUnordered ? '発注済' : '納品済')}
                    >
                      {isUnordered ? '発注済にする' : '納品済にする（在庫追加）'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  const renderHistory = () => {
    const deliveredOrders = orders.filter(o => o.status === '納品済');

    return (
      <>
        <div className="page-header">
          <h2>発注履歴</h2>
          <p className="subtitle">過去の納品済データ</p>
        </div>
        <div className="history-list">
          {deliveredOrders.length === 0 ? (
             <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>納品履歴はありません。</p>
          ) : (
            deliveredOrders.map(order => {
              const dateObj = new Date(order.deliveredAt);
              const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
              
              return (
                <div key={order.id} className="item-card order-card status-delivered">
                  <div className="item-header">
                    <div>
                      <div className="item-title">{order.item?.name || '削除された品目'} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>(納品: {order.quantity})</span></div>
                      <div className="item-meta">
                        <span>納品日時: {dateStr}</span>
                        <span>業者: {order.supplier}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  };

  const renderSettings = () => {
    return (
      <>
        <div className="page-header">
          <h2>品目管理</h2>
        </div>
        
        <div className="form-card">
          <h3>新規追加</h3>
          <form onSubmit={addNewItem}>
            <div className="form-group">
              <label>品目名</label>
              <input type="text" value={addName} onChange={e => setAddName(e.target.value)} required placeholder="例: トマト" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>カテゴリ</label>
                <select value={addCategory} onChange={e => setAddCategory(e.target.value)} required>
                  <option value="食材">食材</option>
                  <option value="飲料">飲料</option>
                  <option value="消耗品">消耗品</option>
                </select>
              </div>
              <div className="form-group">
                <label>関連コース</label>
                <input type="text" value={addCourse} onChange={e => setAddCourse(e.target.value)} placeholder="例: Aコース、共通" required />
              </div>
            </div>
            <div className="form-group">
              <label>業者名</label>
              <input type="text" value={addSupplier} onChange={e => setAddSupplier(e.target.value)} required placeholder="例: 八百屋A" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>基準在庫</label>
                <input type="number" value={addMin} onChange={e => setAddMin(e.target.value)} required min="0" />
              </div>
              <div className="form-group">
                <label>発注時のデフォルト量</label>
                <input type="number" value={addQty} onChange={e => setAddQty(e.target.value)} required min="1" />
              </div>
            </div>
            <button type="submit" className="btn-primary">追加する</button>
          </form>
        </div>

        <div className="manage-list-container">
          <h3 style={{ margin: '24px 0 12px', fontSize: '1.1rem' }}>登録済みの品目</h3>
          <div>
            {items.map(item => (
              <div key={item.id} className="manage-item-row">
                <div className="manage-item-info">
                  <span className="manage-item-name">{item.name}</span>
                  <span className="manage-item-meta">{item.course} / {item.supplier}</span>
                </div>
                <button className="btn-delete" onClick={() => deleteItem(item.id)}>削除</button>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>発注管理</h1>
      </header>

      <main className="app-main">
        {currentTab === 'inventory' && renderInventory()}
        {currentTab === 'orders' && renderOrders()}
        {currentTab === 'history' && renderHistory()}
        {currentTab === 'settings' && renderSettings()}
      </main>

      <nav className="bottom-nav">
        {[
          { id: 'inventory', label: '在庫', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path> },
          { id: 'orders', label: '発注', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></> },
          { id: 'history', label: '履歴', icon: <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></> },
          { id: 'settings', label: '管理', icon: <><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></> }
        ].map(tab => (
          <button 
            key={tab.id}
            className={`nav-item ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.id)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {tab.icon}
              {tab.id === 'inventory' && <><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></>}
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
