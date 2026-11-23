'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AnnouncementBarProps {
  text?: string;
}

export default function AnnouncementBar({ text }: AnnouncementBarProps) {
  if (!text) return null;

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 text-white text-xs font-semibold py-1.5 px-4 shadow-sm flex items-center justify-center gap-2 overflow-hidden text-center">
      <Sparkles className="w-3.5 h-3.5 text-fkyellow shrink-0 animate-pulse" />
      <span>{text}</span>
      <Sparkles className="w-3.5 h-3.5 text-fkyellow shrink-0 animate-pulse" />
    </div>
  );
}
