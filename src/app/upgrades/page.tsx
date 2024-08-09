"use client";

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Wifi, Snowflake, Settings, Rocket, Atom, TrendingUp, Lock } from 'lucide-react';
import { UPGRADES, PRESTIGE_COST, calculatePrestigePoints, calculateUpgradeCost } from '@/lib/gameLogic';
import type { UpgradeType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';

const upgradeIcons: Record<UpgradeType, React.ReactElement> = {
  fasterInternet: <Wifi className="w-6 h-6 text-blue-400" />,
  betterCooling: <Snowflake className="w-6 h-6 text-cyan-400" />,
  aiOptimization: <Settings className="w-6 h-6 text-green-400" />,
  quantumMining: <Atom className="w-6 h-6 text-purple-400" />,
  clickUpgrade: <Rocket className="w-6 h-6 text-red-400" />
};

const Upgrades: React.FC = () => {
  const { user, buyUpgrade, performPrestige, syncWithServer } = useGameStore();
  const [hoveredUpgrade, setHoveredUpgrade] = useState<UpgradeType | null>(null);

  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  if (!user) return null;

  const handlePrestige = () => {
    performPrestige();
  };

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

  const handleBuyUpgrade = (upgradeType: UpgradeType) => {
    logger.debug('Buying upgrade', { type: upgradeType, cost: calculateUpgradeCost(upgradeType, user.upgrades).toString(), userCoins: user.cryptoCoins.toString() });
    buyUpgrade(upgradeType);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-[#1a2035] to-[#2c3e50] text-white p-4 overflow-y-auto">
        <motion.h1 
          className="text-3xl font-bold text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Upgrades & Prestige
        </motion.h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto pb-20">
          <AnimatePresence>
            {Object.entries(UPGRADES).map(([id, upgrade], index) => {
              const upgradeId = id as UpgradeType;
              const icon = upgradeIcons[upgradeId];
              const ownedCount = user.upgrades.filter(u => u === upgradeId).length;
              const cost = calculateUpgradeCost(upgradeId, user.upgrades);
              const canAfford = user.cryptoCoins >= cost;

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className={`relative overflow-hidden transition-all duration-300 ${
                      ownedCount > 0 ? 'bg-gradient-to-br from-green-900 to-blue-900' : 
                      canAfford ? 'bg-gradient-to-br from-purple-900 to-indigo-900' : 
                      'bg-gradient-to-br from-gray-800 to-gray-900'
                    }`}
                    onMouseEnter={() => setHoveredUpgrade(upgradeId)}
                    onMouseLeave={() => setHoveredUpgrade(null)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-inner">
                          {icon}
                        </div>
                        <span>{upgrade.name}</span>
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Owned: {ownedCount}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-300 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Boost: +{upgrade.effect - 100}%
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleBuyUpgrade(upgradeId)}
                        disabled={!canAfford}
                        size="sm"
                        className={`w-full ${
                          canAfford ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' :
                          'bg-gray-700'
                        } transition-all duration-300`}
                      >
                        Buy ({formatLargeNumber(cost)})
                      </Button>
                    </CardFooter>
                    {!canAfford && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {hoveredUpgrade === upgradeId && (
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <Progress value={(Number(user.cryptoCoins) / Number(cost)) * 100} className="h-1" />
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="mt-6 max-w-md mx-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handlePrestige}
                disabled={user.cryptoCoins < PRESTIGE_COST}
                className="w-full py-3 text-lg bg-gradient-to-r from-yellow-500 to-red-500 hover:from-yellow-600 hover:to-red-600 text-white transition-all duration-300"
              >
                Prestige (Gain {calculatePrestigePoints(user.cryptoCoins)} points)
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset your progress to gain permanent bonuses!</p>
            </TooltipContent>
          </Tooltip>
          <p className="text-center text-sm text-gray-400 mt-2">
            Next prestige at: {formatLargeNumber(PRESTIGE_COST)} coins
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Upgrades;