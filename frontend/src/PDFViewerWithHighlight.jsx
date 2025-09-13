
import { useState, useRef, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
// Fix CORS error and worker issues for Vite + pdfjs-dist v5+
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();
import { Document, Page } from 'react-pdf';

// PDF Viewer with basic highlight overlay

export default function PDFViewerWithHighlight({ file, pdfUuid: pdfUuidProp, pageNumber, setPageNumber, numPages, setNumPages, onClose }) {
  // Helper to extract uuid if not provided
  function extractPdfUuid(file) {
    const match = file && file.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    return match ? match[0] : null;
  }

  // Removed selection state as highlight box is now dynamic
  const [highlights, setHighlights] = useState([]);
  const viewerRef = useRef();
  const token = localStorage.getItem('token');
  const pdfUuid = pdfUuidProp || extractPdfUuid(file);

  // Fetch highlights for this PDF and page
  useEffect(() => {
    if (!pdfUuid || !token) return;
    fetch(`http://localhost:5050/api/highlight/${pdfUuid}`, {
      headers: { 'Authorization': token }
    })
      .then(res => res.json())
      .then(data => setHighlights(Array.isArray(data) ? data : []))
      .catch(() => setHighlights([]));
  }, [pdfUuid, token]);

  // Mouse up handler to get selection and save highlight
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const viewerRect = viewerRef.current.getBoundingClientRect();
      const newHighlight = {
        pdf: pdfUuid,
        page: pageNumber,
        text: sel.toString(),
        boundingBox: {
          x: rect.left - viewerRect.left,
          y: rect.top - viewerRect.top,
          width: rect.width,
          height: rect.height
        },
        timestamp: new Date().toISOString()
      };
      // Save to backend
      fetch('http://localhost:5050/api/highlight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(newHighlight)
      })
        .then(res => res.json())
        .then(saved => setHighlights(hs => [...hs, saved]))
        .catch(() => {});
  // Remove selection highlight immediately after creation
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
      {/* Render all highlights for this page */}
      {highlights
        .filter(h => h.page === pageNumber && h.boundingBox && typeof h.boundingBox.x === 'number' && typeof h.boundingBox.y === 'number')
        .map((h, i) => (
          <div
            key={h._id || i}
            className="highlight-box"
            style={{ left: h.boundingBox.x, top: h.boundingBox.y, width: h.boundingBox.width, height: h.boundingBox.height }}
            title={h.text}
          />
        ))}
  {/* No selection box shown after highlight creation */}
      <div style={{marginTop:10}}>
        <button onClick={() => setPageNumber(p => Math.max(1, p-1))} disabled={pageNumber <= 1}>Previous</button>
        <span style={{margin:'0 10px'}}>Page {pageNumber} of {numPages}</span>
        <button onClick={() => setPageNumber(p => Math.min(numPages, p+1))} disabled={pageNumber >= numPages}>Next</button>
      </div>
    </div>
  );
}