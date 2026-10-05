import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { formatProductId } from '../utils/formatters';
import { customerService, productService, backupService } from '../services/api';

export default function DataTransfer({ customers = [], products = [], loadCustomers, loadProducts, loadHistory }) {
  // --- SQL Backup & Restore States ---
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedSqlFile, setSelectedSqlFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // --- 1. FULL SQL BACKUP DOWNLOAD ---
  const handleDownloadSqlBackup = async () => {
    setIsBackingUp(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await backupService.downloadSqlBackup();
      setStatusMsg({
        type: 'success',
        text: '✅ Full SQL Backup generated! Save the .sql file to your Pendrive or C: Drive.'
      });
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: `❌ Backup failed: ${err.message || 'Ensure backend is running and mysqldump is accessible.'}`
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // --- 2. FULL SQL BACKUP RESTORE ---
  const handleRestoreSqlBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const confirmRestore = window.confirm(
      `⚠️ CRITICAL WARNING:\n\nRestoring from "${file.name}" will completely overwrite ALL current database records (Sales, Purchases, Receipts, Products, Customers, Vendors, Employees, and History) with the snapshot inside this file.\n\nAre you 100% sure you want to proceed?`
    );
    if (!confirmRestore) {
      e.target.value = null;
      return;
    }

    setIsRestoring(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await backupService.restoreSqlBackup(file);
      setStatusMsg({
        type: 'success',
        text: '✅ Database restored successfully! Reloading application in 2 seconds...'
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: `❌ Restore failed: ${err.message}`
      });
    } finally {
      setIsRestoring(false);
      e.target.value = null;
    }
  };

  // --- 3. ORIGINAL CUSTOMER EXCEL IMPORT / EXPORT ---
  const handleImportCustomers = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedCustomers = data.map(row => ({
          name: row.Name || row.name || 'Unknown',
          mobile: String(row['Phone Number'] || row.mobile || ''),
          city: row.City || row.city || '',
          location: row.Location || row.location || '',
          gstno: row.GST || row.gstno || '',
          balance: Number(row.Balance || row.balance) || 0,
          state: row.State || row.state || ''
        }));

        customerService.addCustomersBulk(formattedCustomers)
          .then(() => {
            window.alert(`Successfully imported/updated ${formattedCustomers.length} customers!`);
            loadCustomers();
          })
          .catch(err => window.alert("Failed to import customers: " + err.message));
      } catch (err) { window.alert("Error parsing Excel file: " + err.message); }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  const handleExportCustomers = () => {
    if (customers.length === 0) return window.alert("No customers to export.");
    const dataToExport = customers.map(c => ({
      'Customer ID': c.id,
      'Name': c.name,
      'Phone Number': c.mobile,
      'City': c.city,
      'Location': c.location,
      'State': c.state,
      'GST': c.gstno,
      'Balance': c.balance
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `Customers_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- 4. ORIGINAL PRODUCT EXCEL IMPORT / EXPORT (+ BARCODE SUPPORT) ---
  const handleImportProducts = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedProducts = data.map(row => {
          let parsedId = null;
          const rawId = row.Id || row['Product ID'] || row.id;
          if (rawId) {
             const extracted = String(rawId).replace(/[^0-9]/g, '');
             if (extracted) parsedId = parseInt(extracted, 10);
          }
          return {
            id: parsedId,
            name: row.Name || row.name || 'Unknown Product',
            barcode: String(row.Barcode || row['Barcode / SKU'] || row.barcode || ''),
            hsnCode: String(row.HSN || row['HSN Code'] || row.hsnCode || ''),
            purchasePrice: Number(row['purchase price'] || row['Purchase Price'] || row.purchasePrice) || 0,
            mrp: Number(row.MRP || row.mrp) || 0,
            price: Number(row['sales price'] || row['Selling Price'] || row.price) || 0,
            stock: Number(row['In Stock'] || row['In Stock (Boxes)'] || row.Stock || row.stock) || 0,
            // Piece Logic parsed from Excel
            piecesPerBox: Number(row['Pieces Per Box'] || row.piecesPerBox) || 0,
            piecePurchasePrice: Number(row['Piece Purchase Price'] || row.piecePurchasePrice) || 0,
            pieceMrp: Number(row['Piece MRP'] || row.pieceMrp) || 0,
            piecePrice: Number(row['Piece Selling Price'] || row.piecePrice) || 0,
          };
        });

        productService.addProductsBulk(formattedProducts)
          .then(() => {
            window.alert(`Successfully imported/updated ${formattedProducts.length} products!`);
            loadProducts();
            loadHistory(); 
          })
          .catch(err => window.alert("Failed to import products: " + err.message));
      } catch (err) { window.alert("Error parsing Excel file: " + err.message); }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; 
  };

  const handleExportProducts = () => {
    if (products.length === 0) return window.alert("No products to export.");
    const dataToExport = products.map(p => ({
      'Product ID': formatProductId(p.id),
      'Name': p.name,
      'Barcode': p.barcode || '',
      'HSN Code': p.hsnCode || '',
      'Purchase Price': p.purchasePrice,
      'MRP': p.mrp || p.price,
      'Selling Price': p.price,
      'In Stock (Boxes)': p.stock,
      'Pieces Per Box': p.piecesPerBox || '',
      'Piece Purchase Price': p.piecePurchasePrice || '',
      'Piece MRP': p.pieceMrp || '',
      'Piece Selling Price': p.piecePrice || ''
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `Products_Inventory_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="card bg-transparent">
      {/* STATUS MESSAGE BANNER FOR SQL BACKUP/RESTORE */}
      {statusMsg.text && (
        <div 
          className="card mb-2 fw-bold" 
          style={{ 
            padding: '15px 20px', 
            borderLeft: `5px solid ${statusMsg.type === 'success' ? '#16a34a' : '#dc2626'}`,
            backgroundColor: statusMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: statusMsg.type === 'success' ? '#166534' : '#991b1b'
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* FULL SYSTEM SQL DATABASE BACKUP & RESTORE */}
      <div className="card mb-2">
        <div className="card-header">
          <h2 className="card-title">Full System Database Backup & Recovery (.SQL)</h2>
        </div>
        <div className="reports-layout mt-1">
          <div className="card stat-card report-card report-card-export mb-0">
            <h4>💾 Export Full SQL Snapshot</h4>
            <p className="text-muted mb-1-5">
              Download a complete MySQL snapshot (.sql) containing all Invoices, Purchases, Receipts, Ledgers, Products, Customers, Vendors, Employees, and Edit History for your Pendrive.
            </p>
            <div className="mt-auto">
              <button 
                className="btn btn-primary w-100" 
                onClick={handleDownloadSqlBackup} 
                disabled={isBackingUp}
              >
                {isBackingUp ? '⏳ Generating SQL Snapshot...' : '📥 Download Full SQL Backup (.sql)'}
              </button>
            </div>
          </div>

          <div className="card stat-card report-card report-card-import mb-0">
            <h4>🔄 Restore System from SQL Backup</h4>
            <p className="text-muted mb-1-5">
              Upload a saved <code>.sql</code> backup file from your Pendrive to completely restore the entire ERP database onto this machine.
            </p>
            <div className="mt-auto">
              <input 
                type="file" 
                id="sql-upload-restore" 
                accept=".sql" 
                className="d-none" 
                disabled={isRestoring}
                onChange={handleRestoreSqlBackup} 
              />
              <label 
                htmlFor="sql-upload-restore" 
                className="btn btn-danger w-100 d-block cursor-pointer"
                style={{ textAlign: 'center' }}
              >
                {isRestoring ? '⏳ Restoring Database...' : '⚠️ Select .SQL File to Restore'}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ORIGINAL EXCEL CUSTOMER & INVENTORY CARDS */}
      <div className="reports-layout">
        <div className="card mb-0">
          <div className="card-header"><h2 className="card-title">Customer Data Transfer</h2></div>
          <div className="dashboard-stats-grid single-col mt-1">
            <div className="card stat-card report-card report-card-export">
              <h4>Export Customers</h4>
              <p className="text-muted mb-1-5">Download a complete backup of all your customers and their ledger balances.</p>
              <div className="mt-auto">
                <button className="btn btn-primary w-100" onClick={handleExportCustomers}>Download Excel Backup</button>
              </div>
            </div>
            <div className="card stat-card report-card report-card-import">
              <h4>Import Customers</h4>
              <p className="text-muted mb-1-5">Upload Excel file to add new customers or update existing ones (matches by Phone Number or Name).</p>
              <div className="mt-auto">
                <input type="file" id="excel-upload-customers" accept=".xlsx, .xls" className="d-none" onChange={handleImportCustomers} />
                <label htmlFor="excel-upload-customers" className="btn btn-success w-100 d-block cursor-pointer">Select Excel File</label>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-0">
          <div className="card-header"><h2 className="card-title">Inventory Data Transfer</h2></div>
          <div className="dashboard-stats-grid single-col mt-1">
            <div className="card stat-card report-card report-card-export-prod">
              <h4>Export Products</h4>
              <p className="text-muted mb-1-5">Download a complete list of your products, barcodes, box prices, piece prices, and stock levels.</p>
              <div className="mt-auto">
                <button className="btn btn-warning w-100" onClick={handleExportProducts}>Download Excel Backup</button>
              </div>
            </div>
            <div className="card stat-card report-card report-card-import-prod">
              <h4>Import Products</h4>
              <p className="text-muted mb-1-5">Upload Excel file to add new products or update prices/stock/barcodes (matches by Product ID or Name).</p>
              <div className="mt-auto">
                <input type="file" id="excel-upload-products" accept=".xlsx, .xls" className="d-none" onChange={handleImportProducts} />
                <label htmlFor="excel-upload-products" className="btn btn-purple w-100 d-block cursor-pointer">Select Excel File</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}