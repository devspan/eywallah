"use client";
import { getUserUpgrades, purchaseUpgrade } from '@/lib/store';
import { getUpgradeTypes, calculateUpgradeCost, UPGRADES } from '@/lib/gameLogic';
import { UpgradeType } from '@/types';
import React from 'react';

const UpgradesPage: React.FC = () => {
  const upgradeTypes = getUpgradeTypes();
  const userUpgrades = getUserUpgrades();

  const handlePurchaseUpgrade = async (upgradeType: UpgradeType) => {
    await purchaseUpgrade(upgradeType);
  };

  const upgrades: Record<UpgradeType, React.ReactElement> = {
    fasterInternet: (
      <div key="fasterInternet">
        <h3>Faster Internet</h3>
        <p>Description of Faster Internet upgrade</p>
        <button onClick={() => handlePurchaseUpgrade('fasterInternet')}>
          Buy Faster Internet
        </button>
      </div>
    ),
    betterCooling: (
      <div key="betterCooling">
        <h3>Better Cooling</h3>
        <p>Description of Better Cooling upgrade</p>
        <button onClick={() => handlePurchaseUpgrade('betterCooling')}>
          Buy Better Cooling
        </button>
      </div>
    ),
    aiOptimization: (
      <div key="aiOptimization">
        <h3>AI Optimization</h3>
        <p>Description of AI Optimization upgrade</p>
        <button onClick={() => handlePurchaseUpgrade('aiOptimization')}>
          Buy AI Optimization
        </button>
      </div>
    ),
    quantumMining: (
      <div key="quantumMining">
        <h3>Quantum Mining</h3>
        <p>Description of Quantum Mining upgrade</p>
        <button onClick={() => handlePurchaseUpgrade('quantumMining')}>
          Buy Quantum Mining
        </button>
      </div>
    ),
    clickUpgrade: (
      <div key="clickUpgrade">
        <h3>Click Upgrade</h3>
        <p>Description of Click Upgrade</p>
        <button onClick={() => handlePurchaseUpgrade('clickUpgrade')}>
          Buy Click Upgrade
        </button>
      </div>
    ),
  };

  return (
    <div>
      <h1>Upgrades</h1>
      {upgradeTypes.map((upgradeType) => {
        const upgrade = UPGRADES[upgradeType];
        const userUpgrade = userUpgrades.find((u) => u.type === upgradeType);
        const level = userUpgrade ? 1 : 0;
        const cost = calculateUpgradeCost(upgradeType, level);

        return (
          <div key={upgradeType}>
            {upgrades[upgradeType]}
            <p>Cost: {cost} coins</p>
          </div>
        );
      })}
    </div>
  );
};

export default UpgradesPage;