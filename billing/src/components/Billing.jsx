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

const Billing = ({ language = 'english', shopName = 'எங்கள் கடை (Our Shop)' }) => {
  // State variables
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
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
  const anchorRef = useRef(null);
  const billPreviewRef = useRef(null);

  // Load stock items from localStorage
  useEffect(() => {
    const savedStock = localStorage.getItem('stockItems');
    if (savedStock) {
      setStockItems(JSON.parse(savedStock));
    } else {
      // Sample stock items (can be replaced with API call)
      const sampleItems = [
        { id: 1, name: "Rice", nameTamil: "அரிசி", price: 50 },
        { id: 2, name: "Sugar", nameTamil: "சீனி", price: 40 },
        { id: 3, name: "Oil", nameTamil: "எண்ணெய்", price: 120 },
      ];
      setStockItems(sampleItems);
      localStorage.setItem('stockItems', JSON.stringify(sampleItems));
    }
  }, []);

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
    // 1. Load the Tamil font file from the correct path
    const fontPath = '/fonts/NotoSansTamil-Regular.ttf';
    const response = await fetch(fontPath);
    
    if (!response.ok) {
      throw new Error(`Font file not found (HTTP ${response.status}) at ${fontPath}`);
    }
    
    // 2. Convert font to Base64
    const fontData = await response.arrayBuffer();
    const binaryString = Array.from(new Uint8Array(fontData))
      .map(byte => String.fromCharCode(byte))
      .join('');
    const fontBase64 = window.btoa(binaryString);

    // 3. Add font to jsPDF
    doc.addFileToVFS('NotoSansTamil.ttf', fontBase64);
    doc.addFont('NotoSansTamil.ttf', 'NotoSansTamil', 'normal');
    doc.setFont('NotoSansTamil');
    
    // 4. Verify font loaded
    if (!doc.getFontList()['NotoSansTamil']) {
      throw new Error('Font loaded but not available in font list');
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    doc.setFont('helvetica'); // Fallback to built-in font
  }

  // Rest of your PDF generation code remains the same...
  doc.setFontSize(20);
  doc.text(shopName, 105, 20, { align: 'center' });
  
  // Bill title
  doc.setFontSize(16);
  doc.text('பில்', 105, 30, { align: 'center' });

  // Customer details
  doc.setFontSize(12);
  doc.text(`வாடிக்கையாளர்: ${customerName}`, 20, 40);
  doc.text(`மொபைல் எண்: ${mobileNumber}`, 20, 50);
  doc.text(`தேதி: ${date}`, 20, 60);

  // Prepare table data
  const tableData = billItems.map((item, index) => [
    index + 1,
    item.productNameTamil || item.productName,
    item.quantity,
    `₹${item.price.toFixed(2)}`,
    `₹${item.total.toFixed(2)}`
  ]);

  // Generate the table
  autoTable(doc, {
    head: [['வ.எண்', 'பொருள்', 'அளவு', 'விலை', 'மொத்தம்']],
    body: tableData,
    startY: 70,
    styles: { 
      font: doc.getFont().fontName,
      fontSize: 10,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    headStyles: { 
      fillColor: [22, 160, 133],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { halign: 'center' }, // Serial number
      2: { halign: 'center' }, // Quantity
      3: { halign: 'right' },  // Price
      4: { halign: 'right' }   // Total
    }
  });

  // Calculate and display total
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('மொத்த தொகை:', 140, finalY);
  doc.text(`₹${calculateTotal().toFixed(2)}`, 170, finalY);

  // Thank you message
  doc.setFontSize(12);
  doc.text('உங்கள் வாங்குதலுக்கு நன்றி!', 105, finalY + 20, { align: 'center' });

  // Save the PDF
  doc.save(`${customerName}_${date}_bill.pdf`);
};

  // Print bill
  const handlePrint = useReactToPrint({
    content: () => billPreviewRef.current,
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
  };

  // Close search suggestions
  const handleCloseSuggestions = () => {
    setOpenSuggestions(false);
  };

  // Translations (English & Tamil)
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
            InputProps={{
              endAdornment: searchQuery && (
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedItem(null);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }}
          />
        </div>

        {/* Search Suggestions */}
        <Popper
          open={openSuggestions && filteredItems.length > 0}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-start"
          style={{ zIndex: 1, width: anchorRef.current?.clientWidth }}
        >
          <ClickAwayListener onClickAway={handleCloseSuggestions}>
            <Paper>
              <MenuList autoFocusItem={openSuggestions}>
                {filteredItems.map(item => (
                  <MenuItem
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
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
          </ClickAwayListener>
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
            onClick={handlePrint}
            disabled={billItems.length === 0 || !customerName || !mobileNumber}
          >
            {t.printBill}
          </Button>
        </div>
      )}

      {/* Hidden Bill Preview for Printing */}
      <div style={{ display: 'none' }}>
        <div ref={billPreviewRef} style={{ padding: '20px' }}>
          <h2 style={{ textAlign: 'center' }}>{shopName}</h2>
          <h3 style={{ textAlign: 'center' }}>BILL</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Customer:</strong> {customerName}</p>
            <p><strong>Mobile:</strong> {mobileNumber}</p>
            <p><strong>Date:</strong> {date}</p>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>S.No</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Product</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Qty</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Price</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{index + 1}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.productName}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <h3>Grand Total: ₹{calculateTotal().toFixed(2)}</h3>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p>Thank you for your purchase!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;