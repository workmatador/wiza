
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import CreateApplication from './pages/CreateApplication';
import ApplicationDetails from './pages/ApplicationDetails';
import UploadDocuments from './pages/UploadDocuments';
import DocumentManager from './pages/DocumentManager';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Index />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create-application" element={<CreateApplication />} />
          <Route path="application/:id" element={<ApplicationDetails />} />
          <Route path="documents" element={<DocumentManager />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/upload/:token" element={<UploadDocuments />} />
      </Routes>
    </Router>
  );
}

export default App;
