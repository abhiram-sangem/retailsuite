import { useEffect, useState, useMemo, useRef } from 'react';
import './App.css';

// --- COMPONENTS ---
import Login from './components/Login';
import Topbar from './components/Topbar';

// --- PAGES ---
import Dashboard from './pages/Dashboard';
import DataTransfer from './pages/DataTransfer';
import ReportsManager from './pages/ReportsManager';
import CustomerManager from './pages/CustomerManager';
import ProductsManager from './pages/ProductsManager';
import SalesManager from './pages/SalesManager';
import PurchaseManager from './pages/PurchaseManager';
import LedgerManager from './pages/LedgerManager';
import ReceiptManager from './pages/ReceiptManager';
import InventoryManager from './pages/InventoryManager';
import InvoiceBuilder from './pages/InvoiceBuilder';
import SettingsManager from './pages/SettingsManager';
import VendorManager from './pages/VendorManager';
import CollectionPlanner from './pages/CollectionPlanner';
import EmployeeManager from './pages/EmployeeManager';
import PriceScheduler from './pages/PriceScheduler';

// --- API ---
import { 
  productService, invoiceService, customerService, 
  purchaseInvoiceService, historyService, receiptService, vendorService, employeeService
} from './services/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [view, setView] = useState('home');
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [purchaseInvoiceHistory, setPurchaseInvoiceHistory] = useState([]);
  const [receiptHistory, setReceiptHistory] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [employees, setEmployees] = useState([]);

  // --- SMART CACHE TRACKER ---
  const loadedCache = useRef({
    products: false,
    customers: false,
    invoices: false,
    purchaseInvoices: false,
    receipts: false,
    vendors: false,
    employees: false,
    inventoryHistory: false,
    invoiceHistory: false,
    purchaseInvoiceHistory: false,
    receiptHistory: false
  });

  // --- DIRECT LOADERS ---
  function loadEmployees() {
    loadedCache.current.employees = true;
    employeeService.getEmployees().then(data => setEmployees(Array.isArray(data) ? data : []));
  }
  function loadVendors() {
    loadedCache.current.vendors = true;
    vendorService.getVendors().then(data => setVendors(Array.isArray(data) ? data : []));
  }
  function loadProducts() {
    loadedCache.current.products = true;
    productService.getProducts().then(data => setProducts(Array.isArray(data) ? data : []));
  }
  function loadCustomers() {
    loadedCache.current.customers = true;
    customerService.getCustomers().then(data => setCustomers(Array.isArray(data) ? data : []));
  }
  function loadInvoices() {
    loadedCache.current.invoices = true;
    invoiceService.getInvoices().then(data => setInvoices((data || []).sort((a, b) => b.id - a.id)));
  }
  function loadPurchaseInvoices() {
    loadedCache.current.purchaseInvoices = true;
    purchaseInvoiceService.getPurchaseInvoices().then(data => setPurchaseInvoices((data || []).sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))));
  }
  function loadReceipts() {
    loadedCache.current.receipts = true;
    receiptService.getReceipts().then(data => setReceipts(Array.isArray(data) ? data : []));
  }
  function loadInventoryHistory() {
    loadedCache.current.inventoryHistory = true;
    historyService.getInventoryHistory().then(data => setInventoryHistory(Array.isArray(data) ? data : []));
  }
  function loadInvoiceHistory() {
    loadedCache.current.invoiceHistory = true;
    historyService.getInvoiceHistory().then(data => setInvoiceHistory(Array.isArray(data) ? data : []));
  }
  function loadPurchaseInvoiceHistory() {
    loadedCache.current.purchaseInvoiceHistory = true;
    historyService.getPurchaseInvoiceHistory().then(data => setPurchaseInvoiceHistory(Array.isArray(data) ? data : []));
  }
  function loadReceiptHistory() {
    loadedCache.current.receiptHistory = true;
    historyService.getReceiptHistory().then(data => setReceiptHistory(Array.isArray(data) ? data : []));
  }

  function loadHistory() {
    loadInventoryHistory();
    loadInvoiceHistory();
    loadPurchaseInvoiceHistory();
    loadReceiptHistory();
  }

  const ensureLoaded = (key, loaderFn) => {
    if (!loadedCache.current[key]) {
      loaderFn();
    }
  };

  // --- ON-DEMAND CACHED VIEW ENGINE ---
  useEffect(() => {
    if (!isLoggedIn) return;

    switch (view) {
      case 'home':
        ensureLoaded('invoices', loadInvoices);
        break;

      case 'products':
      case 'price-scheduler':
      case 'inventory':
        ensureLoaded('products', loadProducts);
        break;

      case 'inventory-history':
        ensureLoaded('products', loadProducts);
        ensureLoaded('inventoryHistory', loadInventoryHistory);
        break;

      case 'customers-manage':
        ensureLoaded('customers', loadCustomers);
        break;

      case 'vendors-manage':
        ensureLoaded('vendors', loadVendors);
        break;

      case 'employees-manage':
        ensureLoaded('employees', loadEmployees);
        break;

      case 'ledgers':
      case 'ledger-statement':
      case 'receipts':
      case 'receipts-list':
      case 'collections':
        ensureLoaded('customers', loadCustomers);
        ensureLoaded('invoices', loadInvoices);
        ensureLoaded('receipts', loadReceipts);
        break;

      case 'receipt-edit-history':
      case 'receipt-edit-compare':
        ensureLoaded('receiptHistory', loadReceiptHistory);
        break;

      case 'list':
      case 'payment-screen':
      case 'invoices':
      case 'invoice-details':
      case 'return-sale':
      case 'drafts-list':
        ensureLoaded('products', loadProducts);
        ensureLoaded('customers', loadCustomers);
        ensureLoaded('invoices', loadInvoices);
        break;

      case 'edit-history':
      case 'sale-edit-compare':
        ensureLoaded('invoiceHistory', loadInvoiceHistory);
        break;

      case 'purchase-new':
      case 'purchase-summary-screen':
      case 'purchases-list':
      case 'purchase-invoice-details':
        ensureLoaded('products', loadProducts);
        ensureLoaded('vendors', loadVendors);
        ensureLoaded('purchaseInvoices', loadPurchaseInvoices);
        break;

      case 'purchase-edit-history':
      case 'purchase-edit-compare':
        ensureLoaded('purchaseInvoiceHistory', loadPurchaseInvoiceHistory);
        break;

      case 'data-transfer':
        ensureLoaded('customers', loadCustomers);
        ensureLoaded('products', loadProducts);
        break;

      case 'reports':
        ensureLoaded('invoices', loadInvoices);
        ensureLoaded('purchaseInvoices', loadPurchaseInvoices);
        ensureLoaded('products', loadProducts);
        ensureLoaded('customers', loadCustomers);
        ensureLoaded('vendors', loadVendors);
        break;

      default:
        break;
    }
  }, [view, isLoggedIn]);

  const salesStats = useMemo(() => {
    const dailyMap = {}; const weeklyMap = {}; const monthlyMap = {}; const yearlyMap = {};
    invoices.forEach(inv => {
      if (inv.isReturn) return;
      const d = new Date(inv.orderDate);
      const total = inv.finalTotal || inv.totalAmount || 0;
      
      const daySortKey = d.toISOString().split('T')[0]; 
      const startOfWeek = new Date(d); startOfWeek.setDate(d.getDate() - d.getDay());
      const weekSortKey = startOfWeek.toISOString().split('T')[0];
      const monthSortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = d.getFullYear().toString();

      if (!dailyMap[daySortKey]) dailyMap[daySortKey] = { label: d.toLocaleDateString('en-GB'), total: 0 };
      dailyMap[daySortKey].total += total;
      if (!weeklyMap[weekSortKey]) weeklyMap[weekSortKey] = { label: `Week of ${startOfWeek.toLocaleDateString('en-GB')}`, total: 0 };
      weeklyMap[weekSortKey].total += total;
      if (!monthlyMap[monthSortKey]) monthlyMap[monthSortKey] = { label: d.toLocaleString('en-GB', { month: 'short', year: 'numeric' }), total: 0 };
      monthlyMap[monthSortKey].total += total;
      if (!yearlyMap[yearKey]) yearlyMap[yearKey] = { label: yearKey, total: 0 };
      yearlyMap[yearKey].total += total;
    });

    const toSortedArray = (map) => Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).map(entry => entry[1]);
    return { daily: toSortedArray(dailyMap), weekly: toSortedArray(weeklyMap), monthly: toSortedArray(monthlyMap), yearly: toSortedArray(yearlyMap) };
  }, [invoices]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '12345') { setIsLoggedIn(true); setLoginError(''); } 
    else { setLoginError('Invalid username or password'); }
  };

  if (!isLoggedIn) {
    return <Login handleLogin={handleLogin} loginError={loginError} username={username} setUsername={setUsername} password={password} setPassword={setPassword} />;
  }

  return (
    <div className="app-layout">
      <Topbar 
        view={view} 
        setView={setView} 
        draftsCount={JSON.parse(localStorage.getItem('salesDrafts'))?.length || 0} 
        onLogout={() => { 
          setIsLoggedIn(false); 
          setUsername(''); 
          setPassword(''); 
          setView('home'); 
        }} 
      />

      <main className="main-content">
        {view === 'home' && (
          <Dashboard salesStats={salesStats} invoices={invoices} setView={setView} />
        )}
        {['products'].includes(view) && (
          <ProductsManager products={products} loadProducts={loadProducts} loadHistory={loadInventoryHistory} setView={setView} />
        )}
        {['inventory', 'inventory-history'].includes(view) && (
          <InventoryManager view={view} products={products} inventoryHistory={inventoryHistory} loadProducts={loadProducts} loadHistory={loadInventoryHistory} setView={setView} />
        )}
        {['customers-manage'].includes(view) && (
          <CustomerManager customers={customers} loadCustomers={loadCustomers} setView={setView} />
        )}
        {['ledgers', 'ledger-statement'].includes(view) && (
          <LedgerManager view={view} setView={setView} customers={customers} invoices={invoices} receipts={receipts} />
        )}
        {['list', 'payment-screen', 'invoices', 'invoice-details', 'return-sale', 'edit-history', 'sale-edit-compare', 'drafts-list'].includes(view) && (
          <SalesManager view={view} setView={setView} products={products} customers={customers} invoices={invoices} invoiceHistory={invoiceHistory} loadProducts={loadProducts} loadInvoices={loadInvoices} loadHistory={loadInvoiceHistory} loadCustomers={loadCustomers} />
        )}
        {['purchase-new', 'purchase-summary-screen', 'purchases-list', 'purchase-invoice-details', 'purchase-edit-history', 'purchase-edit-compare'].includes(view) && (
          <PurchaseManager view={view} setView={setView} products={products} purchaseInvoices={purchaseInvoices} purchaseInvoiceHistory={purchaseInvoiceHistory} vendors={vendors} loadProducts={loadProducts} loadPurchaseInvoices={loadPurchaseInvoices} loadHistory={loadPurchaseInvoiceHistory} />
        )}
        {['receipts', 'receipts-list', 'receipt-edit-history', 'receipt-edit-compare'].includes(view) && (
          <ReceiptManager view={view} setView={setView} customers={customers} invoices={invoices} receipts={receipts} receiptHistory={receiptHistory} loadCustomers={loadCustomers} loadReceipts={loadReceipts} loadHistory={loadReceiptHistory} />
        )}
        {view === 'data-transfer' && (
          <DataTransfer customers={customers} products={products} loadCustomers={loadCustomers} loadProducts={loadProducts} loadHistory={loadHistory} />
        )}
        {view === 'reports' && (
          <ReportsManager invoices={invoices} purchaseInvoices={purchaseInvoices} products={products} customers={customers} vendors={vendors} />
        )}
        {view === 'settings' && (
          <SettingsManager />
        )}
        {view === 'vendors-manage' && (
          <VendorManager vendors={vendors} loadVendors={loadVendors} setView={setView} />
        )}
        {view === 'employees-manage' && (
          <EmployeeManager employees={employees} loadEmployees={loadEmployees} setView={setView} />
        )}
        {view === 'collections' && (
          <CollectionPlanner customers={customers} invoices={invoices} receipts={receipts} />
        )}
        {view === 'price-scheduler' && (
          <PriceScheduler products={products} loadProducts={loadProducts} loadHistory={loadInventoryHistory} setView={setView} />
        )}
      </main>
    </div>
  );
}