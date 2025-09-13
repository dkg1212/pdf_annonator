
import { useState, useRef } from 'react';
import { pdfjs } from 'react-pdf';
// Fix CORS error and worker issues for Vite + pdfjs-dist v5+
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();
import { Document, Page } from 'react-pdf';

// PDF Viewer with basic highlight overlay
export default function PDFViewerWithHighlight({ file, pageNumber, setPageNumber, numPages, setNumPages, onClose }) {
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
