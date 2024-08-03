"use client";
import React from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Wifi, Snowflake, Settings, Rocket } from 'lucide-react';
import { UPGRADES, PRESTIGE_COST, calculatePrestigePoints } from '@/lib/gameLogic';
import { UpgradeType } from '@/types';

const upgradeIcons: Record<UpgradeType, React.ReactElement> = {
  fasterInternet: <Wifi className="w-6 h-6 text-white" />,
  betterCooling: <Snowflake className="w-6 h-6 text-white" />,
  aiOptimization: <Settings className="w-6 h-6 text-white" />,
  clickUpgrade: <Rocket className="w-6 h-6 text-white" />
};

const Upgrades: React.FC = () => {
  const { user, localCoins, buyUpgrade } = useGameStore();

  if (!user) return null;

  const handlePrestige = () => {
    // Implement prestige logic here
    console.log('Prestige not implemented yet');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-4">
        {Object.entries(UPGRADES).map(([id, upgrade]) => {
          const upgradeId = id as UpgradeType;
          const icon = upgradeIcons[upgradeId];

          return (
            <div key={id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-md hover:bg-gray-700 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-700 rounded-full">
                  {icon}
                </div>
                <div>
                  <p className="text-xl font-medium text-white">{upgrade.name}</p>
                  <p className="text-sm text-gray-400">Effect: x{upgrade.effect}</p>
                </div>
              </div>
              <Button 
                onClick={() => buyUpgrade(upgradeId)}
                disabled={localCoins < upgrade.cost || user.upgrades.some(u => u.type === id)}
                size="default" // Changed to "default" to match accepted sizes
              >
                Buy ({upgrade.cost})
              </Button>
            </div>
          );
        })}
        <div className="mt-6">
          <Button 
            onClick={handlePrestige}
            disabled={localCoins < PRESTIGE_COST}
            className="w-full py-3 text-lg" // Larger padding and text for prominence
          >
            Prestige (Gain {calculatePrestigePoints(localCoins)} points)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Upgrades;
