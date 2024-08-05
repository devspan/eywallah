import { NextResponse } from 'next/server';
import { getGameState, saveGameState, createNewUser } from '@/lib/redis';
import { addBusiness, addUpgrade, applyPurchaseCost, calculateIncome, calculateBusinessCost, calculatePrestigePoints, calculateUpgradeCost, canAfford, getBusinessTypes, getGlobalStats, getUpgradeTypes, performPrestige, updateGlobalState } from '@/lib/gameLogic';
import { BusinessType, UpgradeType } from '@/types';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
}

// Function to extract the Telegram user ID from the Authorization header
function getTelegramId(headers: Headers): string | null {
  const authHeader = headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded.id || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const telegramId = getTelegramId(request.headers);
  if (!telegramId) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const { action, data } = await request.json();
  let gameState = await getGameState(telegramId);

  if (!gameState) {
    // If no game state exists, create a new one
    gameState = createNewUser(telegramId);
    await saveGameState(gameState);
  }

  switch (action) {
    case 'addBusiness':
      {
        const { businessType } = data as { businessType: BusinessType };
        const businessCost = calculateBusinessCost(
          businessType,
          gameState.businesses.filter((b) => b.type === businessType).length
        );

        if (!canAfford(gameState, businessCost)) {
          return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        gameState = applyPurchaseCost(gameState, businessCost);
        gameState = addBusiness(gameState, businessType);

        await saveGameState(gameState);

        return NextResponse.json({ message: 'Business added successfully' });
      }

    case 'addUpgrade':
      {
        const { upgradeType } = data as { upgradeType: UpgradeType };
        const userUpgrade = gameState.upgrades.find((u) => u.type === upgradeType);
        const level = userUpgrade ? userUpgrade.level : 0;
        const upgradeCost = calculateUpgradeCost(upgradeType, level);

        if (!canAfford(gameState, upgradeCost)) {
          return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        gameState = applyPurchaseCost(gameState, upgradeCost);
        gameState = addUpgrade(gameState, upgradeType);

        await saveGameState(gameState);

        return NextResponse.json({ message: 'Upgrade added successfully' });
      }

    case 'getGameState':
      return NextResponse.json(gameState);

    case 'prestigeReset':
      {
        const prestigeCost = 1e6;

        if (gameState.cryptoCoins < prestigeCost) {
          return NextResponse.json({ error: 'Insufficient coins to prestige' }, { status: 400 });
        }

        gameState = performPrestige(gameState);

        await saveGameState(gameState);

        return NextResponse.json({ message: 'Prestige reset successful' });
      }

    case 'getGlobalStats':
      return NextResponse.json(getGlobalStats());

    case 'updateGlobalState':
      updateGlobalState();
      return NextResponse.json({ message: 'Global state updated' });

    case 'getBusinessTypes':
      return NextResponse.json(getBusinessTypes());

    case 'getUpgradeTypes':
      return NextResponse.json(getUpgradeTypes());

    case 'calculateIncome':
      {
        const income = calculateIncome(gameState);
        return NextResponse.json({ income });
      }

    case 'calculatePrestigePoints':
      {
        const prestigePoints = calculatePrestigePoints(gameState.cryptoCoins);
        return NextResponse.json({ prestigePoints });
      }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
