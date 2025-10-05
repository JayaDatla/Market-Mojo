'use client';

import { Github } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  userId: string | null;
}

export default function Header({ userId }: HeaderProps) {
  return (
    <header className="py-4 px-4 sm:px-6 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-primary font-headline tracking-tighter">
          Market Mojo
        </h1>
        <div className="flex items-center gap-4 md:gap-6 text-sm">
          {userId && <span className="text-muted-foreground hidden md:block">User: {userId.slice(0, 8)}...</span>}
          <Link href="https://github.com/your-username-here" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
