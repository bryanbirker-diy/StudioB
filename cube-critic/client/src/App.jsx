import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BuildPage from './pages/BuildPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import Nav from './components/Nav.jsx';

export default function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<BuildPage />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </div>
    </div>
  );
}
