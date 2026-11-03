'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';

/* ==========================================================================
   4.1 Tombol (RfButton)
   ========================================================================== */
export type RfButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'highlight'
  | 'info';

export interface RfButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RfButtonVariant;
  isLoading?: boolean;
  iconOnly?: boolean;
}

export function RfButton({
  variant = 'default',
  isLoading = false,
  iconOnly = false,
  className = '',
  disabled,
  children,
  ...props
}: RfButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'rf-btn--primary'
      : variant === 'secondary'
        ? 'rf-btn--secondary'
        : variant === 'accent'
          ? 'rf-btn--accent'
          : variant === 'highlight'
            ? 'rf-btn--highlight'
            : variant === 'info'
              ? 'rf-btn--info'
              : '';

  const iconClass = iconOnly ? 'rf-btn--icon' : '';

  return (
    <button
      className={`rf-btn ${variantClass} ${iconClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Memproses…' : children}
    </button>
  );
}

/* ==========================================================================
   4.2 Kartu (RfCard)
   ========================================================================== */
export type RfCardColor = 'white' | 'yellow' | 'pink' | 'teal';

export interface RfCardProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: RfCardColor;
  interactive?: boolean;
  panelCorner?: 'none' | 'tl' | 'tr' | 'bl' | 'br';
}

export function RfCard({
  color = 'white',
  interactive = false,
  panelCorner = 'none',
  className = '',
  children,
  ...props
}: RfCardProps) {
  const bgMap: Record<RfCardColor, string> = {
    white: 'bg-rf-white',
    yellow: 'bg-rf-yellow',
    pink: 'bg-rf-pink',
    teal: 'bg-rf-teal',
  };

  const cornerMap: Record<string, string> = {
    none: 'rounded-[20px]',
    tl: 'rounded-[20px] rounded-tl-[40px]',
    tr: 'rounded-[20px] rounded-tr-[40px]',
    bl: 'rounded-[20px] rounded-bl-[40px]',
    br: 'rounded-[20px] rounded-br-[40px]',
  };

  return (
    <div
      className={`${bgMap[color]} ${cornerMap[panelCorner]} border-3 border-rf-ink shadow-hard-lg p-5 lg:p-6 text-rf-ink ${
        interactive ? 'rf-card-interactive' : ''
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   4.3 Tab (RfTabs) - Mendukung navigasi panah kiri/kanan sesuai Bagian 4.3 & 9
   ========================================================================== */
export interface RfTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface RfTabsProps {
  tabs: RfTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function RfTabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Navigasi bagian',
  className = '',
}: RfTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetTab = tabs[nextIndex];
      onChange(targetTab.id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex overflow-x-auto max-w-full border-3 border-rf-ink rounded-[12px] shadow-hard bg-rf-white divide-x-[3px] divide-rf-ink ${className}`.trim()}
    >
      {tabs.map((tab, idx) => {
        const isSelected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={isSelected}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`h-12 px-4 sm:px-5 inline-flex items-center justify-center gap-2 text-[16px] font-bold text-rf-ink whitespace-nowrap transition-colors cursor-pointer ${
              isSelected ? 'bg-rf-yellow' : 'bg-rf-white hover:bg-rf-bg'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   4.4 Input teks (RfInput)
   ========================================================================== */
export interface RfInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  errorText?: string;
}

export function RfInput({
  label,
  helperText,
  errorText,
  id,
  className = '',
  ...props
}: RfInputProps) {
  const inputId = id || `rf-input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={inputId}
        className="text-[14px] leading-[20px] font-bold text-rf-ink"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(errorText)}
        aria-describedby={
          errorText ? errorId : helperText ? helperId : undefined
        }
        className={`h-12 px-4 bg-rf-white text-rf-ink placeholder:text-rf-muted border-3 border-rf-ink rounded-[12px] text-[16px] leading-[24px] font-normal focus:shadow-hard focus:outline-none focus-visible:outline-[3px] focus-visible:outline-rf-ink focus-visible:outline-offset-[3px] transition-shadow ${className}`.trim()}
        {...props}
      />
      {errorText ? (
        <div
          id={errorId}
          role="alert"
          className="mt-1 inline-flex items-start gap-2 bg-rf-coral border-2 border-rf-ink rounded-[8px] px-3 py-2 text-[14px] leading-[20px] font-medium text-rf-ink"
        >
          <AlertCircle
            size={18}
            strokeWidth={2.5}
            aria-hidden="true"
            className="shrink-0 mt-0.5 text-rf-ink"
          />
          <span>{errorText}</span>
        </div>
      ) : helperText ? (
        <p id={helperId} className="text-[14px] leading-[20px] text-rf-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

/* ==========================================================================
   4.5 Checkbox dan Toggle (RfCheckbox & RfToggle)
   ========================================================================== */
export interface RfCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
}

export function RfCheckbox({
  checked,
  onChange,
  label,
  id,
}: RfCheckboxProps) {
  const checkboxId =
    id || `rf-chk-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      htmlFor={checkboxId}
      className="inline-flex items-center gap-3 min-h-[44px] cursor-pointer select-none text-rf-ink"
    >
      <button
        id={checkboxId}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-6 h-6 rounded-[6px] border-3 border-rf-ink inline-flex items-center justify-center transition-colors shrink-0 ${
          checked ? 'bg-rf-coral' : 'bg-rf-white'
        }`}
      >
        {checked && (
          <Check
            size={16}
            strokeWidth={3}
            aria-hidden="true"
            className="text-rf-ink"
          />
        )}
      </button>
      <span className="text-[16px] leading-[24px] font-medium text-rf-ink">
        {label}
      </span>
    </label>
  );
}

export interface RfToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export function RfToggle({ checked, onChange, label, id }: RfToggleProps) {
  const toggleId = id || `rf-toggle-${label || 'switch'}`;
  return (
    <div className="inline-flex items-center gap-3 min-h-[44px]">
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || (checked ? 'Aktif' : 'Nonaktif')}
        onClick={() => onChange(!checked)}
        className={`w-[52px] h-[28px] rounded-full border-3 border-rf-ink p-0.5 flex items-center transition-colors cursor-pointer ${
          checked ? 'bg-rf-teal justify-end' : 'bg-rf-white justify-start'
        }`}
      >
        <span className="w-4 h-4 rounded-full bg-rf-ink block" />
      </button>
      <span className="text-[14px] leading-[20px] font-bold text-rf-ink">
        {label ? `${label}: ` : ''}
        {checked ? 'Aktif' : 'Nonaktif'}
      </span>
    </div>
  );
}

/* ==========================================================================
   4.6 Badge dan Stiker (RfBadge & RfSticker)
   ========================================================================== */
export type RfBadgeColor = 'yellow' | 'teal' | 'purple' | 'coral' | 'pink' | 'white';

export interface RfBadgeProps {
  color?: RfBadgeColor;
  children: React.ReactNode;
  className?: string;
}

export function RfBadge({
  color = 'teal',
  children,
  className = '',
}: RfBadgeProps) {
  const bgMap: Record<RfBadgeColor, string> = {
    yellow: 'bg-rf-yellow',
    teal: 'bg-rf-teal',
    purple: 'bg-rf-purple',
    coral: 'bg-rf-coral',
    pink: 'bg-rf-pink',
    white: 'bg-rf-white',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-rf-ink px-3 py-1 text-[14px] leading-[20px] font-bold text-rf-ink whitespace-nowrap ${bgMap[color]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

export interface RfStickerProps {
  color?: RfBadgeColor;
  rotateDeg?: -3 | -2 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export function RfSticker({
  color = 'yellow',
  rotateDeg = -3,
  children,
  className = '',
}: RfStickerProps) {
  const bgMap: Record<RfBadgeColor, string> = {
    yellow: 'bg-rf-yellow',
    teal: 'bg-rf-teal',
    purple: 'bg-rf-purple',
    coral: 'bg-rf-coral',
    pink: 'bg-rf-pink',
    white: 'bg-rf-white',
  };

  const rotateClass =
    rotateDeg === -3
      ? '-rotate-3'
      : rotateDeg === -2
        ? '-rotate-2'
        : rotateDeg === 2
          ? 'rotate-2'
          : 'rotate-3';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 border-rf-ink shadow-hard-sm px-3.5 py-1 text-[14px] leading-[20px] font-bold text-rf-ink select-none pointer-events-none ${bgMap[color]} ${rotateClass} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

/* ==========================================================================
   4.7 Menu Dropdown (RfProfileDropdown)
   ========================================================================== */
export interface RfDropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

export interface RfProfileDropdownProps {
  userName: string;
  userEmail: string;
  avatarColor?: string;
  items: RfDropdownItem[];
}

export function RfProfileDropdown({
  userName,
  userEmail,
  avatarColor = '#FFE066',
  items,
}: RfProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Menu profil ${userName}`}
        className="inline-flex items-center gap-2 min-h-[48px] px-2.5 py-1 bg-rf-white border-3 border-rf-ink rounded-[12px] shadow-hard-sm hover:bg-rf-yellow transition-colors cursor-pointer"
      >
        <RfAvatar name={userName} color={avatarColor} />
        <span className="hidden sm:inline text-[14px] leading-[20px] font-bold text-rf-ink max-w-[120px] truncate">
          {userName}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          aria-hidden="true"
          className="text-rf-ink"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-rf-white border-3 border-rf-ink rounded-[12px] shadow-hard overflow-hidden z-40 divide-y-2 divide-rf-ink"
        >
          <div className="px-4 py-2.5 bg-rf-yellow">
            <p className="text-[14px] leading-[20px] font-bold text-rf-ink truncate">
              {userName}
            </p>
            <p className="text-[12px] leading-[16px] font-medium text-rf-muted truncate">
              {userEmail}
            </p>
          </div>
          {items.map((item, idx) => (
            <button
              key={idx}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="w-full h-[44px] px-4 flex items-center gap-2.5 text-left text-[14px] leading-[20px] font-bold text-rf-ink bg-rf-white hover:bg-rf-yellow transition-colors cursor-pointer"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   4.8 Indikator Progres (RfProgressBar)
   ========================================================================== */
export interface RfProgressBarProps {
  value: number; // 0 to 100
  color?: 'coral' | 'purple' | 'teal';
  label?: string;
}

export function RfProgressBar({
  value,
  color = 'teal',
  label = 'Progres',
}: RfProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const fillBg =
    color === 'coral'
      ? 'bg-rf-coral'
      : color === 'purple'
        ? 'bg-rf-purple'
        : 'bg-rf-teal';

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full h-[20px] border-3 border-rf-ink rounded-full bg-rf-white overflow-hidden flex"
    >
      <div
        style={{ width: `${clamped}%` }}
        className={`h-full ${fillBg} ${
          clamped > 0 && clamped < 100 ? 'border-r-3 border-rf-ink' : ''
        } transition-all duration-200`}
      />
    </div>
  );
}

/* ==========================================================================
   4.9 Avatar & Avatar Stack (RfAvatar, RfAvatarStack)
   ========================================================================== */
export interface RfAvatarProps {
  name: string;
  color?: string;
  size?: 'md' | 'lg';
  className?: string;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'RF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function RfAvatar({
  name,
  color = '#FFE066',
  size = 'md',
  className = '',
}: RfAvatarProps) {
  const dimClass =
    size === 'lg' ? 'w-16 h-16 text-[20px]' : 'w-[40px] h-[40px] text-[14px]';

  return (
    <div
      style={{ backgroundColor: color }}
      title={name}
      className={`${dimClass} rounded-full border-3 border-rf-ink inline-flex items-center justify-center font-bold text-rf-ink shrink-0 select-none ${className}`.trim()}
    >
      {getInitials(name)}
    </div>
  );
}

export function RfAvatarStack({
  users,
}: {
  users: { name: string; color?: string }[];
}) {
  return (
    <div className="inline-flex items-center -space-x-2">
      {users.map((u, idx) => (
        <RfAvatar key={idx} name={u.name} color={u.color} />
      ))}
    </div>
  );
}
