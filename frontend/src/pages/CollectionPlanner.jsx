import React, { useState, useEffect, useMemo } from 'react';
import { formatInvoiceId, formatMoney } from '../utils/formatters';
import { receiptService } from '../services/api';

export default function CollectionPlanner({ customers = [], invoices = [], receipts: propReceipts }) {
  const [selectedCities, setSelectedCities] = useState([]);
  const [localReceipts, setLocalReceipts] = useState([]);

  useEffect(() => {
    if (!propReceipts || propReceipts.length === 0) {
      receiptService.getReceipts()
        .then(data => setLocalReceipts(Array.isArray(data) ? data : []))
        .catch(err => console.error("Failed to load receipts for Collection Planner:", err));
    }
  }, [propReceipts]);

  const receipts = (propReceipts && propReceipts.length > 0) ? propReceipts : localReceipts;

  const normalizeName = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. TRUE DYNAMIC BALANCE ENGINE (Synced with Ledger & ReceiptManager)
  const trueBalances = useMemo(() => {
    const balances = {};
    customers.forEach(c => { balances[c.id] = 0; });

    invoices.forEach(inv => {
      const cleanInvName = normalizeName((inv.customerName || '').replace(/\s*\(Returned\)\s*/i, ''));
      const cust = customers.find(c => normalizeName(c.name) === cleanInvName);

      if (cust && inv.paymentMethod === 'Pay Later') {
        const amount = Math.abs(Number(inv.finalTotal || inv.totalAmount || 0));
        if (!inv.isReturn) balances[cust.id] += amount;
        else balances[cust.id] -= amount;
      }
    });

    receipts.forEach(rec => {
      const recNameNorm = normalizeName(rec.customerName);
      const cust = customers.find(c => String(c.id) === String(rec.customerId) || normalizeName(c.name) === recNameNorm);

      if (cust) {
        balances[cust.id] -= (Number(rec.amount || 0) + Number(rec.discountAmount || 0));
      }
    });

    return balances;
  }, [customers, invoices, receipts]);

  // 2. Find all unique cities where customers actually have a positive pending balance
  const availableCities = useMemo(() => {
    const cities = customers
      .filter(c => (trueBalances[c.id] || 0) > 0.01 && c.city)
      .map(c => c.city.trim().toUpperCase());
    return [...new Set(cities)].sort();
  }, [customers, trueBalances]);

  const toggleCity = (city) => {
    setSelectedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  // 3. Build exact collection data using the 2-Pass Surgical + FIFO Engine
  const collectionData = useMemo(() => {
    if (selectedCities.length === 0) return {};

    const dataByCity = {};

    selectedCities.forEach(city => {
      const cityCustomers = customers.filter(c => 
        c.city && c.city.trim().toUpperCase() === city && (trueBalances[c.id] || 0) > 0.01
      );

      if (cityCustomers.length === 0) return;

      const customersWithBills = [];

      cityCustomers.forEach(customer => {
        const targetNameNorm = normalizeName(customer.name);
        
        // Sort Pay Later bills OLDEST first
        const payLaterBills = invoices
          .filter(inv => !inv.isReturn && inv.paymentMethod === 'Pay Later' && normalizeName(inv.customerName) === targetNameNorm)
          .sort((a, b) => {
            const timeDiff = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
            return timeDiff !== 0 ? timeDiff : a.id - b.id;
          });

        const specificCreditsByBillId = {};
        payLaterBills.forEach(b => { specificCreditsByBillId[b.id] = 0; });
        let generalFifoCredits = 0;

        // Classify Customer Receipts: Targeted (mentions INV-XXXX in remarks) vs General FIFO
        receipts.forEach(r => {
          const recNameNorm = normalizeName(r.customerName);
          if (String(r.customerId) === String(customer.id) || recNameNorm === targetNameNorm) {
            const credit = Number(r.amount || 0) + Number(r.discountAmount || 0);
            const remarksUpper = (r.remarks || '').toUpperCase();

            let matchedBill = null;
            for (const bill of payLaterBills) {
              const formattedTag = formatInvoiceId(bill.id).toUpperCase();
              const customTag = (bill.customInvoiceId || '').toUpperCase();
              if (
                (formattedTag && remarksUpper.includes(formattedTag)) ||
                (customTag && customTag.length > 2 && remarksUpper.includes(customTag))
              ) {
                matchedBill = bill;
                break;
              }
            }

            if (matchedBill) {
              specificCreditsByBillId[matchedBill.id] += credit;
            } else {
              generalFifoCredits += credit;
            }
          }
        });

        // Classify Sale Returns: Targeted (by originalInvoiceId) vs General FIFO
        invoices.forEach(inv => {
          const invNameNorm = normalizeName((inv.customerName || '').replace(/\s*\(Returned\)\s*/i, ''));
          if (inv.isReturn && (invNameNorm === targetNameNorm || normalizeName(inv.customerName).includes(targetNameNorm))) {
            const returnCredit = Math.abs(Number(inv.finalTotal || inv.totalAmount || 0));
            if (inv.originalInvoiceId && specificCreditsByBillId[inv.originalInvoiceId] !== undefined) {
              specificCreditsByBillId[inv.originalInvoiceId] += returnCredit;
            } else {
              generalFifoCredits += returnCredit;
            }
          }
        });

        // PASS 1: Apply Specific Targeted Credits directly to their matching bill
        const billsAfterPass1 = payLaterBills.map(bill => {
          const originalAmount = Math.round(Number(bill.finalTotal || bill.totalAmount || 0) * 100) / 100;
          const targetedCredit = specificCreditsByBillId[bill.id] || 0;

          if (targetedCredit >= originalAmount) {
            generalFifoCredits += (targetedCredit - originalAmount);
            return { ...bill, originalAmount, previouslyPaid: originalAmount, dueAmount: 0 };
          } else {
            return {
              ...bill,
              originalAmount,
              previouslyPaid: targetedCredit,
              dueAmount: Math.round((originalAmount - targetedCredit) * 100) / 100
            };
          }
        });

        // PASS 2: Apply General FIFO Credits (Oldest Bill First)
        const pending = [];
        for (const bill of billsAfterPass1) {
          if (bill.dueAmount <= 0.009) continue;

          let due = bill.dueAmount;
          let paid = bill.previouslyPaid;

          if (generalFifoCredits >= due - 0.009) {
            generalFifoCredits = Math.max(0, generalFifoCredits - due);
          } else if (generalFifoCredits > 0) {
            paid = Math.round((paid + generalFifoCredits) * 100) / 100;
            due = Math.round((due - generalFifoCredits) * 100) / 100;
            generalFifoCredits = 0;
            pending.push({ ...bill, previouslyPaid: paid, dueAmount: due });
          } else {
            pending.push({ ...bill, previouslyPaid: paid, dueAmount: due });
          }
        }

        // Keep Oldest bills first for the printed collection sheet
        if (pending.length > 0) {
          customersWithBills.push({
            ...customer,
            trueBalance: trueBalances[customer.id] || 0,
            pendingBills: pending
          });
        }
      });

      if (customersWithBills.length > 0) {
        dataByCity[city] = customersWithBills;
      }
    });

    return dataByCity;
  }, [selectedCities, customers, invoices, receipts, trueBalances]);

  // Helper to calculate invoice age in days
  const calculateAge = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(dateString);
    orderDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today - orderDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* CONTROL PANEL (Hidden during printing) */}
      <div className="card no-print">
        <div className="card-header border-bottom-padded mb-1">
          <h2 className="card-title mb-0">Route Collection Planner</h2>
        </div>
        <div className="p-1">
          <p className="text-muted fw-bold mb-1">Select the cities you are visiting today:</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {availableCities.length > 0 ? (
              availableCities.map(city => (
                <button
                  key={city}
                  className={`btn ${selectedCities.includes(city) ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '20px', padding: '8px 16px' }}
                  onClick={() => toggleCity(city)}
                >
                  {selectedCities.includes(city) ? '✓ ' : '+ '}{city}
                </button>
              ))
            ) : (
              <span className="text-muted">No cities with pending balances found in customer data.</span>
            )}
          </div>

          <div className="mt-2 border-top pt-1 text-right">
            <button 
              className="btn btn-success fs-lg px-2" 
              disabled={selectedCities.length === 0}
              onClick={handlePrint}
            >
              🖨️ Print Route Plan
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE REPORT AREA */}
      {selectedCities.length > 0 && (
        <div className="card" style={{ backgroundColor: '#fff', color: '#000' }}>
          <div className="no-print mb-2">
            <h3 className="text-slate">Report Preview</h3>
          </div>
          
          <div className="print-report-container">
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
              <h1 style={{ margin: '0', fontSize: '24px' }}>Daily Collection Route Plan</h1>
              <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>

            {selectedCities.map(city => {
              const cityCustomers = collectionData[city];
              if (!cityCustomers) return null;

              return (
                <div key={city} style={{ marginBottom: '30px' }}>
                  {/* CITY HEADER */}
                  <h2 style={{ backgroundColor: '#f1f5f9', padding: '10px', borderLeft: '4px solid #3b82f6', marginTop: '0', fontSize: '20px' }}>
                     {city}
                  </h2>

                  {/* CUSTOMER LOOP */}
                  {cityCustomers.map(customer => (
                    <div key={customer.id} style={{ marginBottom: '25px', paddingLeft: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                          👤 {customer.name}
                          {customer.mobile && <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '10px' }}>📞 {customer.mobile}</span>}
                        </h3>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          Total Due: <span style={{ color: '#ef4444' }}>{formatMoney(customer.trueBalance)}</span>
                        </div>
                      </div>

                      {/* BILLS TABLE */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#e2e8f0', color: '#334155' }}>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>Invoice No</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>Invoice Date</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>Actual Bill Amount</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>Paid Amount</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>Balance</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>Age (Days)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customer.pendingBills.map(bill => (
                            <tr key={bill.id}>
                              <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold' }}>{formatInvoiceId(bill.id)}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{new Date(bill.orderDate).toLocaleDateString('en-GB')}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>{formatMoney(bill.originalAmount)}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right' }}>{bill.previouslyPaid > 0 ? formatMoney(bill.previouslyPaid) : '-'}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#b91c1c' }}>{formatMoney(bill.dueAmount)}</td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{calculateAge(bill.orderDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              );
            })}
            
            {Object.keys(collectionData).length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                No pending bills found for the selected cities.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}