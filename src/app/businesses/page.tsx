// src/app/businesses/page.tsx

"use client";
import React, { useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Cpu, Server, Network, DollarSign, BarChart, Globe } from 'lucide-react';
import { BUSINESSES, calculateBusinessCost, calculateIncome } from '@/lib/gameLogic';
import type { BusinessType } from '@/types';
import { logger } from '@/lib/logger';

const businessIcons: Record<BusinessType, React.ReactElement> = {
  gpuMiner: <Cpu className="w-8 h-8 text-purple-400" />,
  asicFarm: <Server className="w-8 h-8 text-blue-400" />,
  miningPool: <Network className="w-8 h-8 text-green-400" />,
  cryptoExchange: <DollarSign className="w-8 h-8 text-yellow-400" />,
  nftMarketplace: <BarChart className="w-8 h-8 text-pink-400" />,
  defiPlatform: <Globe className="w-8 h-8 text-cyan-400" />
};

const Businesses: React.FC = () => {
  const { user, buyBusiness, syncWithServer } = useGameStore();

  useEffect(() => {
    // Sync with server when component mounts to ensure latest data
    syncWithServer();
  }, [syncWithServer]);

  if (!user) return null;

  const formatLargeNumber = (num: bigint): string => {
    if (num < BigInt(1000000)) {
      return num.toLocaleString();
    }
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const suffixNum = Math.floor((num.toString().length - 1) / 3);
    let shortValue = (Number(num) / Math.pow(1000, suffixNum)).toFixed(1);
    if (shortValue.endsWith('.0')) {
      shortValue = shortValue.slice(0, -2);
    }
    return shortValue + suffixes[suffixNum];
  };

  const calculateBusinessIncome = (businessType: BusinessType, count: number): bigint => {
    const userWithSingleBusiness = {
      ...user,
      businesses: [{ type: businessType, count, id: '0', lastCalculated: new Date() }]
    };
    return calculateIncome(userWithSingleBusiness);
  };

  return (
    <div className="min-h-screen bg-[#1a2035] text-white p-4 overflow-y-auto">
      <div className="space-y-4 max-w-3xl mx-auto pb-20">
        {Object.entries(BUSINESSES).map(([type, business]) => {
          const businessType = type as BusinessType;
          const ownedBusiness = user.businesses.find(b => b.type === businessType);
          const ownedCount = ownedBusiness?.count || 0;
          const cost = calculateBusinessCost(businessType, ownedCount);
          const income = calculateBusinessIncome(businessType, ownedCount + 1) - calculateBusinessIncome(businessType, ownedCount);

          return (
            <div key={type} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-inner animate-pulse-subtle">
                  {businessIcons[businessType]}
                </div>
                <div>
                  <p className="text-xl font-medium text-white">{business.name}</p>
                  <p className="text-sm text-purple-300">Owned: {ownedCount}</p>
                  <p className="text-xs text-green-400">Income: {formatLargeNumber(income)}/s</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  logger.debug('Buying business', { type: businessType, cost: cost.toString(), userCoins: user.cryptoCoins.toString() });
                  buyBusiness(businessType);
                }}
                disabled={user.cryptoCoins < cost}
                size="sm"
                className={`ml-4 ${
                  user.cryptoCoins >= cost
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                } transition-all duration-300`}
              >
                Buy ({formatLargeNumber(cost)})
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Businesses;