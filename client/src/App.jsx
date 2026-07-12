/* App — root component with routing, admin upload, and heart physics */
import { Routes, Route } from 'react-router-dom';
import { useState, useCallback } from 'react';
import MainLayout from './layouts/main-layout';
import HomePage from './pages/home-page';
import BrowsePage from './pages/browse-page';
import AdminUploadModal from './components/admin-upload-modal';
import HeartPhysicsCanvas from './components/heart-physics-canvas';
import { useKeyboardShortcut } from './hooks/use-keyboard-shortcut';
import { useAdminAuth } from './hooks/use-admin-auth';
import { useDeviceId } from './hooks/use-device-id';
import './app.css';

export default function App() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { isAdmin, promptAdminKey } = useAdminAuth();

  /* Auto-generate device ID on first visit (silent, no login) */
  useDeviceId();

  /* Alt+T: open admin upload modal */
  const handleAdminShortcut = useCallback(() => {
    if (isAdmin) {
      setUploadOpen(true);
    } else {
      const success = promptAdminKey();
      if (success) setUploadOpen(true);
    }
  }, [isAdmin, promptAdminKey]);

  useKeyboardShortcut('t', handleAdminShortcut, { alt: true });

  return (
    <>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse/:type" element={<BrowsePage />} />
        </Routes>
      </MainLayout>

      {/* Admin upload modal (global overlay) */}
      <AdminUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      {/* Heart physics — persistent overlay */}
      <HeartPhysicsCanvas />
    </>
  );
}
