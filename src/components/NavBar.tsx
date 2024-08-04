"use client"

import React from 'react';
import Link from 'next/link';
import { Home, ShoppingCart, Coins, ListChecks, Users } from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { usePathname } from 'next/navigation';

const NavBar: React.FC = () => {
  const { user } = useGameStore();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/businesses", icon: ShoppingCart, label: "Businesses" },
    { href: "/upgrades", icon: Coins, label: "Upgrades" },
    { href: "/tasks", icon: ListChecks, label: "Tasks" },
    { href: "/referral", icon: Users, label: "Referral" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 to-indigo-900 border-t border-gray-700">
      <div className="container mx-auto px-2">
        <div className="grid grid-cols-5 gap-1 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white animate-pulse-subtle' 
                    : 'text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                <item.icon className="h-6 w-6 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;