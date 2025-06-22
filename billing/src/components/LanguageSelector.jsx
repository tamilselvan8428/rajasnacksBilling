import React from 'react';
import { Button, ButtonGroup } from '@mui/material';

const LanguageSelector = ({ language, setLanguage }) => {
  return (
    <div style={{ textAlign: 'right', padding: '10px' }}>
      <ButtonGroup variant="outlined" size="small">
        <Button 
          color={language === 'english' ? 'primary' : 'default'}
          onClick={() => setLanguage('english')}
        >
          English
        </Button>
        <Button 
          color={language === 'tamil' ? 'primary' : 'default'}
          onClick={() => setLanguage('tamil')}
        >
          தமிழ்
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default LanguageSelector;