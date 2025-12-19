import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { TreeState } from './types';

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);

  const toggleState = () => {
    setTreeState(prev => prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE);
  };

  const isFormed = treeState === TreeState.TREE_SHAPE;

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Canvas */}
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ antialias: false, toneMappingExposure: 1.2 }}
      >
        <Scene isFormed={isFormed} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between px-8 pt-8 pb-8 md:px-12 md:pt-12 md:pb-12 z-10">
        
        {/* Header */}
        <header className="flex flex-col items-center animate-fade-in-down w-full relative z-20">
          <div className="flex items-center space-x-3 mb-1">
             <div className="w-8 h-[1px] bg-yellow-600/70"></div>
             <span className="text-yellow-600/90 text-xs tracking-[0.3em] font-display uppercase">Beijing 2025</span>
             <div className="w-8 h-[1px] bg-yellow-600/70"></div>
          </div>
          
          {/* Main Title: Custom Gold Glow via textShadow */}
          <h1 
            className="text-6xl md:text-8xl font-script py-1 whitespace-nowrap text-center gold-shine leading-tight"
            style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.4), 0 0 30px rgba(255, 200, 0, 0.2)' }}
          >
            Merry Christmas!
          </h1>
          
          {/* Subtitle: Fluorescent Green Glow */}
          <p 
            className="text-emerald-200/80 font-body italic text-lg tracking-wide text-center mt-[-0.5rem] md:mt-[-1rem]"
            style={{ textShadow: '0 0 10px rgba(50, 255, 120, 0.4), 0 0 20px rgba(50, 255, 120, 0.2)' }}
          >
            Big Baby · Good Baby · Small Baby
          </p>
        </header>

        {/* Controls - Bottom Center */}
        <div className="pointer-events-auto flex flex-col items-center space-y-6 pb-4 md:pb-8">
           <button 
             onClick={toggleState}
             className={`
                group relative px-12 py-4 overflow-hidden rounded-sm transition-all duration-500 ease-out
                ${isFormed 
                    ? 'bg-transparent border border-yellow-600/30 hover:border-yellow-500/80' 
                    : 'bg-yellow-900/20 border border-yellow-500/50 hover:bg-yellow-900/40'}
             `}
           >
              {/* Button Glow Effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              <span className={`
                relative font-display tracking-[0.2em] text-sm md:text-base uppercase transition-colors duration-300
                ${isFormed ? 'text-yellow-100' : 'text-yellow-300'}
              `}>
                {isFormed ? 'Scatter Elements' : 'Assemble Tree'}
              </span>
           </button>

           <div className="flex space-x-8 text-emerald-800/60 text-xs font-display tracking-widest uppercase">
              <span>75,000 Particles</span>
              <span>•</span>
              <span>Real-time Physics</span>
              <span>•</span>
              <span>Raytraced Glow</span>
           </div>
        </div>

        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 p-8 opacity-30">
            <div className="w-32 h-[1px] bg-gradient-to-r from-yellow-600 to-transparent"></div>
            <div className="w-[1px] h-32 bg-gradient-to-b from-yellow-600 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 right-0 p-8 opacity-30 transform rotate-180">
            <div className="w-32 h-[1px] bg-gradient-to-r from-yellow-600 to-transparent"></div>
            <div className="w-[1px] h-32 bg-gradient-to-b from-yellow-600 to-transparent"></div>
        </div>

      </div>
    </div>
  );
}

export default App;