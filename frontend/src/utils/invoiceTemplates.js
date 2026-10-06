export const DEFAULT_SHARED_INFO = {
  gstinText: 'GSTIN: 36AQOPM2633B1ZO',
  businessText: 'Invoice\nRamesh Enterprises\nShop No. 21/B, S.P.T Market, Nalgonda\nrameshenterprises.nalgonda@gmail.com\n9440970457',
  logoUrl: 'https://via.placeholder.com/300x120.png?text=YOUR+LOGO',
  bankText: 'Acc No: 31440400000058\nBank Name: BANK OF BARODA\nBranch Name: NALGONDA\nIFSC: BARB0NALGON',
  termsText: '1. Goods once sold will not be taken back.\n2. Subject to Nalgonda Jurisdiction only.\n3. E. & O.E.'
};

// Helper to convert Final Total into Indian Rupee Words for Tally/Vyapar templates
export function numberToIndianWords(num) {
  const n = Math.round(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (val) => {
    if (val < 20) return ones[val];
    return tens[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + ones[val % 10] : '');
  };

  const threeDigits = (val) => {
    if (val < 100) return twoDigits(val);
    return ones[Math.floor(val / 100)] + ' Hundred' + (val % 100 !== 0 ? ' and ' + twoDigits(val % 100) : '');
  };

  let str = '';
  let rem = n;

  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  if (crore > 0) str += twoDigits(crore) + ' Crore ';
  if (lakh > 0) str += twoDigits(lakh) + ' Lakh ';
  if (thousand > 0) str += twoDigits(thousand) + ' Thousand ';
  if (rem > 0) str += threeDigits(rem) + ' ';

  return 'Rupees ' + str.trim() + ' Only';
}

export const TEMPLATE_PRESETS = {
  // =========================================================================
  // TEMPLATE 1: YOUR ORIGINAL CLASSIC WHOLESALE LAYOUT
  // =========================================================================
  template1: {
    id: 'template1',
    name: 'Template 1: Classic Standard (Current)',
    subtitle: 'Left GSTIN, Centered Business Header, Right Logo & Standard Grid',
    layoutVariant: 'classic',
    accentColor: '#d1d5db',
    headerTextColor: '#000000',
    borderColor: '#000000',
    tableStyle: 'grid',
    gstin: { x: 15, y: 20, width: 220, height: 30, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    business: { x: 209, y: 15, width: 300, height: 90, fontSize: 14, fontFamily: 'Arial, sans-serif', align: 'center' },
    logo: { x: 550, y: 15, width: 150, height: 60 },
    divider1: { x: 0, y: 110, width: 716, type: 'divider' },
    customer: { x: 15, y: 120, width: 400, height: 80, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    meta: { x: 500, y: 120, width: 200, height: 50, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    divider2: { x: 0, y: 200, width: 716, type: 'divider' },
    table: { x: 0, y: 201, width: 716, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    bank: { x: 15, y: 780, width: 280, height: 100, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    summary: { x: 360, y: 780, width: 340, height: 160, fontSize: 12, fontFamily: 'Arial, sans-serif' }
  },

  // =========================================================================
  // TEMPLATE 2: TALLY PRIME / CA MULTI-CELL BOXED ARCHITECTURE
  // =========================================================================
  template2: {
    id: 'template2',
    name: 'Template 2: Tally Prime Boxed Grid',
    subtitle: 'Split Seller/Buyer left column, 4-cell Invoice Meta grid on right & Signatory box',
    layoutVariant: 'tally',
    accentColor: '#f1f5f9',
    headerTextColor: '#000000',
    borderColor: '#000000',
    tableStyle: 'grid',
    logo: { x: 12, y: 12, width: 85, height: 75 },
    business: { x: 102, y: 10, width: 260, height: 82, fontSize: 12, fontFamily: 'Arial, sans-serif', align: 'left' },
    gstin: { x: 102, y: 86, width: 260, height: 22, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    meta: { x: 370, y: 0, width: 346, height: 210, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    divider1: { x: 0, y: 110, width: 370, type: 'divider' },
    customer: { x: 0, y: 111, width: 370, height: 99, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    divider2: { x: 0, y: 210, width: 716, type: 'divider' },
    table: { x: 0, y: 211, width: 716, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    amountWords: { x: 0, y: 775, width: 375, height: 48, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    bank: { x: 0, y: 823, width: 375, height: 95, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    terms: { x: 0, y: 918, width: 375, height: 127, fontSize: 10, fontFamily: 'Arial, sans-serif' },
    summary: { x: 375, y: 775, width: 341, height: 165, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    signature: { x: 375, y: 940, width: 341, height: 105, fontSize: 11, fontFamily: 'Arial, sans-serif' }
  },

  // =========================================================================
  // TEMPLATE 3: CORPORATE SPLIT-HEADER & DUAL BILL-TO / SHIP-TO CARDS
  // =========================================================================
  template3: {
    id: 'template3',
    name: 'Template 3: Corporate Dual-Card (Bill To / Ship To)',
    subtitle: 'Giant Left Title + Meta, Right Company Stack, Dual Customer Cards & Borderless Table',
    layoutVariant: 'corporate',
    accentColor: '#1e293b',
    headerTextColor: '#ffffff',
    borderColor: '#000000',
    tableStyle: 'horizontal',
    meta: { x: 20, y: 18, width: 310, height: 95, fontSize: 12, fontFamily: 'Calibri, sans-serif' },
    logo: { x: 545, y: 14, width: 150, height: 48 },
    business: { x: 380, y: 64, width: 315, height: 60, fontSize: 12, fontFamily: 'Calibri, sans-serif', align: 'right' },
    gstin: { x: 20, y: 108, width: 280, height: 22, fontSize: 11, fontFamily: 'Calibri, sans-serif' },
    divider1: { x: 20, y: 132, width: 676, type: 'divider' },
    customer: { x: 20, y: 142, width: 330, height: 92, fontSize: 12, fontFamily: 'Calibri, sans-serif' },
    shipTo: { x: 366, y: 142, width: 330, height: 92, fontSize: 12, fontFamily: 'Calibri, sans-serif' },
    divider2: { x: 20, y: 242, width: 676, type: 'divider' },
    table: { x: 20, y: 248, width: 676, fontSize: 12, fontFamily: 'Calibri, sans-serif' },
    bank: { x: 20, y: 785, width: 320, height: 105, fontSize: 12, fontFamily: 'Calibri, sans-serif' },
    terms: { x: 20, y: 895, width: 320, height: 95, fontSize: 11, fontFamily: 'Calibri, sans-serif' },
    summary: { x: 376, y: 785, width: 320, height: 155, fontSize: 12, fontFamily: 'Calibri, sans-serif' },
    signature: { x: 376, y: 948, width: 320, height: 80, fontSize: 11, fontFamily: 'Calibri, sans-serif' }
  },

  // =========================================================================
  // TEMPLATE 4: VYAPAR / MARG ERP 3-COLUMN HORIZONTAL STRIP ARCHITECTURE
  // =========================================================================
  template4: {
    id: 'template4',
    name: 'Template 4: Vyapar 3-Column Strip & 3-Box Footer',
    subtitle: 'Top Banner, 3-Column Horizontal Customer/Tax/Invoice Strip & 3-Box Bottom Footer',
    layoutVariant: 'vyapar',
    accentColor: '#e2e8f0',
    headerTextColor: '#000000',
    borderColor: '#000000',
    tableStyle: 'grid',
    logo: { x: 15, y: 15, width: 130, height: 65 },
    business: { x: 160, y: 12, width: 360, height: 78, fontSize: 14, fontFamily: 'Arial, sans-serif', align: 'center' },
    gstin: { x: 530, y: 18, width: 172, height: 55, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    divider1: { x: 0, y: 95, width: 716, type: 'divider' },
    customer: { x: 0, y: 96, width: 260, height: 78, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    shipTo: { x: 260, y: 96, width: 228, height: 78, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    meta: { x: 488, y: 96, width: 228, height: 78, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    divider2: { x: 0, y: 174, width: 716, type: 'divider' },
    table: { x: 0, y: 175, width: 716, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    amountWords: { x: 0, y: 760, width: 410, height: 42, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    bank: { x: 0, y: 802, width: 205, height: 135, fontSize: 11, fontFamily: 'Arial, sans-serif' },
    terms: { x: 205, y: 802, width: 205, height: 135, fontSize: 10, fontFamily: 'Arial, sans-serif' },
    summary: { x: 410, y: 760, width: 306, height: 177, fontSize: 12, fontFamily: 'Arial, sans-serif' },
    signature: { x: 0, y: 937, width: 716, height: 108, fontSize: 11, fontFamily: 'Arial, sans-serif' }
  }
};

export function loadInvoiceSettings() {
  try {
    const savedMulti = localStorage.getItem('invoice_templates_store_v2');
    if (savedMulti) {
      const parsed = JSON.parse(savedMulti);
      return {
        activeTemplateId: parsed.activeTemplateId || 'template1',
        shared: { ...DEFAULT_SHARED_INFO, ...(parsed.shared || {}) },
        templates: {
          template1: { ...TEMPLATE_PRESETS.template1, ...(parsed.templates?.template1 || {}) },
          template2: { ...TEMPLATE_PRESETS.template2, ...(parsed.templates?.template2 || {}) },
          template3: { ...TEMPLATE_PRESETS.template3, ...(parsed.templates?.template3 || {}) },
          template4: { ...TEMPLATE_PRESETS.template4, ...(parsed.templates?.template4 || {}) }
        }
      };
    }

    // Migrate v1 or legacy config into Template 1
    const legacyRaw = localStorage.getItem('invoice_master_config');
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const shared = {
        gstinText: legacy.gstin?.text || DEFAULT_SHARED_INFO.gstinText,
        businessText: legacy.business?.text || DEFAULT_SHARED_INFO.businessText,
        logoUrl: legacy.logo?.url || DEFAULT_SHARED_INFO.logoUrl,
        bankText: legacy.bank?.text || DEFAULT_SHARED_INFO.bankText,
        termsText: DEFAULT_SHARED_INFO.termsText
      };
      return {
        activeTemplateId: 'template1',
        shared,
        templates: { ...TEMPLATE_PRESETS }
      };
    }
  } catch (e) {
    console.error('Error loading invoice settings:', e);
  }

  return {
    activeTemplateId: 'template1',
    shared: { ...DEFAULT_SHARED_INFO },
    templates: { ...TEMPLATE_PRESETS }
  };
}

export function saveInvoiceSettings(store) {
  localStorage.setItem('invoice_templates_store_v2', JSON.stringify(store));
}