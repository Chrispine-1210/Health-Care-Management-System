import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Bell, LogOut } from 'lucide-react';
import { useState } from 'react';

export function NavBar() {
  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        <Link href="/" className="font-bold text-lg text-primary">
          Thandizo Pharmacy
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/notifications">
            <Button size="icon" variant="ghost">
              <Bell className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
