'use client';

import { Github } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  userId: string | null;
}

export default function Header({ userId }: HeaderProps) {
  return (
    <header className="py-6 px-4 sm:px-6 sticky top-0 bg-background/50 backdrop-blur-md z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">
          Market Mojo
        </h1>
        <div className="flex items-center gap-4 md:gap-6 text-sm">
          {userId && <span className="text-muted-foreground hidden md:block text-xs">User: {userId.slice(0, 8)}...</span>}
          <Link href="https://github.com/your-username-here" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">GitHub</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
