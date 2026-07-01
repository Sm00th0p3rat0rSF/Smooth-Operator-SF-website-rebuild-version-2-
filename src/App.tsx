import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LandingPage from './components/LandingPage';
import HomeView from './components/HomeView';
import { testConnection } from './firebase';

type AppViewState = 'landing' | 'home';

export default function App() {
  const [view, setView] = useState<AppViewState>('landing');

  // Verify Firestore operational link on initialization
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="bg-[#07080b] min-h-screen text-gray-100 overflow-x-hidden font-sans relative">
      {/* Soft Pulsating Ambient Purple Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-transparent">
        <motion.div
          animate={{
            x: [0, 45, -25, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.25, 0.9, 1],
            opacity: [0.12, 0.22, 0.12, 0.12]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[10%] left-[15%] w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -35, 35, 0],
            y: [0, 50, -30, 0],
            scale: [1, 0.85, 1.15, 1],
            opacity: [0.08, 0.18, 0.08, 0.08]
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-700/15 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{
            x: [0, 30, -15, 0],
            y: [0, 20, 45, 0],
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.1, 0.2, 0.1, 0.1]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[45%] left-[40%] w-[400px] h-[400px] bg-violet-600/18 rounded-full blur-[110px]"
        />
      </div>

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing-page-parent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <LandingPage onEnter={() => setView('home')} />
          </motion.div>
        )}

        {view === 'home' && (
          <motion.div
            key="home-page-parent"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <HomeView />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
