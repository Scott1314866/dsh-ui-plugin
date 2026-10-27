import React from 'react'

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={'xien-brand-mark ' + (className ?? '')}
      width={size}
      height={size}
      viewBox="0 0 54 56"
      aria-hidden="true"
    >
      <path d="M24 38C13 29 14 12 24 3c0 14 7 24 16 28-8-1-12 1-16 7Z" fill="#91abdd" />
      <path d="M21 40C11 35 5 23 3 14c13 2 24 8 30 17-6 2-10 5-12 9Z" fill="#4d79cc" />
      <path d="M11 53C19 32 35 18 51 26 36 30 24 42 11 53Z" fill="#002fa7" />
    </svg>
  )
}
export function BrandName() {
  return (
    <span className="xien-brand-name">
      <strong>西恩科技</strong>
      <small>XIEN · AGENT</small>
    </span>
  )
}
export function HeroBrand({ size = 34 }: { size?: number }) {
  return (
    <span className="xien-hero-brand" role="heading" aria-level={1}>
      <BrandMark size={size} />
      <span className="xien-hero-title">高端伺服领军者</span>
    </span>
  )
}
export function EvidenceIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 2h8l4 4v12H4zM12 2v4h4M7 10h6M7 13h5" />
    </svg>
  )
}
