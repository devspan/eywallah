"use client";
import React from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Cpu, Server, Briefcase, BarChart, DollarSign, Globe } from 'lucide-react'; // Use available icons
import { BUSINESSES, calculateBusinessCost } from '@/lib/gameLogic';
import { BusinessType } from '@/types';

const businessIcons: Record<BusinessType, React.ReactElement> = {
  gpuMiner: <Cpu className="w-6 h-6 text-white" />,
  asicFarm: <Server className="w-6 h-6 text-white" />,
  blockchainStartup: <Briefcase className="w-6 h-6 text-white" />,
  cryptoExchange: <DollarSign className="w-6 h-6 text-white" />,
  nftMarketplace: <BarChart className="w-6 h-6 text-white" />,
  defiPlatform: <Globe className="w-6 h-6 text-white" />
};

const Businesses: React.FC = () => {
  const { user, localCoins, buyBusiness } = useGameStore();

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="space-y-4">
        {Object.entries(BUSINESSES).map(([type, business]) => {
          const ownedCount = user.businesses.find(b => b.type === type)?.count || 0;
          const cost = calculateBusinessCost(type as BusinessType, ownedCount);

          return (
            <div key={type} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-700 rounded-full">
                  {businessIcons[type as BusinessType]}
                </div>
                <div>
                  <p className="text-xl font-medium text-white">{business.name}</p>
                  <p className="text-sm text-gray-400">Owned: {ownedCount}</p>
                </div>
              </div>
              <Button 
                onClick={() => buyBusiness(type as BusinessType)}
                disabled={localCoins < cost}
                size="sm"
                className="ml-4"
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
