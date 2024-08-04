"use client";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Youtube, Twitter, Facebook, Twitch, Coins } from 'lucide-react';

const Tasks: React.FC = () => {
  const mockTasks = [
    { icon: Youtube, name: "Watch YouTube video", reward: 50, completed: false },
    { icon: Twitter, name: "Follow on Twitter", reward: 100, completed: false },
    { icon: Facebook, name: "Like Facebook page", reward: 75, completed: true },
    { icon: Twitch, name: "Watch Twitch stream", reward: 150, completed: false },
    { icon: Coins, name: "Daily login bonus", reward: 200, completed: true },
  ];

  return (
    <div className="min-h-screen bg-[#1a2035] text-white p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-400">Daily Tasks</h1>
        
        {mockTasks.map((task, index) => (
          <div key={index} className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-4 shadow-lg flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-inner animate-pulse-subtle">
                <task.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">{task.name}</h3>
                <p className="text-sm text-purple-300">Reward: {task.reward} coins</p>
              </div>
            </div>
            <Button 
              disabled={task.completed}
              className={`${
                task.completed
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
              } transition-all duration-300`}
            >
              {task.completed ? 'Completed' : 'Complete'}
            </Button>
          </div>
        ))}

        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 shadow-lg mt-8">
          <h2 className="text-2xl font-semibold mb-4">Task Benefits</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Complete tasks to earn extra coins</li>
            <li>New tasks available daily</li>
            <li>Boost your progress and upgrade faster</li>
            <li>Compete with friends for the highest task completion rate!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Tasks;