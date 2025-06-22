import React, { useState, useEffect } from 'react';
import { Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';

const StockManagement = ({ language }) => {
  const [stockItems, setStockItems] = useState([]);
  const [name, setName] = useState('');
  const [nameTamil, setNameTamil] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNameTamil, setEditNameTamil] = useState('');
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    const savedStock = localStorage.getItem('stockItems');
    if (savedStock) {
      setStockItems(JSON.parse(savedStock));
    }
  }, []);

  const saveStockToLocalStorage = (items) => {
    localStorage.setItem('stockItems', JSON.stringify(items));
  };

  const handleAddItem = () => {
    if (name && nameTamil && price) {
      const newItem = {
        id: Date.now(),
        name,
        nameTamil,
        price: parseFloat(price)
      };
      const updatedItems = [...stockItems, newItem];
      setStockItems(updatedItems);
      saveStockToLocalStorage(updatedItems);
      setName('');
      setNameTamil('');
      setPrice('');
    }
  };

  const handleDeleteItem = (id) => {
    const updatedItems = stockItems.filter(item => item.id !== id);
    setStockItems(updatedItems);
    saveStockToLocalStorage(updatedItems);
  };

  const handleEditItem = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditNameTamil(item.nameTamil);
    setEditPrice(item.price);
  };

  const handleSaveEdit = () => {
    const updatedItems = stockItems.map(item => 
      item.id === editingId 
        ? { ...item, name: editName, nameTamil: editNameTamil, price: parseFloat(editPrice) }
        : item
    );
    setStockItems(updatedItems);
    saveStockToLocalStorage(updatedItems);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const translations = {
    english: {
      title: 'Stock Management',
      name: 'Product Name (English)',
      nameTamil: 'Product Name (Tamil)',
      price: 'Price',
      add: 'Add Item',
      actions: 'Actions',
      noItems: 'No stock items available',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
    },
    tamil: {
      title: 'பொருட்கள் மேலாண்மை',
      name: 'பொருள் பெயர் (ஆங்கிலம்)',
      nameTamil: 'பொருள் பெயர் (தமிழ்)',
      price: 'விலை',
      add: 'பொருளை சேர்',
      actions: 'செயல்கள்',
      noItems: 'பொருட்கள் எதுவும் இல்லை',
      edit: 'திருத்து',
      delete: 'நீக்கு',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
    }
  };

  const t = translations[language];

  return (
    <div>
      <h2>{t.title}</h2>
      
      <div className="add-item-form">
        <TextField
          label={t.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t.nameTamil}
          value={nameTamil}
          onChange={(e) => setNameTamil(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t.price}
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddItem}
          style={{ marginTop: '16px' }}
        >
          {t.add}
        </Button>
      </div>

      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t.name}</TableCell>
              <TableCell>{t.nameTamil}</TableCell>
              <TableCell>{t.price}</TableCell>
              <TableCell>{t.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockItems.length > 0 ? (
              stockItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <TextField
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        fullWidth
                      />
                    ) : (
                      item.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <TextField
                        value={editNameTamil}
                        onChange={(e) => setEditNameTamil(e.target.value)}
                        fullWidth
                      />
                    ) : (
                      item.nameTamil
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <TextField
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        type="number"
                        fullWidth
                      />
                    ) : (
                      item.price.toFixed(2)
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <>
                        <IconButton color="primary" onClick={handleSaveEdit}>
                          <SaveIcon />
                        </IconButton>
                        <IconButton color="secondary" onClick={handleCancelEdit}>
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton color="primary" onClick={() => handleEditItem(item)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton color="secondary" onClick={() => handleDeleteItem(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">{t.noItems}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default StockManagement;