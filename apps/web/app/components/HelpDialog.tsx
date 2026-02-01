'use client';

import { useState, useEffect, useRef } from 'react';

interface HelpDialogProps {
  title: string;
  content: string;
}

const TITLE_ID = 'help-dialog-title';

export function HelpDialog({ title, content }: HelpDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Hướng dẫn"
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
      >
        <span aria-hidden>❓</span> Hướng dẫn
      </button>
    );
  }

  return (
    <>
      {/* Overlay: click to close */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Đóng hộp thoại"
        onClick={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(false);
          }
        }}
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
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
            background: '#1a1a1a',
            border: '1px solid #3a3a3a',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            overscrollBehavior: 'contain',
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
            <h2 id={TITLE_ID} style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#4a9eff' }}>
              {title}
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng"
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
              <span aria-hidden>×</span>
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
