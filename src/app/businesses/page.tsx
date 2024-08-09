"use client";

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Cpu, Server, Network, DollarSign, BarChart, Globe, TrendingUp, Lock } from 'lucide-react';
import { BUSINESSES, calculateBusinessCost, formatLargeNumber } from '@/lib/gameLogic';
import type { BusinessType } from '@/types';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

const businessIcons: Record<BusinessType, React.ReactElement> = {
  gpuMiner: <Cpu className="w-6 h-6 text-purple-400" />,
  asicFarm: <Server className="w-6 h-6 text-blue-400" />,
  miningPool: <Network className="w-6 h-6 text-green-400" />,
  cryptoExchange: <DollarSign className="w-6 h-6 text-yellow-400" />,
  nftMarketplace: <BarChart className="w-6 h-6 text-pink-400" />,
  defiPlatform: <Globe className="w-6 h-6 text-cyan-400" />
};

const Businesses: React.FC = () => {
  const { user, buyBusiness, syncWithServer, income } = useGameStore();
  const [businessIncomes, setBusinessIncomes] = useState<Record<BusinessType, bigint>>(() => 
    Object.fromEntries(Object.keys(BUSINESSES).map(type => [type, BigInt(0)])) as Record<BusinessType, bigint>
  );

  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  useEffect(() => {
    if (user) {
      calculateBusinessIncomes();
    }
  }, [user, income]);

  if (!user) return null;

  const calculateBusinessIncomes = () => {
    const incomes: Record<BusinessType, bigint> = {} as Record<BusinessType, bigint>;
    const totalBusinessCount = user.businesses.reduce((total, b) => total + b.count, 0);
    
    for (const businessType of Object.keys(BUSINESSES) as BusinessType[]) {
      const ownedCount = user.businesses.find(b => b.type === businessType)?.count || 0;
      incomes[businessType] = totalBusinessCount > 0 
        ? (income * BigInt(ownedCount)) / BigInt(totalBusinessCount)
        : BigInt(0);
    }
    setBusinessIncomes(incomes);
  };

  const handleBuyBusiness = async (businessType: BusinessType) => {
    logger.debug('Buying business', { 
      type: businessType, 
      cost: calculateBusinessCost(businessType, user.businesses.find(b => b.type === businessType)?.count || 0).toString(), 
      userCoins: user.cryptoCoins.toString() 
    });
    await buyBusiness(businessType);
    calculateBusinessIncomes();
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
          Crypto Businesses
        </motion.h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto pb-20">
          <AnimatePresence>
            {Object.entries(BUSINESSES).map(([type, business], index) => {
              const businessType = type as BusinessType;
              const ownedBusiness = user.businesses.find(b => b.type === businessType);
              const ownedCount = ownedBusiness?.count || 0;
              const cost = calculateBusinessCost(businessType, ownedCount);
              const currentIncome = businessIncomes[businessType] || BigInt(0);
              const nextIncome = ownedCount > 0
                ? currentIncome * BigInt(ownedCount + 1) / BigInt(ownedCount)
                : BUSINESSES[businessType].baseIncome;
              const incomeIncrease = nextIncome - currentIncome;
              const canAfford = user.cryptoCoins >= cost;

              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className={`relative overflow-hidden transition-all duration-300 ${
                      canAfford ? 'bg-gradient-to-br from-purple-900 to-indigo-900' : 
                      'bg-gradient-to-br from-gray-800 to-gray-900'
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-inner">
                          {businessIcons[businessType]}
                        </div>
                        <span>{business.name}</span>
                      </CardTitle>
                      <CardDescription className="text-gray-300">
                        Owned: {ownedCount}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-green-400 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Income: +{formatLargeNumber(incomeIncrease)}/min
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Current income: {formatLargeNumber(currentIncome)}/min
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                      <Button 
                        onClick={() => handleBuyBusiness(businessType)}
                        disabled={!canAfford}
                        size="sm"
                        className={`w-full ${
                          canAfford ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600' :
                          'bg-gray-700'
                        } transition-all duration-300`}
                      >
                        Buy ({formatLargeNumber(cost)})
                      </Button>
                      <div className="w-full">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative pt-1">
                              <Progress 
                                value={(Number(user.cryptoCoins) / Number(cost)) * 100} 
                                className="h-2"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Progress to next purchase: {((Number(user.cryptoCoins) / Number(cost)) * 100).toFixed(1)}%</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardFooter>
                    {!canAfford && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Businesses;