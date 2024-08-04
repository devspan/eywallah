"use client";

import type React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaTelegram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { BackgroundBeams } from "@/components/ui/background-beams";

const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      {/* Overlay to enhance beam visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 z-0"></div>
      
      {/* Background beams */}
      <BackgroundBeams className="z-0" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="relative w-64 h-64 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-75 blur-xl"></div>
              <Image
                src="/splash.png"
                alt="Crypto Capitalist"
                width={256}
                height={256}
                className="relative rounded-full"
              />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Welcome to Crypto Capitalist
              </span>
            </h1>
            
            <p className="max-w-xl mx-auto text-xl sm:text-2xl text-blue-200">
              The ultimate idle clicker game for crypto enthusiasts!
            </p>
            
            <Link 
              href="https://t.me/ccapitalist_bot"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              Play on Telegram
            </Link>
          </div>
        </main>

        <footer className="w-full bg-gray-900/50 backdrop-blur-sm py-6">
          <div className="flex justify-center space-x-6">
            <SocialLink href="https://t.me/CryptoCapitalistGame" icon={<FaTelegram size={24} />} />
            <SocialLink href="https://twitter.com/CryptoCapGame" icon={<FaTwitter size={24} />} />
            <SocialLink href="https://www.youtube.com/channel/CryptoCapitalistGame" icon={<FaYoutube size={24} />} />
          </div>
        </footer>
      </div>
    </div>
  );
};

const SocialLink: React.FC<{ href: string; icon: React.ReactNode }> = ({ href, icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-300 hover:text-yellow-400 transition-colors duration-300"
  >
    {icon}
  </a>
);

export default LandingPage;