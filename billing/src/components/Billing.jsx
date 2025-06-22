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

const Billing = ({ language = 'tamil', shopName = 'எங்கள் கடை / Our Shop' }) => {
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

  useEffect(() => {
    const savedStock = localStorage.getItem('stockItems');
    if (savedStock) {
      setStockItems(JSON.parse(savedStock));
    }
  }, []);

  const filteredItems = stockItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.nameTamil && item.nameTamil.includes(searchQuery))
  );

  const handleAddItem = () => {
    if (selectedItem) {
      const newItem = {
        id: Date.now(),
        productId: selectedItem.id,
        productName: selectedItem.name,
        productNameTamil: selectedItem.nameTamil || selectedItem.name,
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

  const handleRemoveItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setEditQuantity(item.quantity);
    setEditPrice(item.price);
  };

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

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + item.total, 0);
  };

  const generatePDF = () => {
    if (billItems.length === 0) {
      alert(language === 'english' ? 'No items to generate PDF!' : 'PDF உருவாக்க பொருட்கள் இல்லை!');
      return;
    }
    if (!customerName || !mobileNumber) {
      alert(language === 'english' ? 'Please enter customer name and mobile number!' : 'வாடிக்கையாளர் பெயர் மற்றும் மொபைல் எண்ணை உள்ளிடவும்!');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(
      language === 'english' ? shopName.split(' / ')[1] || shopName : shopName.split(' / ')[0], 
      105, 20, { align: 'center' }
    );
    
    doc.setFontSize(16);
    doc.text(
      language === 'english' ? 'BILL' : 'பில்', 
      105, 30, { align: 'center' }
    );

    // Customer details
    doc.setFontSize(12);
    doc.text(
      language === 'english' ? `Customer: ${customerName}` : `வாடிக்கையாளர்: ${customerName}`, 
      20, 40
    );
    doc.text(
      language === 'english' ? `Mobile: ${mobileNumber}` : `மொபைல் எண்: ${mobileNumber}`, 
      20, 50
    );
    doc.text(
      language === 'english' ? `Date: ${date}` : `தேதி: ${date}`, 
      20, 60
    );

    // Table data
    const tableData = billItems.map((item, index) => [
      index + 1,
      language === 'english' ? item.productName : item.productNameTamil,
      item.quantity,
      `₹${item.price.toFixed(2)}`,
      `₹${item.total.toFixed(2)}`
    ]);

    // Add table using autoTable
    autoTable(doc, {
      head: [
        [
          language === 'english' ? 'S.No' : 'வ.எண்',
          language === 'english' ? 'Product' : 'பொருள்',
          language === 'english' ? 'Qty' : 'அளவு',
          language === 'english' ? 'Price' : 'விலை',
          language === 'english' ? 'Total' : 'மொத்தம்'
        ]
      ],
      body: tableData,
      startY: 70,
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] }
    });

    // Total
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(
      language === 'english' ? 'Grand Total:' : 'மொத்த தொகை:', 
      140, finalY
    );
    doc.text(`₹${calculateTotal().toFixed(2)}`, 170, finalY);

    // Thank you message
    doc.setFontSize(12);
    doc.text(
      language === 'english' ? 'Thank you for your purchase!' : 'உங்கள் வாங்குதலுக்கு நன்றி!', 
      105, finalY + 20, { align: 'center' }
    );

    doc.save(`${customerName}_${date}_bill.pdf`);
  };

  const handlePrint = useReactToPrint({
    content: () => billPreviewRef.current,
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setOpenSuggestions(e.target.value.length > 0);
    if (!e.target.value) {
      setSelectedItem(null);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery(language === 'english' ? item.name : item.nameTamil || item.name);
    setOpenSuggestions(false);
  };

  const handleCloseSuggestions = () => {
    setOpenSuggestions(false);
  };

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
      saveBill: 'Save Bill',
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
      addItem: 'பொருளை சேர்',
      printBill: 'பில்லை அச்சிடு',
      saveBill: 'பில்லை சேமி',
      action: 'செயல்',
      noItems: 'பில்லில் பொருட்கள் சேர்க்கப்படவில்லை',
      totalAmount: 'மொத்த தொகை',
      searchProducts: 'பொருட்களை தேடு',
      noProductsFound: 'பொருட்கள் எதுவும் கிடைக்கவில்லை'
    }
  };

  const t = translations[language];

  return (
    <div style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
      <h2>{language === 'english' ? 'Billing' : 'பில் செய்தல்'}</h2>
      
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
                    style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>
                        {language === 'english' ? item.name : item.nameTamil || item.name}
                      </span>
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
                    {language === 'english' ? item.productName : item.productNameTamil}
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
                          {language === 'english' ? 'Save' : 'சேமி'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                        >
                          {language === 'english' ? 'Cancel' : 'ரத்து செய்'}
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
                          {language === 'english' ? 'Edit' : 'திருத்து'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          {language === 'english' ? 'Remove' : 'நீக்கு'}
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

      {billItems.length > 0 && (
        <div className="bill-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <h3 style={{ flexGrow: 1 }}>
            {t.totalAmount}: ₹{calculateTotal().toFixed(2)}
          </h3>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<PdfIcon />}
            onClick={generatePDF}
            disabled={!customerName || !mobileNumber}
          >
            {language === 'english' ? 'Download PDF' : 'PDF பதிவிறக்கு'}
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

      {/* Hidden Bill Preview for printing */}
      <div style={{ display: 'none' }}>
        <div ref={billPreviewRef} style={{ padding: '20px', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
          <h2 style={{ textAlign: 'center' }}>
            {language === 'english' ? shopName.split(' / ')[1] || shopName : shopName.split(' / ')[0]}
          </h2>
          <h3 style={{ textAlign: 'center' }}>
            {language === 'english' ? 'BILL' : 'பில்'}
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <p>
              <strong>{language === 'english' ? 'Customer:' : 'வாடிக்கையாளர்:'}</strong> {customerName}
            </p>
            <p>
              <strong>{language === 'english' ? 'Mobile:' : 'மொபைல் எண்:'}</strong> {mobileNumber}
            </p>
            <p>
              <strong>{language === 'english' ? 'Date:' : 'தேதி:'}</strong> {date}
            </p>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>
                  {language === 'english' ? 'S.No' : 'வ.எண்'}
                </th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>
                  {language === 'english' ? 'Product' : 'பொருள்'}
                </th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>
                  {language === 'english' ? 'Qty' : 'அளவு'}
                </th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>
                  {language === 'english' ? 'Price' : 'விலை'}
                </th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>
                  {language === 'english' ? 'Total' : 'மொத்தம்'}
                </th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{index + 1}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    {language === 'english' ? item.productName : item.productNameTamil}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{item.price.toFixed(2)}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <h3>
              {language === 'english' ? 'Grand Total:' : 'மொத்த தொகை:'} ₹{calculateTotal().toFixed(2)}
            </h3>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p>{language === 'english' ? 'Thank you for your purchase!' : 'உங்கள் வாங்குதலுக்கு நன்றி!'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;