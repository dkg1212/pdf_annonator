import React from "react";
import './PDFCard.css';

const PDFCard = ({ pdf, onOpen, onRename, onDelete }) => (
  <div className="pdf-card">
    <div className="pdf-icon">📄</div>
    <div className="pdf-info">
      <div className="pdf-name">{pdf.originalname}</div>
      <div className="pdf-uuid">UUID: {pdf.uuid}</div>
    </div>
    <div className="pdf-actions">
      <button onClick={onOpen} title="Open PDF">🔍</button>
      <button onClick={onRename} title="Rename PDF">✏️</button>
      <button onClick={onDelete} title="Delete PDF" className="danger">🗑️</button>
    </div>
  </div>
);

export default PDFCard;
