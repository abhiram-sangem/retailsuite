import React, { useState, useEffect } from 'react';
import InvoiceBuilder from './InvoiceBuilder';
import { loadInvoiceSettings, saveInvoiceSettings, TEMPLATE_PRESETS } from '../utils/invoiceTemplates';

export default function SettingsManager() {
  const [section, setSection] = useState('home'); // 'home' | 'print-settings'
  const [printTab, setPrintTab] = useState('templates'); // 'templates' | 'topbar' | 'bank' | 'builder'
  const [editingTemplateId, setEditingTemplateId] = useState('template1');
  const [store, setStore] = useState(null);

  useEffect(() => {
    setStore(loadInvoiceSettings());
  }, []);

  if (!store) return <div className="card">Loading Settings...</div>;

  const handleSaveShared = () => {
    saveInvoiceSettings(store);
    window.alert('Business & Bank print details saved across all templates!');
  };

  const handleSelectActiveTemplate = (templateId) => {
    const updated = { ...store, activeTemplateId: templateId };
    setStore(updated);
    saveInvoiceSettings(updated);
  };

  const handleOpenBuilder = (templateId) => {
    setEditingTemplateId(templateId);
    setPrintTab('builder');
  };

  const handleSaveTemplateLayout = (templateId, updatedTemplateConfig) => {
    const updated = {
      ...store,
      templates: {
        ...store.templates,
        [templateId]: updatedTemplateConfig
      }
    };
    setStore(updated);
    saveInvoiceSettings(updated);
    window.alert(`${updatedTemplateConfig.name} layout saved successfully!`);
  };

  const handleResetTemplate = (templateId) => {
    if (!window.confirm('Reset this template layout back to its default positions?')) return;
    const updated = {
      ...store,
      templates: {
        ...store.templates,
        [templateId]: { ...TEMPLATE_PRESETS[templateId] }
      }
    };
    setStore(updated);
    saveInvoiceSettings(updated);
  };

  const handleSharedChange = (field, value) => {
    setStore(prev => ({
      ...prev,
      shared: { ...prev.shared, [field]: value }
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) return window.alert('Image is too large. Please use a logo under 2MB.');
      const reader = new FileReader();
      reader.onloadend = () => handleSharedChange('logoUrl', reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Visual Mini-Thumbnail Preview for each Template Card
  const renderTemplateThumbnail = (tpl) => {
    const isT1 = tpl.id === 'template1';
    const isT2 = tpl.id === 'template2';
    const isT3 = tpl.id === 'template3';
    const isT4 = tpl.id === 'template4';

    return (
      <div
        style={{
          width: '100%',
          height: '220px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'inset 0 0 0 1px #f1f5f9',
          fontSize: '9px',
          color: '#334155',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Header Mock */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${isT1 ? '#000' : tpl.accentColor}`, paddingBottom: '6px' }}>
          {isT2 ? (
            <>
              <div style={{ width: '36px', height: '18px', backgroundColor: '#e2e8f0', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '7px' }}>LOGO</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: tpl.accentColor, fontSize: '9px' }}>Ramesh Enterprises</div>
                <div style={{ fontSize: '7px', color: '#64748b' }}>GSTIN: 36AQOPM...</div>
              </div>
            </>
          ) : isT4 ? (
            <>
              <div>
                <div style={{ fontWeight: 'bold', color: tpl.accentColor, fontSize: '9px' }}>Ramesh Enterprises</div>
                <div style={{ fontSize: '7px', color: '#64748b' }}>Nalgonda</div>
              </div>
              <div style={{ width: '34px', height: '18px', backgroundColor: '#e0f2fe', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '7px', color: '#0284c7' }}>LOGO</div>
              <div style={{ fontSize: '7px', fontWeight: 'bold' }}>GSTIN</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '7px', fontWeight: 'bold' }}>GSTIN</div>
              <div style={{ textAlign: isT3 ? 'left' : 'center', fontWeight: 'bold', color: isT1 ? '#000' : tpl.accentColor }}>Ramesh Enterprises</div>
              <div style={{ width: '34px', height: '18px', backgroundColor: '#f1f5f9', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '7px' }}>LOGO</div>
            </>
          )}
        </div>

        {/* Customer & Meta Mock */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          <div style={{ flex: 1.4, padding: '4px 6px', backgroundColor: tpl.boxCustomer ? '#f8fafc' : 'transparent', border: tpl.boxCustomer ? '1px solid #e2e8f0' : 'none', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#0f172a' }}>Bill To: Customer</div>
            <div style={{ height: '4px', width: '70%', backgroundColor: '#cbd5e1', marginTop: '3px', borderRadius: '2px' }} />
          </div>
          <div style={{ flex: 1, padding: '4px 6px', textAlign: 'right', backgroundColor: tpl.boxCustomer ? '#f8fafc' : 'transparent', border: tpl.boxCustomer ? '1px solid #e2e8f0' : 'none', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '8px' }}>INV-0057</div>
            <div style={{ fontSize: '7px', color: '#64748b' }}>06/10/2026</div>
          </div>
        </div>

        {/* Table Mock */}
        <div style={{ marginTop: '6px', border: isT1 ? '1px solid #000' : '1px solid #e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: tpl.accentColor, color: tpl.headerTextColor, padding: '3px 6px', fontWeight: 'bold', fontSize: '7px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Item</span>
            <span>Qty</span>
            <span>Total</span>
          </div>
          {[1, 2, 3].map(r => (
            <div key={r} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', borderBottom: '1px solid #f1f5f9', backgroundColor: isT3 && r % 2 === 0 ? '#f5f3ff' : '#fff', fontSize: '7px' }}>
              <span>Product {r}</span>
              <span>{r * 2}</span>
              <span>₹{(r * 450).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* Footer Summary Mock */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '6.5px', color: '#64748b' }}>
            Bank: BOB<br />IFSC: BARB0...
          </div>
          <div style={{ padding: '3px 8px', backgroundColor: isT1 ? '#f1f5f9' : tpl.accentColor, color: isT1 ? '#000' : '#fff', borderRadius: '3px', fontWeight: 'bold', fontSize: '8px' }}>
            Total: ₹2,700
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 1. SETTINGS HOME SCREEN */}
      {section === 'home' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title mb-0">System Settings ⚙️</h2>
              <p className="text-muted fs-sm mb-0" style={{ marginTop: '4px' }}>
                Configure invoice print templates, company branding, and banking details.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div
              className="card stat-card clickable-row"
              style={{
                borderTop: '4px solid #38bdf8',
                marginBottom: 0,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onClick={() => { setSection('print-settings'); setPrintTab('templates'); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>🖨️ Print Settings</h3>
                <span className="badge btn-primary text-white">Active: {store.templates[store.activeTemplateId]?.name.split(':')[0]}</span>
              </div>
              <p className="text-muted mt-1 mb-1-5" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                Choose from 4 A4 invoice templates, customize drag-and-drop element positions & fonts, and manage your Business Header, Logo, GSTIN, and Bank Details.
              </p>
              <button className="btn btn-primary mt-auto w-100">Open Print Settings →</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRINT SETTINGS WORKSPACE */}
      {section === 'print-settings' && (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* LEFT SIDEBAR INSIDE PRINT SETTINGS */}
          <div className="card" style={{ width: '260px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, position: 'sticky', top: '20px' }}>
            <button
              className="btn btn-secondary btn-sm mb-0-5"
              style={{ textAlign: 'left' }}
              onClick={() => setSection('home')}
            >
              ← Back to Settings
            </button>

            <h3 className="border-bottom-padded mb-0-5" style={{ fontSize: '1.15rem' }}>🖨️ Print Settings</h3>

            <button
              className={`btn ${printTab === 'templates' || printTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textAlign: 'left' }}
              onClick={() => setPrintTab('templates')}
            >
              🎨 Invoice Templates (4)
            </button>

            <button
              className={`btn ${printTab === 'topbar' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textAlign: 'left' }}
              onClick={() => setPrintTab('topbar')}
            >
              🏢 Business (Top Bar)
            </button>

            <button
              className={`btn ${printTab === 'bank' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textAlign: 'left' }}
              onClick={() => setPrintTab('bank')}
            >
              🏦 Bank Details
            </button>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* TAB A: 4 TEMPLATE GALLERY */}
            {printTab === 'templates' && (
              <div className="card">
                <div className="card-header" style={{ marginBottom: '1.25rem' }}>
                  <div>
                    <h2 className="card-title mb-0">Select & Customize Invoice Template</h2>
                    <p className="text-muted fs-sm mb-0" style={{ marginTop: '4px' }}>
                      Select which template is used when printing bills, or click <strong>Edit Invoice Layout</strong> on any template to customize its positions and fonts.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  {Object.values(store.templates).map(tpl => {
                    const isSelected = store.activeTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        style={{
                          border: isSelected ? '2px solid #10b981' : '1px solid #cbd5e1',
                          borderRadius: '12px',
                          padding: '14px',
                          backgroundColor: isSelected ? '#f0fdf4' : '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{tpl.name}</strong>
                          {isSelected && <span className="badge btn-success text-white">✓ Active</span>}
                        </div>
                        <p className="text-muted fs-sm mb-0" style={{ minHeight: '32px' }}>{tpl.subtitle}</p>

                        {/* Visual Thumbnail */}
                        <div onClick={() => handleSelectActiveTemplate(tpl.id)} style={{ cursor: 'pointer' }}>
                          {renderTemplateThumbnail(tpl)}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            className={`btn ${isSelected ? 'btn-success' : 'btn-secondary'} flex-1 btn-sm`}
                            onClick={() => handleSelectActiveTemplate(tpl.id)}
                          >
                            {isSelected ? '✓ Active Template' : 'Use Template'}
                          </button>
                          <button
                            className="btn btn-purple flex-1 btn-sm"
                            onClick={() => handleOpenBuilder(tpl.id)}
                          >
                            ✏️ Edit Layout
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB B: DRAG & DROP INVOICE BUILDER (Opened after selecting a template) */}
            {printTab === 'builder' && (
              <InvoiceBuilder
                templateConfig={store.templates[editingTemplateId]}
                sharedInfo={store.shared}
                onBack={() => setPrintTab('templates')}
                onSave={(updatedTpl) => handleSaveTemplateLayout(editingTemplateId, updatedTpl)}
                onReset={() => handleResetTemplate(editingTemplateId)}
              />
            )}

            {/* TAB C: BUSINESS TOP BAR */}
            {printTab === 'topbar' && (
              <div className="card">
                <h2 className="card-title mb-1-5">Top Bar Settings (Shared Across All Templates)</h2>
                <div className="form-group w-100">
                  <label className="form-label">GST Number Text</label>
                  <input
                    type="text"
                    className="form-control"
                    value={store.shared.gstinText}
                    onChange={e => handleSharedChange('gstinText', e.target.value)}
                  />
                </div>
                <div className="form-group w-100 mt-1">
                  <label className="form-label">Business Name, Address & Contact Info</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={store.shared.businessText}
                    onChange={e => handleSharedChange('businessText', e.target.value)}
                  />
                </div>
                <div className="form-group w-100 mt-1">
                  <label className="form-label">Upload Business Logo</label>
                  <input type="file" accept="image/*" className="form-control mb-1" onChange={handleImageUpload} />
                  {store.shared.logoUrl && (
                    <img
                      src={store.shared.logoUrl}
                      alt="Preview"
                      style={{ height: '60px', objectFit: 'contain', border: '1px solid #ccc', padding: '5px', backgroundColor: '#fff' }}
                    />
                  )}
                </div>
                <button className="btn btn-success mt-1" onClick={handleSaveShared}>💾 Save Business Details</button>
              </div>
            )}

            {/* TAB D: BANK DETAILS */}
            {printTab === 'bank' && (
              <div className="card">
                <h2 className="card-title mb-1-5">Bank Details & Terms (Shared Across All Templates)</h2>
                <div className="form-group w-100">
                  <label className="form-label">Banking Information (Printed at bottom left)</label>
                  <textarea
                    className="form-control"
                    rows={6}
                    value={store.shared.bankText}
                    onChange={e => handleSharedChange('bankText', e.target.value)}
                  />
                </div>
                <button className="btn btn-success mt-1" onClick={handleSaveShared}>💾 Save Bank Details</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}