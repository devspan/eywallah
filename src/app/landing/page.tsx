"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaTelegram, FaTwitter, FaYoutube } from 'react-icons/fa';

const LandingPage: React.FC = () => {
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  useEffect(() => {
    setIsTelegramWebApp(!!window.Telegram?.WebApp);
  }, []);

  if (isTelegramWebApp) {
    // Redirect to game or show a message for Telegram users
    return <div>Please open this app in Telegram.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 flex-grow flex flex-col items-center justify-center text-center">
        <div className="mb-8">
          <Image
            src="/splash.png"
            alt="Crypto Capitalist"
            width={300}
            height={300}
            className="rounded-full"
          />
        </div>
        <h1 className="text-4xl font-bold mb-4">Welcome to Crypto Capitalist</h1>
        <p className="text-xl mb-8">The ultimate idle clicker game for crypto enthusiasts!</p>
        <Link 
          href="https://t.me/your_bot_username" 
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full transition duration-300"
        >
          Play on Telegram
        </Link>
      </main>

      <footer className="w-full bg-gray-800 p-4">
        <div className="container mx-auto flex justify-center space-x-6">
          <a href="https://t.me/CryptoCapitalistGame" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-500 transition duration-300">
            <FaTelegram size={24} />
          </a>
          <a href="https://twitter.com/CryptoCapGame" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-500 transition duration-300">
            <FaTwitter size={24} />
          </a>
          <a href="https://www.youtube.com/channel/CryptoCapitalistGame" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-500 transition duration-300">
            <FaYoutube size={24} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;