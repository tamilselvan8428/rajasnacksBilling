import React from 'react';
import { forwardRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';

const BillPreview = React.forwardRef(({ shopName, customerName, mobileNumber, date, items, total, language }, ref) => {
// Define translations inside the component to ensure they're always available
  const translations = {
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
    },
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
    }
  };

  // Default to Tamil if language is not specified or invalid
  const validLanguage = translations[language] ? language : 'tamil';
  const t = translations[validLanguage];

  return (
    <Paper ref={ref} style={{ padding: '20px', width: '100%', maxWidth: '800px', margin: 'auto', fontFamily: "'Noto Sans Tamil', sans-serif" }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1>{validLanguage === 'tamil' ? shopName.split(' / ')[0] : shopName.split(' / ')[1] || shopName}</h1>
        <h2>{t.bill}</h2>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p><strong>{t.customer}:</strong> {customerName}</p>
          <p><strong>{t.mobile}:</strong> {mobileNumber}</p>
        </div>
        <div>
          <p><strong>{t.date}:</strong> {date}</p>
        </div>
      </div>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t.sno}</TableCell>
            <TableCell>{t.product}</TableCell>
            <TableCell>{t.quantity}</TableCell>
            <TableCell>{t.price}</TableCell>
            <TableCell>{t.total}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{validLanguage === 'tamil' ? item.productNameTamil : item.productName}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>₹{item.price.toFixed(2)}</TableCell>
              <TableCell>₹{item.total.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={4} align="right"><strong>{t.grandTotal}:</strong></TableCell>
            <TableCell><strong>₹{total.toFixed(2)}</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p>{t.thankYou}</p>
      </div>
    </Paper>
  );
});

export default BillPreview;