import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'lg';
}

export function UserAvatar({ user, size = 'sm' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user.photoURL]);

  const initials = (user.displayName || user.email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  const sizeClasses =
    size === 'lg'
      ? 'w-11 h-11 text-base'
      : 'w-6 h-6 text-[11px]';

  if (user.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'Ảnh đại diện'}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${sizeClasses} rounded-full bg-blue-600 text-white font-display font-semibold inline-flex items-center justify-center shrink-0`}
    >
      {initials}
    </span>
  );
}
