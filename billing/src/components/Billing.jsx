import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, TextField, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, 
  Popper, MenuItem, MenuList, ClickAwayListener,
  IconButton
} from '@mui/material';
import { 
  Print as PrintIcon, Add as AddIcon, 
  Delete as DeleteIcon, Edit as EditIcon, 
  Save as SaveIcon, Cancel as CancelIcon, 
  PictureAsPdf as PdfIcon, Close as CloseIcon
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Billing = ({ language = 'english', shopName = 'ராஜா ஸ்நாக்ஸ் (RAJA SNACKS)' }) => {
  // State variables
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockItems, setStockItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [billItems, setBillItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [printError, setPrintError] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const anchorRef = useRef(null);
  const billPreviewRef = useRef(null);

  // Load stock items from localStorage
  useEffect(() => {
    const savedStock = localStorage.getItem('stockItems');
    if (savedStock) {
      setStockItems(JSON.parse(savedStock));
    } else {
      alert('No stock items found! Please add items to the stock management section.');
    }
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && anchorRef.current) {
      const menuItems = anchorRef.current.querySelectorAll('.MuiMenuItem-root');
      if (menuItems[highlightedIndex]) {
        menuItems[highlightedIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [highlightedIndex]);

  // Filter items based on search query
  const filteredItems = stockItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.nameTamil && item.nameTamil.includes(searchQuery))
  );

  const styles = {
    tamilFont: {
      fontFamily: "'Noto Sans Tamil', sans-serif",
      direction: 'ltr',
      unicodeBidi: 'embed'
    }
  };

  // Add item to bill
  const handleAddItem = () => {
    if (selectedItem) {
      const newItem = {
        id: Date.now(),
        productId: selectedItem.id,
        productName: selectedItem.name,
        productNameTamil: selectedItem.nameTamil,
        quantity: quantity,
        price: selectedItem.price,
        total: quantity * selectedItem.price
      };
      setBillItems([...billItems, newItem]);
      setQuantity(1);
      setSelectedItem(null);
      setSearchQuery('');
      setOpenSuggestions(false);
    }
  };

  // Remove item from bill
  const handleRemoveItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  };

  // Edit item in bill
  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setEditQuantity(item.quantity);
    setEditPrice(item.price);
  };

  // Save edited item
  const handleSaveEdit = () => {
    setBillItems(billItems.map(item => 
      item.id === editingItemId
        ? { 
            ...item, 
            quantity: editQuantity,
            price: parseFloat(editPrice),
            total: editQuantity * parseFloat(editPrice)
          }
        : item
    ));
    setEditingItemId(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  // Calculate total bill amount
  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + item.total, 0);
  };

  // Generate Tamil PDF bill
  const generateTamilPDF = async () => {
    if (billItems.length === 0) {
      alert('No items to generate PDF!');
      return;
    }
    if (!customerName || !mobileNumber) {
      alert('Please enter customer name and mobile number!');
      return;
    }

    const doc = new jsPDF();

    try {
      const fontPath = '/fonts/NotoSansTamil-Regular.ttf';
      const response = await fetch(fontPath);
      
      if (!response.ok) {
        throw new Error(`Font file not found (HTTP ${response.status})`);
      }
      
      const fontData = await response.arrayBuffer();
      const binaryString = Array.from(new Uint8Array(fontData))
        .map(byte => String.fromCharCode(byte))
        .join('');
      const fontBase64 = window.btoa(binaryString);

      doc.addFileToVFS('NotoSansTamil.ttf', fontBase64);
      doc.addFont('NotoSansTamil.ttf', 'NotoSansTamil', 'normal');
      doc.setFont('NotoSansTamil', 'normal');
    } catch (error) {
      console.error('Font loading error:', error);
      doc.setFont('helvetica');
    }

    doc.setProperties({
      title: `Bill for ${customerName}`,
      subject: 'Invoice',
      author: shopName,
      keywords: 'invoice, bill, tamil'
    });

    doc.setFontSize(20);
    doc.text(shopName, 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('பில்', 105, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`வாடிக்கையாளர்: ${customerName}`, 20, 40);
    doc.text(`மொபைல் எண்: ${mobileNumber}`, 20, 50);
    doc.text(`தேதி: ${date}`, 20, 60);

    const tableData = billItems.map((item, index) => [
      index + 1,
      item.productNameTamil || item.productName,
      item.quantity,
      `₹${item.price.toFixed(2)}`,
      `₹${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['வ.எண்', 'பொருள்', 'அளவு', 'விலை', 'மொத்தம்']],
      body: tableData,
      startY: 70,
      styles: { 
        font: 'NotoSansTamil',
        fontStyle: 'normal',
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: { 
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('மொத்த தொகை:', 105, finalY);
    doc.text(`₹${calculateTotal().toFixed(2)}`, 170, finalY);

    doc.setFontSize(12);
    doc.text('உங்கள் வாங்குதலுக்கு நன்றி!', 105, finalY + 20, { align: 'center' });

    doc.save(`${customerName}_${date}_bill.pdf`);
  };

  // Print bill
  const handlePrint = useReactToPrint({
    content: () => {
      if (!billPreviewRef.current) {
        console.error("Print content not found");
        setPrintError('Print content not ready. Please try again.');
        return null;
      }
      return billPreviewRef.current;
    },
    onBeforeGetContent: () => {
      if (billItems.length === 0) {
        setPrintError('No items to print!');
        return false;
      }
      if (!customerName || !mobileNumber) {
        setPrintError('Please enter customer details!');
        return false;
      }
      setPrintError(null);
      return true;
    },
    onPrintError: (error) => {
      console.error('Printing error:', error);
      let errorMessage = 'Printing failed. Please try again.';
      
      if (error.message.includes('contentRef')) {
        errorMessage = 'Print content not available';
      } else if (error.message.includes('print')) {
        errorMessage = 'Printer not available or error occurred';
      }
      
      setPrintError(errorMessage);
    },
    onAfterPrint: () => {
      console.log('Print completed or dialog closed');
      setIsPrinting(false);
    }
  });

  // Search product functionality
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setOpenSuggestions(e.target.value.length > 0);
    if (!e.target.value) {
      setSelectedItem(null);
    }
  };

  // Select product from search results
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setOpenSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Close search suggestions
  const handleCloseSuggestions = () => {
    setOpenSuggestions(false);
  };

  // Translations
  const translations = {
    english: {
      customerName: 'Customer Name',
      mobileNumber: 'Mobile Number',
      date: 'Date',
      product: 'Product',
      quantity: 'Quantity',
      price: 'Price',
      total: 'Total',
      addItem: 'Add Item',
      printBill: 'Print Bill',
      downloadTamilPdf: 'Download Tamil PDF',
      action: 'Action',
      noItems: 'No items added to bill',
      totalAmount: 'Total Amount',
      searchProducts: 'Search Products',
      noProductsFound: 'No products found'
    },
    tamil: {
      customerName: 'வாடிக்கையாளர் பெயர்',
      mobileNumber: 'மொபைல் எண்',
      date: 'தேதி',
      product: 'பொருள்',
      quantity: 'அளவு',
      price: 'விலை',
      total: 'மொத்தம்',
      addItem: 'சேர்க்க',
      printBill: 'அச்சிடு',
      downloadTamilPdf: 'டவுன்லோட் (Tamil PDF)',
      action: 'செயல்',
      noItems: 'பில் உருப்படிகள் இல்லை',
      totalAmount: 'மொத்த தொகை',
      searchProducts: 'தேடுதல்',
      noProductsFound: 'பொருட்கள் இல்லை'
    }
  };

  const t = translations[language];

  // Bill Preview Component
  const BillPreview = React.forwardRef((props, ref) => {
    const { 
      shopName, 
      customerName, 
      mobileNumber, 
      date, 
      billItems = [], 
      total = 0, 
      language = 'english' 
    } = props;

    const translations = {
      english: {
        bill: 'BILL',
        customer: 'Customer',
        mobile: 'Mobile',
        date: 'Date',
        sno: 'S.No',
        product: 'Product',
        quantity: 'Qty',
        price: 'Price',
        total: 'Total',
        grandTotal: 'Grand Total',
        thankYou: 'Thank you for your purchase!'
      },
      tamil: {
        bill: 'பில்',
        customer: 'வாடிக்கையாளர்',
        mobile: 'மொபைல் எண்',
        date: 'தேதி',
        sno: 'வ.எண்',
        product: 'பொருள்',
        quantity: 'அளவு',
        price: 'விலை',
        total: 'மொத்தம்',
        grandTotal: 'மொத்த தொகை',
        thankYou: 'உங்கள் வாங்குதலுக்கு நன்றி!'
      }
    };

    const t = translations[language] || translations.english;

    return (
      <div ref={ref} style={{ padding: '20px', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
        <h2 style={{ textAlign: 'center' }}>{shopName}</h2>
        <h3 style={{ textAlign: 'center' }}>{t.bill}</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p><strong>{t.customer}:</strong> {customerName}</p>
          <p><strong>{t.mobile}:</strong> {mobileNumber}</p>
          <p><strong>{t.date}:</strong> {date}</p>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{t.sno}</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{t.product}</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{t.quantity}</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{t.price}</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>{t.total}</th>
            </tr>
          </thead>
          <tbody>
            {billItems.length > 0 ? (
              billItems.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{index + 1}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {language === 'tamil' ? (item.productNameTamil || item.productName) : item.productName}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{item.total.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '8px' }}>
                  No items to print
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <h3>{t.grandTotal}: ₹{total.toFixed(2)}</h3>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p>{t.thankYou}</p>
        </div>
      </div>
    );
  });

  return (
    <div style={{ fontFamily: "'Noto Sans Tamil', 'Roboto', sans-serif", padding: '20px' }}>
      <h2>Billing System</h2>
      
      {/* Customer Details */}
      <div className="customer-details">
        <TextField
          label={t.customerName}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label={t.mobileNumber}
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label={t.date}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </div>

      {/* Product Search & Add */}
      <div className="add-items" style={{ marginTop: '20px', position: 'relative' }}>
        <div ref={anchorRef}>
          <TextField
            label={t.searchProducts}
            value={searchQuery}
            onChange={handleSearchChange}
            fullWidth
            margin="normal"
            autoComplete="off"
            inputRef={(input) => {
              if (input) {
                input.addEventListener('blur', (e) => {
                  if (!e.relatedTarget || !e.relatedTarget.closest('.MuiPopper-root')) {
                    setOpenSuggestions(false);
                  }
                });
              }
            }}
            InputProps={{
              endAdornment: searchQuery && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedItem(null);
                    setOpenSuggestions(false);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }}
            onKeyDown={(e) => {
              if (filteredItems.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedIndex(prev => 
                    prev >= filteredItems.length - 1 ? 0 : prev + 1
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedIndex(prev => 
                    prev <= 0 ? filteredItems.length - 1 : prev - 1
                  );
                } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                  e.preventDefault();
                  handleSelectItem(filteredItems[highlightedIndex]);
                } else if (e.key === 'Escape') {
                  setOpenSuggestions(false);
                }
              }
            }}
          />
        </div>

        {/* Search Suggestions */}
        <Popper
          open={openSuggestions && filteredItems.length > 0}
          anchorEl={anchorRef.current}
          role="listbox"
          placement="bottom-start"
          style={{ 
            zIndex: 1, 
            width: anchorRef.current?.clientWidth,
            maxHeight: '300px',
            overflow: 'auto'
          }}
          disableAutoFocus
          disableEnforceFocus
          modifiers={[
            {
              name: 'preventOverflow',
              options: {
                padding: 8,
              },
            },
          ]}
        >
          <Paper elevation={3}>
            <MenuList 
              autoFocus={false}
              disablePadding
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpenSuggestions(false);
                }
              }}
            >
              {filteredItems.map((item, index) => (
                <MenuItem
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  selected={highlightedIndex === index}
                  style={{
                    backgroundColor: highlightedIndex === index ? '#f5f5f5' : 'transparent',
                    padding: '8px 16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{item.name} ({item.nameTamil})</span>
                    <span style={{ color: '#666', marginLeft: '10px' }}>
                      ₹{item.price.toFixed(2)}
                    </span>
                  </div>
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </Popper>

        {/* Quantity Input */}
        {selectedItem && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <TextField
              label={t.quantity}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '100px', marginRight: '10px' }}
              size="small"
            />
            <span>= ₹{(quantity * selectedItem.price).toFixed(2)}</span>
          </div>
        )}

        {/* Add Item Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
          disabled={!selectedItem}
          fullWidth
          style={{ marginTop: '10px' }}
        >
          {t.addItem}
        </Button>
      </div>

      {/* Bill Items Table */}
      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t.product}</TableCell>
              <TableCell>{t.quantity}</TableCell>
              <TableCell>{t.price}</TableCell>
              <TableCell>{t.total}</TableCell>
              <TableCell>{t.action}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billItems.length > 0 ? (
              billItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {language === 'tamil' ? (item.productNameTamil || item.productName) : item.productName}
                  </TableCell>
                  <TableCell>
                    {editingItemId === item.id ? (
                      <TextField
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        size="small"
                      />
                    ) : (
                      item.quantity
                    )}
                  </TableCell>
                  <TableCell>
                    {editingItemId === item.id ? (
                      <TextField
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Math.max(0, parseFloat(e.target.value)) || 0)}
                        size="small"
                      />
                    ) : (
                      `₹${item.price.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>₹{item.total.toFixed(2)}</TableCell>
                  <TableCell>
                    {editingItemId === item.id ? (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveEdit}
                          style={{ marginRight: '5px' }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditItem(item)}
                          style={{ marginRight: '5px' }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t.noItems}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bill Actions (Total, Print, PDF) */}
      {billItems.length > 0 && (
        <div className="bill-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <h3 style={{ flexGrow: 1 }}>
            {t.totalAmount}: ₹{calculateTotal().toFixed(2)}
          </h3>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<PdfIcon />}
            onClick={generateTamilPDF}
            disabled={!customerName || !mobileNumber}
          >
            {t.downloadTamilPdf}
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PrintIcon />}
            onClick={() => {
              if (billItems.length === 0) {
                setPrintError('No items to print!');
                return;
              }
              if (!customerName || !mobileNumber) {
                setPrintError('Please enter customer details!');
                return;
              }
              handlePrint();
            }}
            disabled={isPrinting}
          >
            {isPrinting ? 'Printing...' : t.printBill}
          </Button>
        </div>
      )}

      {/* Error message for printing */}
      {printError && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {printError}
        </div>
      )}

      {/* Hidden Bill Preview for Printing */}
      <div style={{ display: 'none' }}>
        <BillPreview 
          ref={billPreviewRef}
          shopName={shopName}
          customerName={customerName}
          mobileNumber={mobileNumber}
          date={date}
          billItems={billItems}
          total={calculateTotal()}
          language={language}
        />
      </div>
    </div>
  );
};

export default Billing;