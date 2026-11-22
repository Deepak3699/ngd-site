'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Link2, MessageCircle, Share2 } from 'lucide-react';

function FacebookIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078V12.073h3.047V9.764c0-3.017 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.873v2.25h3.328l-.532 3.161h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zm-1.294 19.455h2.039L6.486 3.236H4.298z" />
    </svg>
  );
}

function LinkedInIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9.75h3.564v10.702zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function isMobileShare() {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
}

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => () => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  }, []);

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleTrigger = async () => {
    if (canNativeShare && isMobileShare()) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled or share unavailable — do nothing */
      }
      return;
    }
    setOpen((value) => !value);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const element = document.createElement('textarea');
      element.value = url;
      element.style.position = 'fixed';
      element.style.opacity = '0';
      document.body.appendChild(element);
      element.select();
      try {
        document.execCommand('copy');
      } catch {
        /* best effort */
      }
      document.body.removeChild(element);
    }
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="share-menu" ref={rootRef}>
      <button
        type="button"
        className="share-menu-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="share-menu-popover"
        onClick={handleTrigger}
      >
        <Share2 size={16} strokeWidth={2} aria-hidden="true" />
        Share
        <ChevronDown size={14} className={open ? 'is-open' : undefined} aria-hidden="true" />
      </button>
      {open && (
        <div className="share-menu-popover" id="share-menu-popover" role="dialog" aria-label="Share this article">
          <a className="share-menu-item" href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={18} aria-hidden="true" />
            <span className="share-menu-item-text">
              <span className="share-menu-item-label">WhatsApp</span>
              <span className="share-menu-item-hint">Share to WhatsApp</span>
            </span>
          </a>
          <a className="share-menu-item" href={facebookUrl} target="_blank" rel="noreferrer">
            <FacebookIcon />
            <span className="share-menu-item-text">
              <span className="share-menu-item-label">Facebook</span>
              <span className="share-menu-item-hint">Share to Facebook</span>
            </span>
          </a>
          <a className="share-menu-item" href={xUrl} target="_blank" rel="noreferrer">
            <XIcon />
            <span className="share-menu-item-text">
              <span className="share-menu-item-label">X</span>
              <span className="share-menu-item-hint">Share to X (Twitter)</span>
            </span>
          </a>
          <a className="share-menu-item" href={linkedInUrl} target="_blank" rel="noreferrer">
            <LinkedInIcon />
            <span className="share-menu-item-text">
              <span className="share-menu-item-label">LinkedIn</span>
              <span className="share-menu-item-hint">Share to LinkedIn</span>
            </span>
          </a>
          <button type="button" className="share-menu-item share-menu-item-button" onClick={copyLink}>
            {copied ? <Check size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
            <span className="share-menu-item-text">
              <span className="share-menu-item-label">{copied ? 'Copied' : 'Copy link'}</span>
              <span className="share-menu-item-hint">{copied ? 'Link copied to clipboard' : 'Copy the article URL'}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
