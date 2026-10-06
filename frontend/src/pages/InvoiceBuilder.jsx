import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';

const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' }
];

const ELEMENT_KEYS = [
  'gstin', 'business', 'logo', 'divider1',
  'customer', 'shipTo', 'meta', 'divider2',
  'table', 'amountWords', 'bank', 'terms', 'summary', 'signature'
];

export default function InvoiceBuilder({ templateConfig, sharedInfo, onBack, onSave, onReset }) {
  const [config, setConfig] = useState(templateConfig);
  const [selectedEl, setSelectedEl] = useState(null);

  useEffect(() => {
    setConfig(templateConfig);
    setSelectedEl(null);
  }, [templateConfig]);

  if (!config) return null;
  const variant = config.layoutVariant || 'classic';

  const updateNode = (key, field, value) => {
    setConfig(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const renderCanvasElement = (key) => {
    const node = config[key];
    if (!node) return null;

    let content = null;
    const fontStyles = { fontSize: `${node.fontSize || 12}px`, fontFamily: node.fontFamily || 'Arial, sans-serif' };
    const isHorizontalOnly = config.tableStyle === 'horizontal';
    const cellBorder = isHorizontalOnly ? 'none' : '1px solid #000';

    if (key === 'gstin') {
      content = (
        <div style={{ ...fontStyles, fontWeight: 'bold', border: variant === 'vyapar' ? '1px solid #000' : 'none', padding: variant === 'vyapar' ? '4px' : 0, textAlign: variant === 'vyapar' ? 'center' : 'left', height: '100%' }}>
          {variant === 'vyapar' && <div style={{ borderBottom: '1px solid #000', marginBottom: '2px' }}>TAX INVOICE</div>}
          {sharedInfo?.gstinText}
        </div>
      );
    }
    if (key === 'business') {
      content = (
        <div style={{ ...fontStyles, textAlign: node.align || 'center', whiteSpace: 'pre-wrap', fontWeight: 'bold', lineHeight: 1.3 }}>
          {sharedInfo?.businessText}
        </div>
      );
    }
    if (key === 'logo') {
      content = <img src={sharedInfo?.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable="false" />;
    }
    if (key === 'divider1' || key === 'divider2') {
      content = <div style={{ width: '100%', height: '100%', borderTop: '1.5px solid #000' }}></div>;
    }
    if (key === 'customer') {
      content = (
        <div style={{ ...fontStyles, padding: '8px 10px', border: (variant === 'corporate' || variant === 'vyapar') ? '1px solid #000' : 'none', borderRadius: variant === 'corporate' ? '6px' : 0, height: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569' }}>BILL TO / BUYER:</div>
          <strong>CUSTOMER NAME</strong><br />Address & City<br />GSTIN: 36AAAAA0000A1Z5
        </div>
      );
    }
    if (key === 'shipTo') {
      content = (
        <div style={{ ...fontStyles, padding: '8px 10px', border: '1px solid #000', borderRadius: variant === 'corporate' ? '6px' : 0, height: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569' }}>SHIP TO & SUPPLY INFO:</div>
          Delivery City: Nalgonda<br />Payment Mode: Pay Later
        </div>
      );
    }
    if (key === 'meta') {
      if (variant === 'tally') {
        content = (
          <div style={{ ...fontStyles, borderLeft: '1px solid #000', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', boxSizing: 'border-box' }}>
            <div style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}>Invoice No:<br /><strong>INV-0057</strong></div>
            <div style={{ borderBottom: '1px solid #000', padding: '6px' }}>Dated:<br /><strong>06/10/2026</strong></div>
            <div style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '6px' }}>Mode:<br /><strong>Pay Later</strong></div>
            <div style={{ borderBottom: '1px solid #000', padding: '6px' }}>Terms:<br /><strong>Net 15 Days</strong></div>
            <div style={{ borderRight: '1px solid #000', padding: '6px' }}>City:<br /><strong>Nalgonda</strong></div>
            <div style={{ padding: '6px' }}>Type:<br /><strong>Tax Invoice</strong></div>
          </div>
        );
      } else if (variant === 'corporate') {
        content = (
          <div style={{ ...fontStyles }}>
            <div style={{ fontSize: '24px', fontWeight: '900' }}>TAX INVOICE</div>
            <div><strong>Invoice No:</strong> INV-0057</div>
            <div><strong>Date:</strong> 06/10/2026</div>
          </div>
        );
      } else {
        content = (
          <div style={{ ...fontStyles, padding: '8px 10px', textAlign: variant === 'vyapar' ? 'left' : 'right', fontWeight: 'bold' }}>
            <div>06/10/2026</div>
            <div>INV-0057</div>
          </div>
        );
      }
    }
    if (key === 'amountWords') {
      content = (
        <div style={{ ...fontStyles, border: '1px solid #000', padding: '6px 10px', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '9px', color: '#475569', fontWeight: 'bold' }}>AMOUNT IN WORDS:</div>
          <strong>Rupees One Thousand Fifty Only</strong>
        </div>
      );
    }
    if (key === 'bank') {
      content = (
        <div style={{ ...fontStyles, whiteSpace: 'pre-wrap', lineHeight: '1.5', padding: '8px', border: (variant === 'tally' || variant === 'vyapar') ? '1px solid #000' : 'none', height: '100%', boxSizing: 'border-box' }}>
          {sharedInfo?.bankText}
        </div>
      );
    }
    if (key === 'terms') {
      content = (
        <div style={{ ...fontStyles, whiteSpace: 'pre-wrap', lineHeight: '1.4', padding: '6px 8px', border: (variant === 'tally' || variant === 'vyapar') ? '1px solid #000' : 'none', height: '100%', boxSizing: 'border-box' }}>
          <strong>TERMS & CONDITIONS:</strong><br />{sharedInfo?.termsText}
        </div>
      );
    }
    if (key === 'signature') {
      content = (
        <div style={{ ...fontStyles, border: (variant === 'tally' || variant === 'vyapar') ? '1px solid #000' : 'none', padding: '8px 12px', height: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', boxSizing: 'border-box' }}>
          {variant === 'vyapar' ? <span>Customer Sign</span> : <span />}
          <div style={{ textAlign: 'right' }}>
            <strong>For Company</strong><br /><br />Authorised Signatory
          </div>
        </div>
      );
    }
    if (key === 'table') {
      const emptyCount = variant === 'classic' ? 19 : 15;
      content = (
        <table style={{ ...fontStyles, width: '100%', borderCollapse: 'collapse', borderBottom: '1px solid #000', textAlign: 'center' }}>
          <thead style={{ backgroundColor: config.accentColor || '#d1d5db', color: config.headerTextColor || '#000' }}>
            <tr>
              <th style={{ border: cellBorder, padding: '6px' }}>S.No</th>
              <th style={{ border: cellBorder, padding: '6px' }}>HSN</th>
              <th style={{ border: cellBorder, padding: '6px', textAlign: 'left' }}>Product Description</th>
              <th style={{ border: cellBorder, padding: '6px' }}>Qty</th>
              <th style={{ border: cellBorder, padding: '6px' }}>Rate</th>
              <th style={{ border: cellBorder, padding: '6px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <td style={{ border: cellBorder, padding: '4px', height: '24px' }}>1</td>
              <td style={{ border: cellBorder, padding: '4px' }}>6109</td>
              <td style={{ border: cellBorder, padding: '4px', textAlign: 'left' }}>Sample Product Item</td>
              <td style={{ border: cellBorder, padding: '4px' }}>10 Box</td>
              <td style={{ border: cellBorder, padding: '4px' }}>100.00</td>
              <td style={{ border: cellBorder, padding: '4px', textAlign: 'right' }}>1000.00</td>
            </tr>
            {[...Array(emptyCount)].map((_, i) => (
              <tr key={`empty-${i}`} style={{ borderBottom: isHorizontalOnly ? '1px dashed #e2e8f0' : '1px solid #000' }}>
                <td style={{ border: cellBorder, height: '24px' }}></td>
                <td style={{ border: cellBorder }}></td>
                <td style={{ border: cellBorder }}></td>
                <td style={{ border: cellBorder }}></td>
                <td style={{ border: cellBorder }}></td>
                <td style={{ border: cellBorder }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (key === 'summary') {
      content = (
        <table style={{ ...fontStyles, width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
          <tbody>
            <tr><td style={{ border: '1px solid #000', padding: '4px 8px' }}>Subtotal</td><td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>1000.00</td></tr>
            <tr><td style={{ border: '1px solid #000', padding: '4px 8px' }}>CGST + SGST</td><td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>50.00</td></tr>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Grand Total</td>
              <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>₹1,050.00</td>
            </tr>
          </tbody>
        </table>
      );
    }

    return (
      <Rnd
        key={key}
        bounds="parent"
        dragAxis={node.type === 'divider' ? 'y' : 'both'}
        position={{ x: node.x, y: node.y }}
        size={node.width ? { width: node.width, height: node.height || 'auto' } : undefined}
        onDragStop={(e, d) => { updateNode(key, 'x', d.x); updateNode(key, 'y', d.y); }}
        onResizeStop={(e, dir, ref) => {
          if (node.type !== 'divider') {
            updateNode(key, 'width', parseInt(ref.style.width, 10));
            updateNode(key, 'height', parseInt(ref.style.height, 10));
          }
        }}
        onClick={(e) => { e.stopPropagation(); setSelectedEl(key); }}
        style={{
          border: selectedEl === key ? '2px dashed #0284c7' : 'none',
          cursor: node.type === 'divider' ? 'ns-resize' : 'move',
          backgroundColor: 'transparent'
        }}
      >
        {content}
      </Rnd>
    );
  };

  return (
    <div className="card bg-transparent" style={{ padding: 0, boxShadow: 'none' }}>
      <div className="card-header header-actions bg-white mb-1" style={{ padding: '15px 20px', borderRadius: '8px' }}>
        <div>
          <h2 className="card-title mb-0">Editing Structure: {config.name}</h2>
          <p className="text-muted mb-0 fs-sm">Click and drag any block on the A4 sheet to customize this template's layout.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          {onBack && <button className="btn btn-secondary" onClick={onBack}>← Back to Templates</button>}
          {onReset && <button className="btn btn-warning" onClick={onReset}>↺ Reset Default</button>}
          <button className="btn btn-success" onClick={() => onSave(config)}>💾 Save Layout</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div className="invoice-a4-box" onClick={() => setSelectedEl(null)}>
          {ELEMENT_KEYS.map(key => renderCanvasElement(key))}
        </div>

        <div className="card shadow-panel" style={{ flex: 1, minWidth: '300px', position: 'sticky', top: '20px', marginTop: 0 }}>
          {selectedEl && config[selectedEl] ? (
            <div className="builder-settings">
              <h3 className="text-primary border-bottom-padded mb-1">Block: {selectedEl.toUpperCase()}</h3>

              <div className="sales-control-row">
                <div className="form-group w-100">
                  <label>Y (Vertical px)</label>
                  <input type="number" className="form-control" value={config[selectedEl].y} onChange={e => updateNode(selectedEl, 'y', Number(e.target.value))} />
                </div>
                {config[selectedEl].type !== 'divider' && (
                  <div className="form-group w-100">
                    <label>X (Horizontal px)</label>
                    <input type="number" className="form-control" value={config[selectedEl].x} onChange={e => updateNode(selectedEl, 'x', Number(e.target.value))} />
                  </div>
                )}
              </div>

              {config[selectedEl].type !== 'divider' && (
                <div className="sales-control-row">
                  <div className="form-group w-100">
                    <label>Width (px)</label>
                    <input type="number" className="form-control" value={config[selectedEl].width} onChange={e => updateNode(selectedEl, 'width', Number(e.target.value))} />
                  </div>
                  <div className="form-group w-100">
                    <label>Height (px)</label>
                    <input type="number" className="form-control" value={config[selectedEl].height || 0} onChange={e => updateNode(selectedEl, 'height', Number(e.target.value))} />
                  </div>
                </div>
              )}

              {config[selectedEl].type !== 'divider' && selectedEl !== 'logo' && (
                <>
                  <h4 className="mt-1 mb-0-5 text-muted">Typography</h4>
                  <div className="sales-control-row">
                    <div className="form-group w-100">
                      <label>Font Size (px)</label>
                      <input type="number" className="form-control" value={config[selectedEl].fontSize || 12} onChange={e => updateNode(selectedEl, 'fontSize', Number(e.target.value))} />
                    </div>
                    <div className="form-group w-100">
                      <label>Font Family</label>
                      <select className="form-control" value={config[selectedEl].fontFamily || 'Arial, sans-serif'} onChange={e => updateNode(selectedEl, 'fontFamily', e.target.value)}>
                        {FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-muted text-center mt-1">Click any block on the A4 sheet to adjust its position, dimensions, or font.</div>
          )}
        </div>
      </div>
    </div>
  );
}