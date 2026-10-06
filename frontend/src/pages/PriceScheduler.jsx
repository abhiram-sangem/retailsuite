import React, { useState, useMemo } from 'react';
import { formatProductId, formatMoney } from '../utils/formatters';
import { productService } from '../services/api';

export default function PriceScheduler({ products = [], loadProducts, loadHistory, setView }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [priceInputs, setPriceInputs] = useState({});
  const [autoCalcPieces, setAutoCalcPieces] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeSearch = (searchQuery || '').toLowerCase();
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      (p.name && p.name.toLowerCase().includes(safeSearch)) ||
      (p.hsnCode && p.hsnCode.toLowerCase().includes(safeSearch)) ||
      formatProductId(p.id).toLowerCase().includes(safeSearch)
    );
  }, [products, safeSearch]);

  const handleInputChange = (product, field, rawVal) => {
    setPriceInputs(prev => {
      const currentProductEdits = { ...(prev[product.id] || {}) };
      currentProductEdits[field] = rawVal;

      // Optional helper: if product has piecesPerBox > 0 and user edits a Box price, auto-fill Piece price
      const ppb = Number(product.piecesPerBox || 0);
      if (autoCalcPieces && ppb > 0 && rawVal !== '') {
        const numVal = Number(rawVal);
        if (!isNaN(numVal) && numVal >= 0) {
          const pieceVal = (Math.round((numVal / ppb) * 100) / 100).toString();
          if (field === 'newPurchasePrice') currentProductEdits.newPiecePurchasePrice = pieceVal;
          if (field === 'newMrp') currentProductEdits.newPieceMrp = pieceVal;
          if (field === 'newPrice') currentProductEdits.newPiecePrice = pieceVal;
        }
      }

      return { ...prev, [product.id]: currentProductEdits };
    });
  };

  const modifiedProductsCount = useMemo(() => {
    return Object.entries(priceInputs).filter(([, edits]) =>
      edits && Object.values(edits).some(v => v !== undefined && v !== '')
    ).length;
  }, [priceInputs]);

  const parseOptionalNumber = (val) => {
    if (val === undefined || val === null || String(val).trim() === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const handleSaveSchedule = () => {
    if (!effectiveDate) {
      return window.alert('Please select an Effective Date for the new prices.');
    }

    const itemsPayload = Object.entries(priceInputs)
      .map(([productId, edits]) => ({
        productId: Number(productId),
        newPurchasePrice: parseOptionalNumber(edits.newPurchasePrice),
        newMrp: parseOptionalNumber(edits.newMrp),
        newPrice: parseOptionalNumber(edits.newPrice),
        newPiecePurchasePrice: parseOptionalNumber(edits.newPiecePurchasePrice),
        newPieceMrp: parseOptionalNumber(edits.newPieceMrp),
        newPiecePrice: parseOptionalNumber(edits.newPiecePrice),
      }))
      .filter(item =>
        item.newPurchasePrice !== null ||
        item.newMrp !== null ||
        item.newPrice !== null ||
        item.newPiecePurchasePrice !== null ||
        item.newPieceMrp !== null ||
        item.newPiecePrice !== null
      );

    if (itemsPayload.length === 0) {
      return window.alert('Please enter at least one new price in the table before saving.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isImmediate = effectiveDate <= todayStr;

    const confirmMsg = isImmediate
      ? `Effective Date (${effectiveDate}) is Today or earlier. Apply new prices IMMEDIATELY to ${itemsPayload.length} product(s)?`
      : `Schedule new prices for ${itemsPayload.length} product(s) to automatically take effect on ${new Date(effectiveDate).toLocaleDateString('en-GB')}?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    productService.schedulePrices(effectiveDate, itemsPayload)
      .then(() => {
        window.alert(
          isImmediate
            ? `Success! Prices updated immediately for ${itemsPayload.length} product(s).`
            : `Success! Price changes scheduled for ${new Date(effectiveDate).toLocaleDateString('en-GB')}.`
        );
        setPriceInputs({});
        loadProducts();
        if (loadHistory) loadHistory();
      })
      .catch(err => window.alert('Failed to schedule prices: ' + err.message))
      .finally(() => setIsSubmitting(false));
  };

  const handleCancelProductSchedule = (product) => {
    if (!window.confirm(`Cancel scheduled price update for "${product.name}"?`)) return;
    productService.clearScheduledPrice(product.id)
      .then(() => {
        loadProducts();
      })
      .catch(err => window.alert('Failed to cancel scheduled price: ' + err.message));
  };

  return (
    <div className="card">
      {/* TOP HEADER & CONTROLS */}
      <div className="card-header header-actions header-actions-wrap" style={{ paddingBottom: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 className="card-title mb-0">Bulk Price Scheduler & Rollout</h2>
          <p className="text-muted fs-sm mb-0" style={{ marginTop: '4px' }}>
            Enter new Box and Piece prices sideways below. Leave any box blank to keep its current price unchanged.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {setView && (
            <button className="btn btn-secondary" onClick={() => setView('products')}>
              ← Back to Products
            </button>
          )}
        </div>
      </div>

      {/* STICKY CONTROL BAR */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          backgroundColor: '#f8fafc',
          padding: '14px 18px',
          borderRadius: '10px',
          border: '1px solid #cbd5e1',
          marginBottom: '1rem'
        }}
      >
        <div style={{ flex: '1.5', minWidth: '220px' }}>
          <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.88rem' }}>Search Products:</label>
          <input
            type="text"
            className="form-control mb-0"
            placeholder="Search by Product Name, ID, or HSN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.55rem 0.75rem' }}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <label className="form-label text-primary fw-bold" style={{ marginBottom: '4px', fontSize: '0.88rem' }}>
            📅 Effective Rollout Date:
          </label>
          <input
            type="date"
            className="form-control mb-0 fw-bold"
            value={effectiveDate}
            onChange={e => setEffectiveDate(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderColor: '#38bdf8' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px' }}>
          <input
            type="checkbox"
            id="autoCalcPiecesToggle"
            checked={autoCalcPieces}
            onChange={e => setAutoCalcPieces(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="autoCalcPiecesToggle" className="fw-bold text-slate" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
            Auto-divide Piece prices from Box
          </label>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          {modifiedProductsCount > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => setPriceInputs({})}
              disabled={isSubmitting}
            >
              Clear Edits ({modifiedProductsCount})
            </button>
          )}
          <button
            className="btn btn-success"
            onClick={handleSaveSchedule}
            disabled={isSubmitting || modifiedProductsCount === 0}
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.98rem' }}
          >
            {effectiveDate <= new Date().toISOString().split('T')[0]
              ? `⚡ Apply Prices Now (${modifiedProductsCount})`
              : `🕒 Schedule Price Rollout (${modifiedProductsCount})`}
          </button>
        </div>
      </div>

      {/* VERTICAL PRODUCT TABLE WITH SIDEWAYS INPUTS */}
      <div className="table-responsive" style={{ maxHeight: '68vh', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#1e293b', color: '#fff' }}>
            <tr>
              <th style={{ backgroundColor: '#1e293b', color: '#fff', padding: '10px 12px', minWidth: '210px' }}>Product Details</th>
              <th style={{ backgroundColor: '#334155', color: '#e2e8f0', padding: '10px 8px', textAlign: 'center', borderLeft: '2px solid #475569' }}>
                Box Purchase (₹)
              </th>
              <th style={{ backgroundColor: '#334155', color: '#e2e8f0', padding: '10px 8px', textAlign: 'center' }}>
                Box MRP (₹)
              </th>
              <th style={{ backgroundColor: '#334155', color: '#38bdf8', padding: '10px 8px', textAlign: 'center' }}>
                Box Selling (₹)
              </th>
              <th style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '10px 8px', textAlign: 'center', borderLeft: '2px solid #475569' }}>
                Piece Purchase (₹)
              </th>
              <th style={{ backgroundColor: '#1e293b', color: '#cbd5e1', padding: '10px 8px', textAlign: 'center' }}>
                Piece MRP (₹)
              </th>
              <th style={{ backgroundColor: '#1e293b', color: '#a78bfa', padding: '10px 8px', textAlign: 'center' }}>
                Piece Selling (₹)
              </th>
              <th style={{ backgroundColor: '#1e293b', color: '#fff', padding: '10px 8px', textAlign: 'center', borderLeft: '2px solid #475569' }}>
                Scheduled Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const edits = priceInputs[p.id] || {};
              const hasPieces = Number(p.piecesPerBox || 0) > 0;
              const isRowEdited = Object.values(edits).some(v => v !== undefined && v !== '');

              const inputStyle = {
                width: '105px',
                padding: '5px 8px',
                marginBottom: 0,
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                height: '32px'
              };

              return (
                <tr
                  key={p.id}
                  style={{
                    backgroundColor: isRowEdited ? '#f0fdf4' : (p.scheduledDate ? '#fffbeb' : '#fff'),
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  {/* Product Info */}
                  <td style={{ padding: '8px 12px' }}>
                    <div className="fw-bold text-slate" style={{ fontSize: '0.95rem' }}>{p.name}</div>
                    <div className="text-muted fs-sm">
                      {formatProductId(p.id)} {p.hsnCode ? `| HSN: ${p.hsnCode}` : ''}
                      {hasPieces ? ` | ${p.piecesPerBox} pcs/box` : ' | Box Only'}
                    </div>
                  </td>

                  {/* 1. BOX PURCHASE PRICE */}
                  <td style={{ padding: '8px', textAlign: 'center', borderLeft: '2px solid #f1f5f9' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                      Curr: <strong>{formatMoney(p.purchasePrice || 0)}</strong>
                    </div>
                    <input
                      type="number"
                      className="form-control"
                      style={inputStyle}
                      placeholder={String(p.purchasePrice ?? 0)}
                      value={edits.newPurchasePrice ?? ''}
                      onChange={e => handleInputChange(p, 'newPurchasePrice', e.target.value)}
                    />
                  </td>

                  {/* 2. BOX MRP */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                      Curr: <strong>{formatMoney(p.mrp ?? p.price ?? 0)}</strong>
                    </div>
                    <input
                      type="number"
                      className="form-control"
                      style={inputStyle}
                      placeholder={String(p.mrp ?? p.price ?? 0)}
                      value={edits.newMrp ?? ''}
                      onChange={e => handleInputChange(p, 'newMrp', e.target.value)}
                    />
                  </td>

                  {/* 3. BOX SELLING PRICE */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div className="text-success" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                      Curr: <strong>{formatMoney(p.price || 0)}</strong>
                    </div>
                    <input
                      type="number"
                      className="form-control text-success"
                      style={{ ...inputStyle, borderColor: edits.newPrice ? '#10b981' : '#cbd5e1' }}
                      placeholder={String(p.price ?? 0)}
                      value={edits.newPrice ?? ''}
                      onChange={e => handleInputChange(p, 'newPrice', e.target.value)}
                    />
                  </td>

                  {/* 4. PIECE PURCHASE PRICE */}
                  <td style={{ padding: '8px', textAlign: 'center', borderLeft: '2px solid #f1f5f9' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                      Curr: <strong>{hasPieces ? formatMoney(p.piecePurchasePrice || 0) : '-'}</strong>
                    </div>
                    <input
                      type="number"
                      className="form-control"
                      style={inputStyle}
                      disabled={!hasPieces}
                      placeholder={hasPieces ? String(p.piecePurchasePrice ?? 0) : 'N/A'}
                      value={edits.newPiecePurchasePrice ?? ''}
                      onChange={e => handleInputChange(p, 'newPiecePurchasePrice', e.target.value)}
                    />
                  </td>

                  {/* 5. PIECE MRP */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                      Curr: <strong>{hasPieces ? formatMoney(p.pieceMrp || 0) : '-'}</strong>
                    </div>
                    <input
                      type="number"
                      className="form-control"
                      style={inputStyle}
                      disabled={!hasPieces}
                      placeholder={hasPieces ? String(p.pieceMrp ?? 0) : 'N/A'}
                      value={edits.newPieceMrp ?? ''}
                      onChange={e => handleInputChange(p, 'newPieceMrp', e.target.value)}
                    />
                  </td>

                  {/* 6. PIECE SELLING PRICE */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div className="text-purple" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                      Curr: <strong>{hasPieces ? formatMoney(p.piecePrice || 0) : '-'}</strong>
                    </div>
                    <input
                      type="number"
                      className="form-control text-purple"
                      style={inputStyle}
                      disabled={!hasPieces}
                      placeholder={hasPieces ? String(p.piecePrice ?? 0) : 'N/A'}
                      value={edits.newPiecePrice ?? ''}
                      onChange={e => handleInputChange(p, 'newPiecePrice', e.target.value)}
                    />
                  </td>

                  {/* 7. SCHEDULED STATUS COLUMN */}
                  <td style={{ padding: '8px', textAlign: 'center', borderLeft: '2px solid #f1f5f9' }}>
                    {p.scheduledDate ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <span className="badge btn-warning text-dark" style={{ fontSize: '0.72rem' }}>
                          📅 {new Date(p.scheduledDate).toLocaleDateString('en-GB')}
                        </span>
                        <div className="fs-sm text-slate">
                          {p.scheduledPrice != null && <div>Box: <strong>{formatMoney(p.scheduledPrice)}</strong></div>}
                          {p.scheduledPiecePrice != null && <div>Pc: <strong>{formatMoney(p.scheduledPiecePrice)}</strong></div>}
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          onClick={() => handleCancelProductSchedule(p)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted fs-sm">No schedule</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}