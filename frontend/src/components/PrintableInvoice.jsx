import React, { useEffect, useState } from 'react';
import { formatInvoiceId, formatMoney } from '../utils/formatters';
import { loadInvoiceSettings, numberToIndianWords } from '../utils/invoiceTemplates';

export default function PrintableInvoice({ selectedInvoice, selectedInvoiceMath, customers }) {
  const [store, setStore] = useState(null);

  useEffect(() => {
    setStore(loadInvoiceSettings());
  }, [selectedInvoice]);

  if (!selectedInvoice || !selectedInvoiceMath || !store) return null;

  const config = store.templates[store.activeTemplateId] || store.templates.template1;
  const shared = store.shared;
  const variant = config.layoutVariant || 'classic';

  const inv = selectedInvoice;
  const math = selectedInvoiceMath;
  const cust = customers.find(c => c.name === inv.customerName) || {};

  // --- 22/30 ROW SMART PAGINATION ---
  const firstPageRows = variant === 'classic' ? 22 : 18;
  const items = inv.items || [];
  const pages = [];

  if (items.length <= firstPageRows) {
    pages.push({ items: items, isLastPage: true, padTo: firstPageRows });
  } else {
    pages.push({ items: items.slice(0, 28), isLastPage: false, padTo: 28 });
    const remainingItems = items.slice(28);
    if (remainingItems.length === 0) {
      pages.push({ items: [], isLastPage: true, padTo: 0 });
    } else {
      for (let i = 0; i < remainingItems.length; i += 28) {
        const chunk = remainingItems.slice(i, i + 28);
        const isLast = (i + 28) >= remainingItems.length;
        pages.push({ items: chunk, isLastPage: isLast, padTo: isLast ? chunk.length : 28 });
      }
    }
  }

  const specialDiscountPct = math.discountPercent > 0 ? `${math.discountPercent.toFixed(2)} %` : '';
  const cgstPct = math.cgstPercent > 0 ? `${math.cgstPercent.toFixed(2)} %` : '';
  const sgstPct = math.sgstPercent > 0 ? `${math.sgstPercent.toFixed(2)} %` : '';
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;
  const companyNameLine = (shared.businessText || '').split('\n')[1] || 'Ramesh Enterprises';

  // Render the Header section according to the active template's structural variant
  const renderPageOneHeader = () => {
    // 1. TALLY PRIME BOXED GRID HEADER
    if (variant === 'tally') {
      return (
        <>
          <div style={{ position: 'absolute', left: config.logo.x, top: config.logo.y, width: config.logo.width, height: config.logo.height }}>
            <img src={shared.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ position: 'absolute', left: config.business.x, top: config.business.y, width: config.business.width, height: config.business.height, fontSize: `${config.business.fontSize}px`, fontFamily: config.business.fontFamily, whiteSpace: 'pre-wrap', fontWeight: 'bold', lineHeight: 1.35 }}>
            {inv.isReturn ? shared.businessText.replace(/Invoice/i, 'CREDIT NOTE') : shared.businessText}
          </div>
          <div style={{ position: 'absolute', left: config.gstin.x, top: config.gstin.y, width: config.gstin.width, fontSize: `${config.gstin.fontSize}px`, fontWeight: 'bold' }}>
            {shared.gstinText}
          </div>

          <div style={{ position: 'absolute', left: config.divider1.x, top: config.divider1.y, width: config.divider1.width, borderTop: '1px solid #000' }} />

          {/* Buyer Box (Bottom-Left of Header Grid) */}
          <div style={{ position: 'absolute', left: config.customer.x, top: config.customer.y, width: config.customer.width, height: config.customer.height, fontSize: `${config.customer.fontSize}px`, fontFamily: config.customer.fontFamily, padding: '8px 12px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase' }}>Buyer (Bill To):</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1em', textTransform: 'uppercase' }}>{inv.customerName}</div>
            <div>{[cust.address, cust.location, cust.city, cust.state].filter(Boolean).join(', ')}</div>
            <div>Ph: {cust.mobile || 'N/A'} | <strong>GSTIN: {cust.gstno || 'Unregistered'}</strong></div>
          </div>

          {/* 4-Cell Tally Metadata Box (Right Side of Header Grid) */}
          <div style={{ position: 'absolute', left: config.meta.x, top: config.meta.y, width: config.meta.width, height: config.meta.height, borderLeft: '1px solid #000', fontSize: `${config.meta.fontSize}px`, fontFamily: config.meta.fontFamily, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', boxSizing: 'border-box' }}>
            <div style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#475569' }}>Invoice No.</div>
              <strong style={{ fontSize: '1.1em' }}>{inv.customInvoiceId || formatInvoiceId(inv.id)}</strong>
            </div>
            <div style={{ borderBottom: '1px solid #000', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#475569' }}>Dated</div>
              <strong>{new Date(inv.orderDate).toLocaleDateString('en-GB')}</strong>
            </div>
            <div style={{ borderRight: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#475569' }}>Mode / Payment</div>
              <strong>{inv.paymentMethod || 'Cash'}</strong>
            </div>
            <div style={{ borderBottom: '1px solid #000', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#475569' }}>Terms of Payment</div>
              <strong>{inv.dueDays ? `Net ${inv.dueDays} Days` : 'Immediate'}</strong>
            </div>
            <div style={{ borderRight: '1px solid #000', padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#475569' }}>Destination / City</div>
              <strong>{cust.city || cust.location || 'Local'}</strong>
            </div>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontSize: '10px', color: '#475569' }}>Document Type</div>
              <strong>{inv.isReturn ? 'Credit Note' : 'Tax Invoice'}</strong>
            </div>
          </div>

          <div style={{ position: 'absolute', left: config.divider2.x, top: config.divider2.y, width: '100%', borderTop: '1px solid #000' }} />
        </>
      );
    }

    // 2. CORPORATE SPLIT-HEADER & DUAL BILL-TO / SHIP-TO CARDS
    if (variant === 'corporate') {
      return (
        <>
          <div style={{ position: 'absolute', left: config.meta.x, top: config.meta.y, width: config.meta.width, height: config.meta.height, fontSize: `${config.meta.fontSize}px`, fontFamily: config.meta.fontFamily }}>
            <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '1.5px', color: '#0f172a', marginBottom: '4px' }}>
              {inv.isReturn ? 'CREDIT NOTE' : 'TAX INVOICE'}
            </div>
            <div><strong>Invoice No:</strong> {inv.customInvoiceId || formatInvoiceId(inv.id)}</div>
            <div><strong>Invoice Date:</strong> {new Date(inv.orderDate).toLocaleDateString('en-GB')}</div>
          </div>

          <div style={{ position: 'absolute', left: config.gstin.x, top: config.gstin.y, width: config.gstin.width, fontSize: `${config.gstin.fontSize}px`, fontWeight: 'bold' }}>
            {shared.gstinText}
          </div>

          <div style={{ position: 'absolute', left: config.logo.x, top: config.logo.y, width: config.logo.width, height: config.logo.height }}>
            <img src={shared.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ position: 'absolute', left: config.business.x, top: config.business.y, width: config.business.width, height: config.business.height, fontSize: `${config.business.fontSize}px`, fontFamily: config.business.fontFamily, textAlign: 'right', whiteSpace: 'pre-wrap', fontWeight: 'bold', lineHeight: 1.35 }}>
            {shared.businessText.replace(/^Invoice\n?/i, '')}
          </div>

          <div style={{ position: 'absolute', left: config.divider1.x, top: config.divider1.y, width: config.divider1.width, borderTop: '2px solid #0f172a' }} />

          {/* Left Card: BILL TO */}
          <div style={{ position: 'absolute', left: config.customer.x, top: config.customer.y, width: config.customer.width, height: config.customer.height, fontSize: `${config.customer.fontSize}px`, fontFamily: config.customer.fontFamily, border: '1px solid #0f172a', borderRadius: '6px', padding: '8px 12px', boxSizing: 'border-box' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', letterSpacing: '1px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '4px' }}>BILL TO</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.08em', textTransform: 'uppercase' }}>{inv.customerName}</div>
            <div>{[cust.location, cust.city, cust.state].filter(Boolean).join(', ')}</div>
            <div>Phone: {cust.mobile || 'N/A'} | <strong>GSTIN: {cust.gstno || 'URD'}</strong></div>
          </div>

          {/* Right Card: SHIP TO & PAYMENT TERMS */}
          {config.shipTo && (
            <div style={{ position: 'absolute', left: config.shipTo.x, top: config.shipTo.y, width: config.shipTo.width, height: config.shipTo.height, fontSize: `${config.shipTo.fontSize}px`, fontFamily: config.shipTo.fontFamily, border: '1px solid #0f172a', borderRadius: '6px', padding: '8px 12px', boxSizing: 'border-box' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10px', letterSpacing: '1px', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '4px' }}>SHIP TO & PAYMENT INFO</div>
              <div><strong>Delivery City:</strong> {cust.city || cust.location || 'Counter Sale'}</div>
              <div><strong>Payment Mode:</strong> {inv.paymentMethod || 'Cash'}</div>
              <div><strong>Credit Terms:</strong> {inv.dueDays ? `${inv.dueDays} Days` : 'Immediate Settlement'}</div>
            </div>
          )}

          <div style={{ position: 'absolute', left: config.divider2.x, top: config.divider2.y, width: config.divider2.width, borderTop: '1px solid #0f172a' }} />
        </>
      );
    }

    // 3. VYAPAR 3-COLUMN HORIZONTAL STRIP HEADER
    if (variant === 'vyapar') {
      return (
        <>
          <div style={{ position: 'absolute', left: config.logo.x, top: config.logo.y, width: config.logo.width, height: config.logo.height }}>
            <img src={shared.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ position: 'absolute', left: config.business.x, top: config.business.y, width: config.business.width, height: config.business.height, fontSize: `${config.business.fontSize}px`, fontFamily: config.business.fontFamily, textAlign: 'center', whiteSpace: 'pre-wrap', fontWeight: 'bold', lineHeight: 1.3 }}>
            {inv.isReturn ? shared.businessText.replace(/Invoice/i, 'CREDIT NOTE') : shared.businessText}
          </div>

          <div style={{ position: 'absolute', left: config.gstin.x, top: config.gstin.y, width: config.gstin.width, height: config.gstin.height, border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontSize: `${config.gstin.fontSize}px`, fontWeight: 'bold', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.1em', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '3px' }}>
              {inv.isReturn ? 'CREDIT NOTE' : 'TAX INVOICE'}
            </div>
            <div>{shared.gstinText}</div>
          </div>

          <div style={{ position: 'absolute', left: config.divider1.x, top: config.divider1.y, width: '100%', borderTop: '1px solid #000' }} />

          {/* 3-Column Strip: Col 1 (Customer) | Col 2 (Place & GST) | Col 3 (Invoice Meta) */}
          <div style={{ position: 'absolute', left: config.customer.x, top: config.customer.y, width: config.customer.width, height: config.customer.height, borderRight: '1px solid #000', padding: '6px 10px', fontSize: `${config.customer.fontSize}px`, boxSizing: 'border-box' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569' }}>PARTY / BILLED TO:</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1em', textTransform: 'uppercase' }}>{inv.customerName}</div>
            <div>Address: {[cust.location, cust.city].filter(Boolean).join(', ') || 'N/A'}</div>
            <div>Phone: <strong>{cust.mobile || 'N/A'}</strong></div>
          </div>

          {config.shipTo && (
            <div style={{ position: 'absolute', left: config.shipTo.x, top: config.shipTo.y, width: config.shipTo.width, height: config.shipTo.height, borderRight: '1px solid #000', padding: '6px 10px', fontSize: `${config.shipTo.fontSize}px`, boxSizing: 'border-box' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569' }}>TAX & SUPPLY DETAILS:</div>
              <div><strong>Buyer GSTIN:</strong> {cust.gstno || 'URD'}</div>
              <div><strong>State / Place:</strong> {cust.state || cust.city || 'Telangana'}</div>
              <div><strong>Payment Mode:</strong> {inv.paymentMethod || 'Cash'}</div>
            </div>
          )}

          <div style={{ position: 'absolute', left: config.meta.x, top: config.meta.y, width: config.meta.width, height: config.meta.height, padding: '6px 10px', fontSize: `${config.meta.fontSize}px`, boxSizing: 'border-box' }}>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569' }}>INVOICE DETAILS:</div>
            <div><strong>Invoice No:</strong> {inv.customInvoiceId || formatInvoiceId(inv.id)}</div>
            <div><strong>Date:</strong> {new Date(inv.orderDate).toLocaleDateString('en-GB')}</div>
            <div><strong>Due Terms:</strong> {inv.dueDays ? `${inv.dueDays} Days` : 'Immediate'}</div>
          </div>

          <div style={{ position: 'absolute', left: config.divider2.x, top: config.divider2.y, width: '100%', borderTop: '1px solid #000' }} />
        </>
      );
    }

    // 4. DEFAULT: TEMPLATE 1 CLASSIC STANDARD
    return (
      <>
        <div style={{ position: 'absolute', left: config.gstin.x, top: config.gstin.y, width: config.gstin.width, height: config.gstin.height || 'auto', fontSize: `${config.gstin.fontSize || 12}px`, fontFamily: config.gstin.fontFamily, fontWeight: 'bold' }}>
          {shared.gstinText}
        </div>
        <div style={{ position: 'absolute', left: config.business.x, top: config.business.y, width: config.business.width, height: config.business.height || 'auto', fontSize: `${config.business.fontSize || 14}px`, fontFamily: config.business.fontFamily, textAlign: 'center', whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>
          {inv.isReturn ? shared.businessText.replace(/Invoice/i, 'CREDIT NOTE') : shared.businessText}
        </div>
        <div style={{ position: 'absolute', left: config.logo.x, top: config.logo.y, width: config.logo.width, height: config.logo.height }}>
          <img src={shared.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ position: 'absolute', left: config.divider1.x, top: config.divider1.y, width: '100%', borderTop: '1px solid #000' }}></div>
        <div style={{ position: 'absolute', left: config.customer.x, top: config.customer.y, width: config.customer.width, height: config.customer.height || 'auto', fontSize: `${config.customer.fontSize || 12}px`, fontFamily: config.customer.fontFamily, padding: '10px 15px', lineHeight: '1.5' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{inv.customerName}</div>
          <div>{cust.address || cust.location || cust.city || ''}</div>
          <div>{cust.mobile || ''}</div>
          <div style={{ marginTop: '4px', fontWeight: 'bold' }}>GST No: {cust.gstno || 'URD'}</div>
        </div>
        <div style={{ position: 'absolute', left: config.meta.x, top: config.meta.y, width: config.meta.width, height: config.meta.height || 'auto', fontSize: `${config.meta.fontSize || 12}px`, fontFamily: config.meta.fontFamily, padding: '10px 15px', lineHeight: '1.8', fontWeight: 'bold', textAlign: 'right' }}>
          <div>{new Date(inv.orderDate).toLocaleDateString('en-GB')} {new Date(inv.orderDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
          <div>{inv.customInvoiceId || formatInvoiceId(inv.id)}</div>
        </div>
        <div style={{ position: 'absolute', left: config.divider2.x, top: config.divider2.y, width: '100%', borderTop: '1px solid #000' }}></div>
      </>
    );
  };

  // Render the Summary & Footer blocks according to the active template's structural variant
  const renderSummaryBlocks = (isRelative = false) => {
    const baseTop = isRelative ? (config.amountWords?.y || config.summary.y) : 0;
    const calcTop = (yVal) => isRelative ? (yVal - baseTop) : yVal;

    return (
      <>
        {/* Amount in Words Box (Tally & Vyapar Templates) */}
        {config.amountWords && (
          <div style={{
            position: 'absolute',
            left: config.amountWords.x,
            top: calcTop(config.amountWords.y),
            width: config.amountWords.width,
            height: config.amountWords.height,
            border: '1px solid #000',
            padding: '6px 10px',
            fontSize: `${config.amountWords.fontSize || 11}px`,
            fontFamily: config.amountWords.fontFamily,
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: '9px', color: '#475569', fontWeight: 'bold' }}>AMOUNT CHARGEABLE (IN WORDS):</div>
            <strong>{numberToIndianWords(math.finalTotal)}</strong>
          </div>
        )}

        {/* Bank Block */}
        <div style={{
          position: 'absolute',
          left: config.bank.x,
          top: calcTop(config.bank.y),
          width: config.bank.width,
          height: config.bank.height || 'auto',
          fontSize: `${config.bank.fontSize || 12}px`,
          fontFamily: config.bank.fontFamily,
          lineHeight: '1.55',
          whiteSpace: 'pre-wrap',
          padding: '8px 10px',
          border: (variant === 'tally' || variant === 'vyapar') ? '1px solid #000' : 'none',
          boxSizing: 'border-box'
        }}>
          {(variant === 'tally' || variant === 'vyapar' || variant === 'corporate') && (
            <div style={{ fontWeight: 'bold', fontSize: '10px', borderBottom: '1px solid #cbd5e1', marginBottom: '3px' }}>COMPANY BANK DETAILS:</div>
          )}
          {shared.bankText}
        </div>

        {/* Terms & Conditions Block (Tally, Corporate & Vyapar Templates) */}
        {config.terms && (
          <div style={{
            position: 'absolute',
            left: config.terms.x,
            top: calcTop(config.terms.y),
            width: config.terms.width,
            height: config.terms.height,
            fontSize: `${config.terms.fontSize || 10}px`,
            fontFamily: config.terms.fontFamily,
            whiteSpace: 'pre-wrap',
            padding: '6px 10px',
            border: (variant === 'tally' || variant === 'vyapar') ? '1px solid #000' : 'none',
            boxSizing: 'border-box',
            lineHeight: 1.4
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '9.5px', marginBottom: '2px' }}>TERMS & CONDITIONS:</div>
            {shared.termsText}
          </div>
        )}

        {/* Math Summary Table */}
        <div style={{
          position: 'absolute',
          left: config.summary.x,
          top: calcTop(config.summary.y),
          width: config.summary.width,
          height: config.summary.height || 'auto',
          fontSize: `${config.summary.fontSize || 12}px`,
          fontFamily: config.summary.fontFamily,
          backgroundColor: 'white',
          boxSizing: 'border-box'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <tbody>
              <tr>
                <td colSpan="2" style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>Total Quantity</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold', width: '32%' }}>{totalQty}</td>
              </tr>
              <tr>
                <td colSpan="2" style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>Subtotal</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{math.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>Special Discount</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center', width: '20%', fontWeight: 'bold' }}>{specialDiscountPct}</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{math.discountAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="2" style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>Taxable Value</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{math.taxableAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>CGST</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>{cgstPct}</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{math.cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>SGST</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'center', fontWeight: 'bold' }}>{sgstPct}</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{math.sgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="2" style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right' }}>Round off</td>
                <td style={{ border: '1px solid #000', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{math.roundoff.toFixed(2)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <td colSpan="2" style={{ border: '1px solid #000', padding: '7px 8px', textAlign: 'right', fontWeight: 'bold' }}>Grand Total</td>
                <td style={{ border: '1px solid #000', padding: '7px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.18em' }}>{formatMoney(math.finalTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Authorised Signatory Box (Tally, Corporate & Vyapar Templates) */}
        {config.signature && (
          <div style={{
            position: 'absolute',
            left: config.signature.x,
            top: calcTop(config.signature.y),
            width: config.signature.width,
            height: config.signature.height,
            border: (variant === 'tally' || variant === 'vyapar') ? '1px solid #000' : 'none',
            padding: '8px 14px',
            fontSize: `${config.signature.fontSize || 11}px`,
            fontFamily: config.signature.fontFamily,
            display: 'flex',
            justifyContent: variant === 'vyapar' ? 'space-between' : 'flex-end',
            alignItems: 'flex-end',
            boxSizing: 'border-box'
          }}>
            {variant === 'vyapar' && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', width: '180px' }}>Customer Signature & Stamp</div>
              </div>
            )}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <strong>For {companyNameLine}</strong>
              <span style={{ borderTop: '1px solid #000', paddingTop: '3px', display: 'inline-block', minWidth: '150px', textAlign: 'center' }}>
                Authorised Signatory
              </span>
            </div>
          </div>
        )}
      </>
    );
  };

  const isHorizontalOnly = config.tableStyle === 'horizontal';
  const cellBorder = isHorizontalOnly ? 'none' : '1px solid #000';
  const rowBorder = '1px solid #000';

  return (
    <div style={{ backgroundColor: '#fff' }}>
      {pages.map((page, pageIndex) => {
        const emptyRowsCount = Math.max(0, page.padTo - page.items.length);

        return (
          <div key={pageIndex} className="invoice-a4-box" style={{ fontFamily: 'Arial, sans-serif', color: '#000', fontSize: '12px' }}>
            {pageIndex === 0 && renderPageOneHeader()}

            {/* PRODUCTS TABLE */}
            <div style={{ position: 'absolute', left: config.table.x, top: pageIndex === 0 ? config.table.y : 0, width: config.table.width, fontSize: `${config.table.fontSize || 12}px`, fontFamily: config.table.fontFamily }}>
              {(page.items.length > 0 || pageIndex === 0) && (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', borderBottom: '1px solid #000' }}>
                  <thead style={{ backgroundColor: config.accentColor || '#d1d5db', color: config.headerTextColor || '#000' }}>
                    <tr>
                      <th style={{ border: cellBorder, borderLeft: 'none', borderTop: 'none', padding: '6px', width: '6%' }}>S.No</th>
                      <th style={{ border: cellBorder, borderTop: 'none', padding: '6px', width: '10%' }}>HSN</th>
                      <th style={{ border: cellBorder, borderTop: 'none', padding: '6px', width: '42%', textAlign: 'left' }}>Product Description</th>
                      <th style={{ border: cellBorder, borderTop: 'none', padding: '6px', width: '14%' }}>Qty</th>
                      <th style={{ border: cellBorder, borderTop: 'none', padding: '6px', width: '14%' }}>Rate (₹)</th>
                      <th style={{ border: cellBorder, borderRight: 'none', borderTop: 'none', padding: '6px', width: '14%', textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: isHorizontalOnly ? '1px solid #cbd5e1' : rowBorder }}>
                        <td style={{ border: cellBorder, borderLeft: 'none', padding: '4px', height: '24px' }}>{(pageIndex === 0 ? 0 : 28 + ((pageIndex - 1) * 28)) + i + 1}</td>
                        <td style={{ border: cellBorder, padding: '4px' }}>{item.product?.hsnCode || ''}</td>
                        <td style={{ border: cellBorder, padding: '4px', textAlign: 'left', fontWeight: 500 }}>{item.product?.name || item.name || 'Unknown'}</td>
                        <td style={{ border: cellBorder, padding: '4px' }}>{item.quantity} {item.sellType === 'Piece' ? 'pcs' : 'Box'}</td>
                        <td style={{ border: cellBorder, padding: '4px' }}>{(item.price || 0).toFixed(2)}</td>
                        <td style={{ border: cellBorder, borderRight: 'none', padding: '4px', textAlign: 'right', fontWeight: 600 }}>{((item.price || 0) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    {[...Array(emptyRowsCount)].map((_, i) => (
                      <tr key={`empty-${i}`} style={{ borderBottom: isHorizontalOnly ? '1px dashed #e2e8f0' : rowBorder }}>
                        <td style={{ border: cellBorder, borderLeft: 'none', height: '24px' }}></td>
                        <td style={{ border: cellBorder }}></td>
                        <td style={{ border: cellBorder }}></td>
                        <td style={{ border: cellBorder }}></td>
                        <td style={{ border: cellBorder }}></td>
                        <td style={{ border: cellBorder, borderRight: 'none' }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {!page.isLastPage && (
                <div style={{ textAlign: 'right', fontStyle: 'italic', padding: '10px' }}>Continued on next page...</div>
              )}

              {page.isLastPage && pageIndex > 0 && (
                <div style={{ position: 'relative', width: '100%', height: '280px', marginTop: '15px' }}>
                  {renderSummaryBlocks(true)}
                </div>
              )}
            </div>

            {page.isLastPage && pageIndex === 0 && renderSummaryBlocks(false)}
          </div>
        );
      })}
    </div>
  );
}