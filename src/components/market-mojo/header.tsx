'use client';

import { Github, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';

export default function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isUserLoggedIn = user && !user.isAnonymous;

  return (
    <header className="py-4 px-4 sm:px-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border/50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-foreground tracking-tight hover:text-primary transition-colors">
          Market Mojo
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link href="https://github.com/JayaDatla/Market-Mojo" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Github className="h-5 w-5" />
            <span className="hidden sm:inline text-xs">GitHub</span>
          </Link>
          {isUserLoading ? (
            <div className="h-8 w-20 bg-muted rounded-md animate-pulse" />
          ) : isUserLoggedIn ? (
            <>
               <span className="text-muted-foreground hidden md:flex items-center gap-2 text-xs">
                <UserIcon className="h-4 w-4" />
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
