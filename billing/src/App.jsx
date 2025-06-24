import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Billing from './components/Billing';
import StockManagement from './components/StockManagement';
import LanguageSelector from './components/LanguageSelector';
import './App.css';

function App() {
  const [language, setLanguage] = useState('english');
  const [shopName, setShopName] = useState('ராஜா ஸ்நாக்ஸ் /RAJA SNACKS');

  return (
    <Router>
      <div className="App">
        <LanguageSelector language={language} setLanguage={setLanguage} />
        <Navbar language={language} shopName={shopName} />
        <div className="container">
          <Routes>
            <Route path="/" element={<Billing language={language} shopName={shopName} />} />
            <Route path="/stock" element={<StockManagement language={language} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;