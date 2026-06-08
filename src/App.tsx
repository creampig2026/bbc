/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ParticleCake, BackgroundStars } from './ParticleCake';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState<'welcome' | 'cake' | 'wish'>('welcome');
  const [isBlown, setIsBlown] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (step === 'cake' && !isBlown) {
      const startMicrophone = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
          microphoneRef.current.connect(analyserRef.current);
          
          analyserRef.current.fftSize = 256;
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkAudioLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Threshold for detecting blowing (might need adjustment depending on mic)
            if (average > 80) {
              setIsBlown(true);
            } else {
              animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
            }
          };

          checkAudioLevel();
        } catch (err) {
          console.error('Error accessing microphone:', err);
        }
      };
      
      startMicrophone();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (microphoneRef.current) {
        microphoneRef.current.mediaStream.getTracks().forEach(track => track.stop());
        microphoneRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [step, isBlown]);

  return (
    <div className="w-full h-screen bg-[#050b14] overflow-hidden font-sans text-white relative">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-auto bg-[#050b14]"
          >
            <GeminiConstellationBackground />
            <h1 className="text-4xl sm:text-6xl mb-12 text-center text-white [text-shadow:0_0_20px_#3399ff,0_0_40px_#3399ff] z-10 relative font-serif">
              每一岁，都珍贵
            </h1>
            <button
              onClick={() => setStep('cake')}
              className="bg-white text-black px-8 py-3 rounded-full font-bold tracking-widest hover:bg-gray-200 transition-colors uppercase text-sm z-10 relative font-serif"
            >
              进入许愿
            </button>
            <div className="absolute bottom-12 flex flex-col items-center gap-1 z-10 pointer-events-none">
              <span className="text-white/50 font-bold tracking-[0.2em] uppercase text-sm">Gemini</span>
              <span className="text-white/50 font-bold tracking-[0.2em] text-sm">06.09</span>
            </div>
          </motion.div>
        )}

        {step === 'wish' && (
          <motion.div
            key="wish"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 pointer-events-auto"
          >
            <div className="border border-blue-500/30 bg-blue-900/20 backdrop-blur-md rounded-[2rem] p-8 sm:p-12 text-center max-w-sm w-full mx-auto relative overflow-hidden shadow-2xl shadow-blue-900/50">
               <div className="absolute inset-0 border-2 border-blue-400 rounded-[2rem] opacity-20 pointer-events-none"></div>
               <div className="font-serif flex flex-col items-center mb-8 pt-2 text-center">
                 <h2 className="text-4xl sm:text-5xl text-blue-200 tracking-widest font-medium mb-3">
                   生日快乐
                 </h2>
                 <h3 className="text-3xl sm:text-4xl text-blue-300 tracking-[0.2em] mb-6">
                   王欣怡
                 </h3>
                 <div className="h-[1px] w-12 bg-blue-400/50 mb-6"></div>
                 <p className="text-xl sm:text-2xl text-blue-100/90 leading-[2.2] font-light tracking-wide">
                   愿你的新岁<br/>如星辰般闪耀
                 </p>
               </div>
               
               <button
                 onClick={() => {
                   setIsBlown(false);
                   setStep('cake');
                 }}
                 className="bg-[#1e3a8a] text-blue-100 px-6 py-4 rounded-full font-bold tracking-wider hover:bg-blue-800 transition-colors text-sm w-full shadow-lg shadow-blue-500/20 font-serif"
               >
                 再次许愿
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-0">
        {(step === 'cake' || step === 'wish') && (
          <Canvas camera={{ position: [0, 1.5, 12], fov: 60 }} dpr={[1, 2]}>
             <ambientLight intensity={0.5} />
             <ParticleCake
                isBlown={isBlown}
                onBlownComplete={() => {
                  setTimeout(() => setStep('wish'), 2500);
                }}
             />
             <BackgroundStars />
          </Canvas>
        )}
      </div>

      {step === 'cake' && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
          <AnimatePresence>
            {!isBlown && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                className="w-full text-center mt-8"
              >
                <h2 className="text-5xl sm:text-6xl text-blue-100 mb-4 font-serif">生日快乐</h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] w-12 bg-blue-400/50"></div>
                  <p className="tracking-[0.4em] text-blue-300 text-sm uppercase font-serif">王欣怡</p>
                  <div className="h-[1px] w-12 bg-blue-400/50"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isBlown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                className="w-full flex justify-center mb-8 pointer-events-auto"
              >
                <button
                  onClick={() => setIsBlown(true)}
                  className="bg-blue-950/60 backdrop-blur-md border border-blue-500/40 text-blue-200 px-8 py-4 rounded-full font-bold tracking-widest hover:bg-blue-900/80 transition-all active:scale-95 shadow-lg shadow-blue-900/50 flex items-center justify-center font-serif"
                >
                  吹蜡烛许愿
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function GeminiConstellationBackground() {
  const points = [
    { id: 0, x: 23, y: 18, r: 3.5 }, // L_Head
    { id: 1, x: 27, y: 28, r: 2 },   // L_Shoulder
    { id: 2, x: 13, y: 30, r: 1.5 }, // L_Hand_L
    { id: 3, x: 27, y: 48, r: 2 },   // L_Waist
    { id: 4, x: 10, y: 64, r: 1.5 }, // L_Knee_L
    { id: 5, x: 26, y: 90, r: 2.5 }, // L_Foot_L
    { id: 6, x: 33, y: 62, r: 1.5 }, // L_Knee_R
    { id: 7, x: 44, y: 86, r: 3 },   // L_Foot_R
    
    { id: 8, x: 42, y: 14, r: 2.5 }, // R_Head
    { id: 9, x: 47, y: 21, r: 1.5 }, // R_Neck
    { id: 10, x: 56, y: 32, r: 2 },  // R_Shoulder
    { id: 11, x: 78, y: 32, r: 1.5 },// R_Hand_R
    { id: 12, x: 60, y: 56, r: 2.5 },// R_Waist
    { id: 13, x: 60, y: 84, r: 2 },  // R_Foot_L
    { id: 14, x: 70, y: 72, r: 2 },  // R_Knee_R
    { id: 15, x: 80, y: 80, r: 1.5 },// R_Ankle_R
    { id: 16, x: 92, y: 80, r: 2.5 },// R_Foot_R
    
    { id: 17, x: 39, y: 30, r: 1.5 } // Mid_Arm
  ];

  const lines = [
    // Left figure
    [0, 1], // Head to Shoulder
    [2, 1], // Left Hand to Shoulder
    [1, 17], // Shoulder to Mid Arm
    [1, 3], // Shoulder to Waist
    [3, 4], // Waist to Left Knee
    [4, 5], // Left Knee to Left Foot
    [3, 6], // Waist to Right Knee
    [6, 7], // Right Knee to Right Foot
    
    // Connection
    [17, 10], // Mid Arm to Right Shoulder
    
    // Right figure
    [8, 9], // Head to Neck
    [9, 10], // Neck to Shoulder
    [10, 11], // Shoulder to Right Hand
    [10, 12], // Shoulder to Waist
    [12, 13], // Waist to Left Foot
    [12, 14], // Waist to Right Knee
    [14, 15], // Right Knee to Right Ankle
    [15, 16] // Right Ankle to Right Foot
  ];

  const stars = useMemo(() => {
    return Array.from({ length: 200 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 0.2 + 0.05,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3,
      color: Math.random() > 0.8 ? '#99ccff' : Math.random() > 0.6 ? '#ffeb99' : '#ffffff'
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#071329] via-[#050b14] to-black">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="20%" stopColor="#93c5fd" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g opacity="0.6">
          {stars.map((s, i) => (
            <motion.circle 
              key={`star-${i}`} 
              cx={s.x} 
              cy={s.y} 
              r={s.r} 
              fill={s.color}
              initial={{ opacity: 0.1, scale: 0.5 }}
              animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.5, 1.2, 0.5] }}
              transition={{
                duration: s.duration,
                repeat: Infinity,
                delay: s.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </g>
        
        <g transform="translate(55, 45) scale(0.8) translate(-50, -50)">
          <g stroke="url(#lineGradient)" strokeWidth="0.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {lines.map((l, i) => {
              const p1 = points[l[0]];
              const p2 = points[l[1]];
              const pathData = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
              return (
                <motion.path 
                  key={`line-${i}`} 
                  d={pathData}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: "easeInOut" }}
                />
              );
            })}
          </g>
          
          <g>
            {points.map((p, i) => (
              <motion.g 
                key={`node-${p.id}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: "easeOut" }}
              >
                <motion.circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={p.r * 1.5} 
                  fill="url(#starGlow)"
                  animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 4, repeat: Infinity, delay: p.id * 0.3, ease: "easeInOut" }}
                />
                <circle cx={p.x} cy={p.y} r={p.r * 0.25} fill="#ffffff" />
              </motion.g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
