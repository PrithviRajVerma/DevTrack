import React from 'react';

interface AvatarProps {
  name?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const PALETTE = [
  { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 0.4)', text: '#818cf8' },
  { bg: 'rgba(56, 189, 248, 0.2)', border: 'rgba(56, 189, 248, 0.4)', text: '#38bdf8' },
  { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: '#c084fc' },
  { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(165, 243, 206, 0.4)', text: '#34d399' },
  { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24' },
  { bg: 'rgba(244, 63, 94, 0.2)', border: 'rgba(244, 63, 94, 0.4)', text: '#fb7185' },
];

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  email,
  size = 'md',
  className = '',
}) => {
  const identifier = name || email || 'User';
  const colorIndex = hashString(identifier) % PALETTE.length;
  const theme = PALETTE[colorIndex];

  const getInitials = (val: string) => {
    const parts = val.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return val.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(identifier);

  const sizeStyles = {
    xs: { width: 20, height: 20, fontSize: '0.62rem' },
    sm: { width: 26, height: 26, fontSize: '0.7rem' },
    md: { width: 32, height: 32, fontSize: '0.78rem' },
    lg: { width: 40, height: 40, fontSize: '0.9rem' },
  }[size];

  return (
    <div
      className={`user-avatar ${className}`}
      style={{
        ...sizeStyles,
        backgroundColor: theme.bg,
        borderColor: theme.border,
        color: theme.text,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '9999px',
        borderWidth: 1,
        borderStyle: 'solid',
        userSelect: 'none',
        flexShrink: 0,
      }}
      title={name ? `${name} (${email || ''})` : email}
    >
      {initials}
    </div>
  );
};
