import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, TextField, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, 
  Select, MenuItem, InputLabel, FormControl 
} from '@mui/material';
import { 
  Print as PrintIcon, Add as AddIcon, 
  Delete as DeleteIcon, Edit as EditIcon, 
  Save as SaveIcon, Cancel as CancelIcon, 
  PictureAsPdf as PdfIcon 
} from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import BillPreview from './BillPreview';

const Billing = ({ language = 'tamil', shopName = 'எங்கள் கடை / Our Shop' }) => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockItems, setStockItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [billItems, setBillItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const billPreviewRef = useRef(null);

  useEffect(() => {
    const savedStock = localStorage.getItem('stockItems');
    if (savedStock) {
      setStockItems(JSON.parse(savedStock));
    }
  }, []);

  const handleAddItem = () => {
    const item = stockItems.find(item => item.id === selectedItem);
    if (item) {
      const newItem = {
        id: Date.now(),
        productId: item.id,
        productName: item.name,
        productNameTamil: item.nameTamil,
        quantity: quantity,
        price: item.price,
        total: quantity * item.price
      };
      setBillItems([...billItems, newItem]);
      setQuantity(1);
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

  // Simplified PDF generation that works with Unicode
  const generatePDF = () => {
    if (billItems.length === 0) {
      alert(language === 'english' ? 'No items to generate PDF!' : 'PDF உருவாக்க பொருட்கள் இல்லை!');
      return;
    }
    if (!customerName || !mobileNumber) {
      alert(language === 'english' ? 'Please enter customer name and mobile number!' : 'வாடிக்கையாளர் பெயர் மற்றும் மொபைல் எண்ணை உள்ளிடவும்!');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
      });

      // Set font (jsPDF now has better Unicode support)
      doc.setFont('helvetica', 'normal');
      
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

      // Table headers
      doc.text(language === 'english' ? 'S.No' : 'வ.எண்', 20, 80);
      doc.text(language === 'english' ? 'Product' : 'பொருள்', 40, 80);
      doc.text(language === 'english' ? 'Qty' : 'அளவு', 100, 80);
      doc.text(language === 'english' ? 'Price' : 'விலை', 130, 80);
      doc.text(language === 'english' ? 'Total' : 'மொத்தம்', 160, 80);

      // Table items
      let y = 90;
      billItems.forEach((item, index) => {
        doc.text((index + 1).toString(), 20, y);
        doc.text(
          language === 'english' ? item.productName : item.productNameTamil, 
          40, y
        );
        doc.text(item.quantity.toString(), 100, y);
        doc.text(`₹${item.price.toFixed(2)}`, 130, y);
        doc.text(`₹${item.total.toFixed(2)}`, 160, y);
        y += 10;
      });

      // Total
      doc.setFontSize(14);
      doc.text(
        language === 'english' ? 'Grand Total:' : 'மொத்த தொகை:', 
        130, y + 10
      );
      doc.text(`₹${calculateTotal().toFixed(2)}`, 160, y + 10);

      // Thank you message
      doc.setFontSize(12);
      doc.text(
        language === 'english' ? 'Thank you for your purchase!' : 'உங்கள் வாங்குதலுக்கு நன்றி!', 
        105, y + 30, { align: 'center' }
      );

      // Save PDF
      doc.save(`${customerName}_${date}_bill.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(language === 'english' ? 'Failed to generate PDF' : 'PDF உருவாக்க தோல்வியடைந்தது');
    }
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    content: () => billPreviewRef.current,
    onBeforeGetContent: () => {
      if (billItems.length === 0) {
        alert(language === 'english' ? 'No items to print!' : 'அச்சிட பொருட்கள் இல்லை!');
        return Promise.reject();
      }
      if (!customerName || !mobileNumber) {
        alert(language === 'english' ? 'Please enter customer name and mobile number!' : 'வாடிக்கையாளர் பெயர் மற்றும் மொபைல் எண்ணை உள்ளிடவும்!');
        return Promise.reject();
      }
      return Promise.resolve();
    },
    onPrintError: (error) => {
      console.error('Printing failed:', error);
      alert(language === 'english' ? 'Printing failed!' : 'அச்சிடுதல் தோல்வியடைந்தது!');
    }
  });

  const saveBill = () => {
    if (!customerName || !mobileNumber) {
      alert(language === 'english' ? 'Please enter customer name and mobile number!' : 'வாடிக்கையாளர் பெயர் மற்றும் மொபைல் எண்ணை உள்ளிடவும்!');
      return;
    }

    const newBill = {
      id: Date.now(),
      customerName,
      mobileNumber,
      date,
      items: billItems,
      total: calculateTotal()
    };
    
    const savedBills = JSON.parse(localStorage.getItem('bills') || '[]');
    localStorage.setItem('bills', JSON.stringify([...savedBills, newBill]));
    
    setCustomerName('');
    setMobileNumber('');
    setBillItems([]);
    setEditingItemId(null);
    alert(language === 'english' ? 'Bill saved successfully!' : 'பில் வெற்றிகரமாக சேமிக்கப்பட்டது!');
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
          inputProps={{ style: { fontFamily: "'Noto Sans Tamil', sans-serif" } }}
        />
        <TextField
          label={t.mobileNumber}
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          fullWidth
          margin="normal"
          required
          inputProps={{ style: { fontFamily: "'Noto Sans Tamil', sans-serif" } }}
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
          inputProps={{ style: { fontFamily: "'Noto Sans Tamil', sans-serif" } }}
        />
      </div>

      <div className="add-items">
        <FormControl fullWidth margin="normal">
          <InputLabel style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
            {t.product}
          </InputLabel>
          <Select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            label={t.product}
            inputProps={{ style: { fontFamily: "'Noto Sans Tamil', sans-serif" } }}
          >
            {stockItems.map(item => (
              <MenuItem 
                key={item.id} 
                value={item.id}
                style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
              >
                {language === 'english' ? item.name : item.nameTamil}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          label={t.quantity}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          fullWidth
          margin="normal"
          inputProps={{ style: { fontFamily: "'Noto Sans Tamil', sans-serif" } }}
        />
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
          style={{ marginTop: '16px', fontFamily: "'Noto Sans Tamil', sans-serif" }}
        >
          {t.addItem}
        </Button>
      </div>

      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 'bold' }}>#</TableCell>
              <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 'bold' }}>{t.product}</TableCell>
              <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 'bold' }}>{t.quantity}</TableCell>
              <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 'bold' }}>{t.price}</TableCell>
              <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 'bold' }}>{t.total}</TableCell>
              <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontWeight: 'bold' }}>{t.action}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billItems.length > 0 ? (
              billItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>{index + 1}</TableCell>
                  <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                    {language === 'english' ? item.productName : item.productNameTamil}
                  </TableCell>
                  <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                    {editingItemId === item.id ? (
                      <TextField
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                        size="small"
                        inputProps={{ style: { fontFamily: "'Noto Sans Tamil', sans-serif" } }}
                      />
                    ) : (
                      item.quantity
                    )}
                  </TableCell>
                  <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                    {editingItemId === item.id ? (
                      <TextField
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ style: { fontFamily: "'Noto Sans Tamil', sans-serif" } }}
                      />
                    ) : (
                      item.price.toFixed(2)
                    )}
                  </TableCell>
                  <TableCell style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                    {item.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {editingItemId === item.id ? (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveEdit}
                          style={{ marginRight: '5px', fontFamily: "'Noto Sans Tamil', sans-serif" }}
                        >
                          {language === 'english' ? 'Save' : 'சேமி'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                          style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
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
                          style={{ marginRight: '5px', fontFamily: "'Noto Sans Tamil', sans-serif" }}
                        >
                          {language === 'english' ? 'Edit' : 'திருத்து'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveItem(item.id)}
                          style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
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
                <TableCell 
                  colSpan={6} 
                  align="center"
                  style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
                >
                  {t.noItems}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {billItems.length > 0 && (
        <div className="bill-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <h3 style={{ 
            flexGrow: 1, 
            fontFamily: "'Noto Sans Tamil', sans-serif" 
          }}>
            {t.totalAmount}: ₹{calculateTotal().toFixed(2)}
          </h3>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<PdfIcon />}
            onClick={generatePDF}
            disabled={!customerName || !mobileNumber}
            style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
          >
            {language === 'english' ? 'Download PDF' : 'PDF பதிவிறக்கு'}
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={billItems.length === 0 || !customerName || !mobileNumber}
            style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
          >
            {t.printBill}
          </Button>
          
          <Button
            variant="contained"
            color="success"
            onClick={saveBill}
            disabled={!customerName || !mobileNumber}
            style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
          >
            {t.saveBill}
          </Button>
        </div>
      )}

      {/* Hidden Bill Preview for printing */}
      <div style={{ display: 'none' }}>
        <BillPreview
          ref={billPreviewRef}
          shopName={shopName}
          customerName={customerName}
          mobileNumber={mobileNumber}
          date={date}
          items={billItems}
          total={calculateTotal()}
          language={language}
        />
      </div>
    </div>
  );
};

export default Billing;