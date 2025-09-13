
import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './App.css';
import './highlight.css';

// Set workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// PDF Viewer with basic highlight overlay
function PDFViewerWithHighlight({ file, pageNumber, setPageNumber, numPages, setNumPages, onClose }) {
  const [selection, setSelection] = useState(null);
  const viewerRef = useRef();

  // Mouse up handler to get selection
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const viewerRect = viewerRef.current.getBoundingClientRect();
      setSelection({
        text: sel.toString(),
        x: rect.left - viewerRect.left,
        y: rect.top - viewerRect.top,
        width: rect.width,
        height: rect.height
      });
      sel.removeAllRanges();
    }
  };

  return (
    <div style={{marginTop:20, position:'relative'}} ref={viewerRef} onMouseUp={handleMouseUp}>
      <button onClick={onClose}>Close PDF</button>
      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={console.error}
      >
        <Page pageNumber={pageNumber} />
      </Document>
      {selection && (
        <div
          className="highlight-box"
          style={{ left: selection.x, top: selection.y, width: selection.width, height: selection.height }}
          title={selection.text}
        />
      )}
      <div style={{marginTop:10}}>
        <button onClick={() => setPageNumber(p => Math.max(1, p-1))} disabled={pageNumber <= 1}>Previous</button>
        <span style={{margin:'0 10px'}}>Page {pageNumber} of {numPages}</span>
        <button onClick={() => setPageNumber(p => Math.min(numPages, p+1))} disabled={pageNumber >= numPages}>Next</button>
      </div>
    </div>
  );
}

const API_URL = 'http://localhost:5050/api/auth';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [message, setMessage] = useState('');

  // PDF upload state (already declared above)

  // PDF viewer state
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Fetch PDF blob from backend
  const fetchPdfBlob = async (uuid) => {
    try {
      const res = await fetch(`http://localhost:5050/api/pdf/${uuid}`, {
        headers: { 'Authorization': token }
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
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };


  // PDF upload state

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [pdfs, setPdfs] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(false);

  // Fetch user's PDFs
  useEffect(() => {
    if (!token) return;
    const fetchPdfs = async () => {
      setLoadingPdfs(true);
      try {
        const res = await fetch('http://localhost:5050/api/pdf', {
          headers: { 'Authorization': token }
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
    setUploadMsg('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch('http://localhost:5050/api/pdf/upload', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setUploadMsg('Upload successful!');
      setSelectedFile(null);
    } catch (err) {
      setUploadMsg(err.message);
    }
  };

  if (token) {
    return (
      <div className="auth-container">
        <h2>Welcome!</h2>
        <button onClick={handleLogout}>Logout</button>
        <form onSubmit={handleUpload} style={{ marginTop: 20 }}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <button type="submit">Upload PDF</button>
        </form>
        <p>{uploadMsg}</p>
        <h3>Your PDFs</h3>
        {loadingPdfs ? <p>Loading...</p> : (
          <ul>
            {pdfs.length === 0 && <li>No PDFs uploaded yet.</li>}
            {pdfs.map(pdf => (
              <li key={pdf.uuid}>
                {pdf.originalname} (UUID: {pdf.uuid})
                <button style={{marginLeft:8}} onClick={async () => {
                  setSelectedPdf(null);
                  setPageNumber(1);
                  const url = await fetchPdfBlob(pdf.uuid);
                  setSelectedPdf(url);
                }}>Open</button>
                <button style={{marginLeft:8}} onClick={async () => {
                  const newName = prompt('Enter new name for PDF:', pdf.originalname);
                  if (!newName || newName === pdf.originalname) return;
                  try {
                    const res = await fetch(`http://localhost:5050/api/pdf/${pdf.uuid}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                      },
                      body: JSON.stringify({ newName })
                    });
                    if (!res.ok) throw new Error('Rename failed');
                    setUploadMsg('PDF renamed!');
                  } catch (err) {
                    setUploadMsg(err.message);
                  }
                }}>Rename</button>
                <button style={{marginLeft:8, color:'red'}} onClick={async () => {
                  if (!window.confirm('Are you sure you want to delete this PDF?')) return;
                  try {
                    const res = await fetch(`http://localhost:5050/api/pdf/${pdf.uuid}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': token }
                    });
                    if (!res.ok) throw new Error('Delete failed');
                    setUploadMsg('PDF deleted!');
                  } catch (err) {
                    setUploadMsg(err.message);
                  }
                }}>Delete</button>
              </li>
            ))}
          </ul>
        )}
        {selectedPdf && (
          <PDFViewerWithHighlight
            file={selectedPdf}
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            numPages={numPages}
            setNumPages={setNumPages}
            onClose={() => setSelectedPdf(null)}
          />
        )}
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
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
      <p>{message}</p>
    </div>
  );
}

export default App;
