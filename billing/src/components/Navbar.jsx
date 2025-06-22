import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = ({ language, shopName }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {shopName}
        </Typography>
        <Button color="inherit" component={Link} to="/">
          {language === 'english' ? 'Billing' : 'பில் செய்தல்'}
        </Button>
        <Button color="inherit" component={Link} to="/stock">
          {language === 'english' ? 'Stock' : 'பொருட்கள்'}
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;