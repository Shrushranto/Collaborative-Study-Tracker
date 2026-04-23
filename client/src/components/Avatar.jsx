import { avatarUrl } from '../utils/avatars.js';

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const SIZE_PX = { sm: 28, md: 40, lg: 64, xl: 96 };

export default function Avatar({ user, name, avatar, size = 'md', className = '' }) {
  const displayName = (user && user.name) || name || '';
  const value = (user && user.avatar) ?? avatar ?? '';
  const px = SIZE_PX[size] || SIZE_PX.md;
  const url = avatarUrl(value, { size: px * 2 });

  const classes = `avatar avatar-${size} ${className}`.trim();

  if (url) {
    return (
      <span className={classes} aria-hidden="true">
        <img src={url} alt="" loading="lazy" />
      </span>
    );
  }

  return <span className={classes}>{initials(displayName)}</span>;
}
