"use client";
import React from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Wifi, Snowflake, Settings, Rocket } from 'lucide-react';
import { UPGRADES, PRESTIGE_COST, calculatePrestigePoints } from '@/lib/gameLogic';
import { UpgradeType } from '@/types';

const upgradeIcons: Record<UpgradeType, React.ReactElement> = {
  fasterInternet: <Wifi className="w-8 h-8 text-blue-400" />,
  betterCooling: <Snowflake className="w-8 h-8 text-cyan-400" />,
  aiOptimization: <Settings className="w-8 h-8 text-green-400" />,
  clickUpgrade: <Rocket className="w-8 h-8 text-red-400" />
};

const Upgrades: React.FC = () => {
  const { user, localCoins, buyUpgrade } = useGameStore();

  if (!user) return null;

  const handlePrestige = () => {
    // Implement prestige logic here
    console.log('Prestige not implemented yet');
  };

  return (
    <div className="min-h-screen bg-[#1a2035] text-white p-4 overflow-y-auto">
      <div className="space-y-4 max-w-3xl mx-auto pb-20">
        {Object.entries(UPGRADES).map(([id, upgrade]) => {
          const upgradeId = id as UpgradeType;
          const icon = upgradeIcons[upgradeId];
          const isOwned = user.upgrades.some(u => u.type === id);

          return (
            <div key={id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-inner animate-pulse-subtle">
                  {icon}
                </div>
                <div>
                  <p className="text-xl font-medium text-white">{upgrade.name}</p>
                  <p className="text-sm text-purple-300">Effect: x{upgrade.effect}</p>
                </div>
              </div>
              <Button 
                onClick={() => buyUpgrade(upgradeId)}
                disabled={localCoins < upgrade.cost || isOwned}
                size="sm"
                className={`ml-4 ${
                  localCoins >= upgrade.cost && !isOwned
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                } transition-all duration-300`}
              >
                {isOwned ? 'Owned' : `Buy (${upgrade.cost})`}
              </Button>
            </div>
          );
        })}
        <div className="mt-6">
          <Button 
            onClick={handlePrestige}
            disabled={localCoins < PRESTIGE_COST}
            className="w-full py-3 text-lg bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white transition-all duration-300"
          >
            Prestige (Gain {calculatePrestigePoints(localCoins)} points)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upgrades;