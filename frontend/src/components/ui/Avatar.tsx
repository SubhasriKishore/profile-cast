import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  src?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', src }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        width={40}
        height={40}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-blue-600 text-white flex items-center justify-center font-medium`}
    >
      {initials}
    </div>
  );
}; 