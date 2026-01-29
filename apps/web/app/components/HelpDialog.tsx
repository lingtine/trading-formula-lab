'use client';

import { useState } from 'react';

interface HelpDialogProps {
  title: string;
  content: string;
}

export function HelpDialog({ title, content }: HelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '6px 12px',
          background: '#2a2a2a',
          border: '1px solid #3a3a3a',
          borderRadius: '6px',
          color: '#4a9eff',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          marginLeft: '12px',
        }}
        title="Hướng dẫn"
      >
        ❓ Hướng dẫn
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Dialog */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#1a1a1a',
            border: '1px solid #3a3a3a',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            zIndex: 1001,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #2a2a2a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#4a9eff' }}>
              {title}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div
            className="help-dialog-content"
            style={{
              padding: '20px',
              color: '#ccc',
              lineHeight: '1.8',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>
    </>
  );
}
