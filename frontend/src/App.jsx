import { useState, useEffect } from 'react';
import PDFCard from './components/PDFCard';
import './components/PDFCard.css';
import DarkModeToggle from './components/DarkModeToggle';
import './darkmode.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './App.css';
import './highlight.css';
import PDFViewerWithHighlight from './PDFViewerWithHighlight';

const API_URL = 'http://localhost:5050/api/auth';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [message, setMessage] = useState('');
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [pdfs, setPdfs] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPdfBlob = async (uuid) => {
    try {
      const res = await fetch(`http://localhost:5050/api/pdf/${uuid}`, {
        headers: { Authorization: token }
      });
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/${isLogin ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      if (isLogin) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setMessage('Login successful!');
      } else {
        setMessage('Signup successful! Please log in.');
        setIsLogin(true);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  useEffect(() => {
    if (!token) return;
    const fetchPdfs = async () => {
      setLoadingPdfs(true);
      try {
        const res = await fetch('http://localhost:5050/api/pdf', {
          headers: { Authorization: token }
        });
        const data = await res.json();
        if (res.ok) setPdfs(data);
        else setPdfs([]);
      } catch {
        setPdfs([]);
      }
      setLoadingPdfs(false);
    };
    fetchPdfs();
  }, [token, uploadMsg]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadMsg('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return setUploadMsg('Please select a PDF file.');
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch('http://localhost:5050/api/pdf/upload', {
        method: 'POST',
        headers: { Authorization: token },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setUploadMsg('Upload successful!');
      setSelectedFile(null);
      setTimeout(() => setUploadMsg(''), 3000);
    } catch (err) {
      setUploadMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return token ? (
    <div className="auth-container">
      <DarkModeToggle />
      <h2>Welcome!</h2>
      <button onClick={handleLogout}>Logout</button>

      <form onSubmit={handleUpload} style={{ marginTop: 20 }}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </form>
      {uploadMsg && <p>{uploadMsg}</p>}

      <h3>Your PDFs</h3>
      {loadingPdfs ? <p>Loading PDFs...</p> : (
        <div className="pdf-card-list">
          {pdfs.length === 0 ? (
            <div>No PDFs uploaded yet.</div>
          ) : (
            pdfs.map(pdf => (
              <PDFCard
                key={pdf.uuid}
                pdf={pdf}
                onOpen={async () => {
                  setSelectedPdf(null);
                  setPageNumber(1);
                  const url = await fetchPdfBlob(pdf.uuid);
                  setSelectedPdf({ url, uuid: pdf.uuid });
                }}
                onRename={async () => {
                  const newName = prompt('Enter new name for PDF:', pdf.originalname);
                  if (!newName || newName === pdf.originalname) return;
                  try {
                    const res = await fetch(`http://localhost:5050/api/pdf/${pdf.uuid}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: token
                      },
                      body: JSON.stringify({ newName })
                    });
                    if (!res.ok) throw new Error('Rename failed');
                    setUploadMsg('PDF renamed successfully!');
                    setTimeout(() => setUploadMsg(''), 3000);
                  } catch (err) {
                    setUploadMsg(err.message);
                  }
                }}
                onDelete={async () => {
                  if (!window.confirm('Are you sure you want to delete this PDF?')) return;
                  try {
                    const res = await fetch(`http://localhost:5050/api/pdf/${pdf.uuid}`, {
                      method: 'DELETE',
                      headers: { Authorization: token }
                    });
                    if (!res.ok) throw new Error('Delete failed');
                    setUploadMsg('PDF deleted successfully!');
                    setTimeout(() => setUploadMsg(''), 3000);
                  } catch (err) {
                    setUploadMsg(err.message);
                  }
                }}
              />
            ))
          )}
        </div>
      )}

      {selectedPdf && (
        <PDFViewerWithHighlight
          file={selectedPdf.url}
          pdfUuid={selectedPdf.uuid}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          numPages={numPages}
          setNumPages={setNumPages}
          onClose={() => setSelectedPdf(null)}
        />
      )}
      
      {message && <p>{message}</p>}
    </div>
  ) : (
    <div className="auth-container">
      <DarkModeToggle />
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
      </form>
      <button onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
