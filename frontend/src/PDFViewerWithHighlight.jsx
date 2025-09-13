import { useState, useRef, useEffect } from 'react';
import { pdfjs } from 'react-pdf';

// Fix CORS and Worker issues for Vite + pdfjs-dist v5+
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

import { Document, Page } from 'react-pdf';

export default function PDFViewerWithHighlight({
  file,
  pdfUuid: pdfUuidProp,
  pageNumber,
  setPageNumber,
  numPages,
  setNumPages,
  onClose
}) {
  function extractPdfUuid(file) {
    const match = file && file.match(
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
    );
    return match ? match[0] : null;
  }

  const [highlights, setHighlights] = useState([]);
  const [scale, setScale] = useState(1.0);
  const [message, setMessage] = useState('');
  const viewerRef = useRef();
  const token = localStorage.getItem('token');
  const pdfUuid = pdfUuidProp || extractPdfUuid(file);

  useEffect(() => {
    if (!pdfUuid || !token) return;
    fetch(`http://localhost:5050/api/highlight/${pdfUuid}`, {
      headers: { Authorization: token }
    })
      .then(res => res.json())
      .then(data => setHighlights(Array.isArray(data) ? data : []))
      .catch(() => setHighlights([]));
  }, [pdfUuid, token]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const canvas = viewerRef.current.querySelector('canvas');
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();

      const newHighlight = {
        pdf: pdfUuid,
        page: pageNumber,
        text: sel.toString(),
        boundingBox: {
          x: (rect.left - canvasRect.left) / scale,
          y: (rect.top - canvasRect.top) / scale,
          width: rect.width / scale,
          height: rect.height / scale
        },
        timestamp: new Date().toISOString()
      };

      fetch('http://localhost:5050/api/highlight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify(newHighlight)
      })
        .then(res => res.json())
        .then(saved => {
          setHighlights(hs => [...hs, saved]);
          setMessage('Highlight added!');
          setTimeout(() => setMessage(''), 2000);
        })
        .catch(() => {});

      sel.removeAllRanges();
    }
  };

  const handleRemoveHighlight = (id) => {
    if (!window.confirm('Are you sure you want to remove this highlight?')) return;

    fetch(`http://localhost:5050/api/highlight/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token }
    })
      .then(res => {
        if (res.ok) {
          setHighlights(hs => hs.filter(h => h._id !== id));
          setMessage('Highlight removed.');
          setTimeout(() => setMessage(''), 2000);
        }
      })
      .catch(() => {});
  };

  return (
    <div style={{ marginTop: 20, position: 'relative' }} ref={viewerRef} onMouseUp={handleMouseUp}>
      <button className="control-btn" onClick={onClose}>Close PDF</button>

      <Document
        file={file}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={console.error}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Page pageNumber={pageNumber} scale={scale} />

          {/* Render Highlight Boxes */}
          {highlights
            .filter(h => h.page === pageNumber && h.boundingBox && typeof h.boundingBox.x === 'number')
            .map((h, i) => (
              <div
                key={h._id || i}
                className="highlight-box"
                style={{
                  position: 'absolute',
                  left: h.boundingBox.x * scale,
                  top: h.boundingBox.y * scale,
                  width: h.boundingBox.width * scale,
                  height: h.boundingBox.height * scale,
                  backgroundColor: 'rgba(255, 255, 0, 0.4)',
                  pointerEvents: 'auto',
                  border: '1px solid yellow',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Shift + Click to remove highlight"
                onClick={(e) => {
                  if (e.shiftKey) handleRemoveHighlight(h._id);
                }}
                onMouseEnter={(e) => {
                  e.target.style.border = '2px solid orange';
                }}
                onMouseLeave={(e) => {
                  e.target.style.border = '1px solid yellow';
                }}
              />
            ))}
        </div>
      </Document>

      {message && <div className="highlight-msg">{message}</div>}

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="control-btn" onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
          Previous
        </button>

        <span>Page {pageNumber} of {numPages}</span>

        <button className="control-btn" onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>
          Next
        </button>

        <span style={{ marginLeft: 24 }}>
          <button className="control-btn" onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={{ marginRight: 8 }}>
            -
          </button>
          Zoom: {(scale * 100).toFixed(0)}%
          <button className="control-btn" onClick={() => setScale(s => Math.min(3, s + 0.2))} style={{ marginLeft: 8 }}>
            +
          </button>
        </span>
      </div>
    </div>
  );
}
