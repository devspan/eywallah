"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectAndRoute = async () => {
      try {
        // Ensure window object is available
        if (typeof window !== 'undefined') {
          // Check for Telegram WebApp
          if (window.Telegram?.WebApp) {
            console.log("Telegram WebApp detected, routing to /game");
            await router.push('/game');
          } else {
            console.log("Telegram WebApp not detected, routing to /landing");
            await router.push('/landing');
          }
        } else {
          console.log("Window object not available, likely server-side rendering");
        }
      } catch (error) {
        console.error("Error during routing:", error);
      } finally {
        // Set loading to false after routing attempt
        setIsLoading(false);
      }
    };

    detectAndRoute();
  }, [router]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-gray-900">
        <div className="relative w-full h-full">
          <Image
            src="/splash.png"
            alt="Loading..."
            layout="fill"
            objectFit="cover"
            priority
            className="animate-pulse"
          />
        </div>
      </div>
    );
  }

  // This should not be rendered, but is here as a fallback
  return null;
}