"use client";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Share2, Gift, Users } from 'lucide-react';

const Referral: React.FC = () => {
  const mockReferralCode = "CRYPTO123";
  const mockReferralCount = 5;
  const mockReferralBonus = 10;

  return (
    <div className="min-h-screen bg-[#1a2035] text-white p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-400">Refer Friends</h1>
        
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Your Referral Code</h2>
          <div className="flex items-center justify-between bg-gray-800 rounded p-3">
            <span className="text-xl font-mono">{mockReferralCode}</span>
            <Button 
              onClick={() => navigator.clipboard.writeText(mockReferralCode)}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              <Share2 className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-6 shadow-lg flex flex-col items-center">
            <Users className="h-12 w-12 text-purple-400 mb-2" />
            <h3 className="text-xl font-semibold mb-2">Referrals</h3>
            <p className="text-3xl font-bold text-purple-400">{mockReferralCount}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-6 shadow-lg flex flex-col items-center">
            <Gift className="h-12 w-12 text-purple-400 mb-2" />
            <h3 className="text-xl font-semibold mb-2">Bonus</h3>
            <p className="text-3xl font-bold text-purple-400">{mockReferralBonus}%</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Share your referral code with friends</li>
            <li>They get a bonus when they sign up</li>
            <li>You earn {mockReferralBonus}% of their earnings</li>
            <li>The more friends you refer, the more you earn!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Referral;