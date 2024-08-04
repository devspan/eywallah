"use client";
import React from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Cpu, Server, Briefcase, BarChart, DollarSign, Globe } from 'lucide-react';
import { BUSINESSES, calculateBusinessCost } from '@/lib/gameLogic';
import { BusinessType } from '@/types';

const businessIcons: Record<BusinessType, React.ReactElement> = {
  gpuMiner: <Cpu className="w-8 h-8 text-purple-400" />,
  asicFarm: <Server className="w-8 h-8 text-blue-400" />,
  blockchainStartup: <Briefcase className="w-8 h-8 text-green-400" />,
  cryptoExchange: <DollarSign className="w-8 h-8 text-yellow-400" />,
  nftMarketplace: <BarChart className="w-8 h-8 text-pink-400" />,
  defiPlatform: <Globe className="w-8 h-8 text-cyan-400" />
};

const Businesses: React.FC = () => {
  const { user, localCoins, buyBusiness } = useGameStore();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1a2035] text-white p-4 overflow-y-auto">
      <div className="space-y-4 max-w-3xl mx-auto pb-20"> {/* Added pb-20 for bottom padding */}
        {Object.entries(BUSINESSES).map(([type, business]) => {
          const ownedCount = user.businesses.find(b => b.type === type)?.count || 0;
          const cost = calculateBusinessCost(type as BusinessType, ownedCount);

          return (
            <div key={type} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-inner animate-pulse-subtle">
                  {businessIcons[type as BusinessType]}
                </div>
                <div>
                  <p className="text-xl font-medium text-white">{business.name}</p>
                  <p className="text-sm text-purple-300">Owned: {ownedCount}</p>
                </div>
              </div>
              <Button 
                onClick={() => buyBusiness(type as BusinessType)}
                disabled={localCoins < cost}
                size="sm"
                className={`ml-4 ${
                  localCoins >= cost
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                } transition-all duration-300`}
              >
                Buy ({cost.toFixed(0)})
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Businesses;