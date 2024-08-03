import React from 'react';
import Link from 'next/link';
import { Home, ShoppingCart, Coins, ListChecks, Users } from 'lucide-react';

const NavBar: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-5 gap-4 py-2">
          <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-900">
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </Link>

          <Link href="/businesses" className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-900">
            <ShoppingCart className="h-6 w-6" />
            <span className="text-xs">Businesses</span>
          </Link>

          <Link href="/upgrades" className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-900">
            <Coins className="h-6 w-6" />
            <span className="text-xs">Upgrades</span>
          </Link>

          <Link href="/tasks" className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-900">
            <ListChecks className="h-6 w-6" />
            <span className="text-xs">Tasks</span>
          </Link>

          <Link href="/referral" className="flex flex-col items-center justify-center text-gray-500 hover:text-gray-900">
            <Users className="h-6 w-6" />
            <span className="text-xs">Referral</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;