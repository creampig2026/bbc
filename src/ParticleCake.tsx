import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

export function ParticleCake({ isBlown, onBlownComplete }: { isBlown: boolean, onBlownComplete: () => void }) {
  const pointsRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Group>(null);
  
  const particleCount = 15000;
  
  const { originalPositions, originalVelocities, originalColors, explosionColors, positions, velocities, colors, isFlame, explosionVelocities, textPositions, textColors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const flameFlags = new Uint8Array(particleCount);
    
    const origPos = new Float32Array(particleCount * 3);
    const origVel = new Float32Array(particleCount * 3);
    const origCol = new Float32Array(particleCount * 3);
    const explCol = new Float32Array(particleCount * 3);
    
    const cakeColors = [
      new THREE.Color('#3399ff'),
      new THREE.Color('#88ccff'),
      new THREE.Color('#ffffff'),
    ];

    const candleColors = [
      new THREE.Color('#ffcc00'),
      new THREE.Color('#ffddaa')
    ];

    const flameColors = [
      new THREE.Color('#ff5500'),
      new THREE.Color('#ff3300'),
      new THREE.Color('#ff8800')
    ];

    let index = 0;

    const cakeCount = 11900;
    for (let i = 0; i < cakeCount; i++) {
        const r = Math.random();
        let maxRadius, minY, maxY;
        
        if (r < 0.45) {
            maxRadius = 3.2; minY = -2; maxY = -0.5;
        } else if (r < 0.8) {
            maxRadius = 2.4; minY = -0.5; maxY = 1;
        } else {
            maxRadius = 1.6; minY = 1; maxY = 2.2;
        }

        const radius = maxRadius * Math.pow(Math.random(), 0.5);
        const theta = Math.random() * Math.PI * 2;
        
        let y = minY + Math.random() * (maxY - minY);
        if (Math.random() < 0.2) y = maxY; // top frost
        if (Math.random() < 0.1) y = minY; // bottom edge
        if (Math.random() < 0.4) {
            // Push to edges
            pos[index * 3] = Math.cos(theta) * maxRadius;
            pos[index * 3 + 2] = Math.sin(theta) * maxRadius;
        } else {
            pos[index * 3] = Math.cos(theta) * radius;
            pos[index * 3 + 2] = Math.sin(theta) * radius;
        }
        
        pos[index * 3 + 1] = y;
        
        vel[index * 3] = 0;
        vel[index * 3 + 1] = 0;
        vel[index * 3 + 2] = 0;
        
        const c = cakeColors[Math.floor(Math.random() * cakeColors.length)];
        col[index * 3] = c.r;
        col[index * 3 + 1] = c.g;
        col[index * 3 + 2] = c.b;
        
        origPos[index * 3] = pos[index * 3];
        origPos[index * 3 + 1] = pos[index * 3 + 1];
        origPos[index * 3 + 2] = pos[index * 3 + 2];
        origCol[index * 3] = col[index * 3];
        origCol[index * 3 + 1] = col[index * 3 + 1];
        origCol[index * 3 + 2] = col[index * 3 + 2];
        explCol[index * 3] = col[index * 3];
        explCol[index * 3 + 1] = col[index * 3 + 1];
        explCol[index * 3 + 2] = col[index * 3 + 2];
        
        flameFlags[index] = 0;
        index++;
    }

    const candleShapes = [
      {
        // 2
        cx: -0.35, cz: 0,
        points: (() => {
          const pts: number[][] = [];
          for (let t = Math.PI * 0.85; t >= -Math.PI / 4.5; t -= 0.05) {
            pts.push([Math.cos(t) * 0.18, 2.825 + Math.sin(t) * 0.175]);
          }
          pts.push([-0.18, 2.3]);
          pts.push([0.2, 2.3]);
          return pts;
        })(),
        flamePos: [0.0, 3.05]
      },
      {
        // 3
        cx: 0.35, cz: 0,
        points: (() => {
          const pts: number[][] = [];
          for (let t = Math.PI * 0.85; t >= -Math.PI / 2; t -= 0.05) {
            pts.push([Math.cos(t) * 0.16, 2.84 + Math.sin(t) * 0.16]);
          }
          for (let t = Math.PI / 2; t >= -Math.PI * 0.85; t -= 0.05) {
            pts.push([Math.cos(t) * 0.18, 2.49 + Math.sin(t) * 0.19]);
          }
          return pts;
        })(),
        flamePos: [0.0, 3.05]
      }
    ];

    candleShapes.forEach(shape => {
       const { cx, cz, points, flamePos } = shape;
       
       let totalLength = 0;
       const lengths = [];
       for(let i=0; i<points.length-1; i++) {
           const d = Math.hypot(points[i+1][0] - points[i][0], points[i+1][1] - points[i][1]);
           lengths.push(d);
           totalLength += d;
       }
       
       for(let j=0; j<800; j++) {
           let target = Math.random() * totalLength;
           let px = points[points.length-1][0];
           let py = points[points.length-1][1];
           for(let i=0; i<lengths.length; i++) {
               if(target <= lengths[i] || i === lengths.length - 1) {
                   const w = Math.max(0, Math.min(1, target / lengths[i]));
                   px = points[i][0] * (1-w) + points[i+1][0] * w;
                   py = points[i][1] * (1-w) + points[i+1][1] * w;
                   break;
               }
               target -= lengths[i];
           }
           
           const u = Math.random();
           const v = Math.random();
           const phi = Math.acos(2 * v - 1);
           const pTheta = 2 * Math.PI * u;
           const sR = 0.05 * Math.cbrt(Math.random());
           
           pos[index * 3] = cx + px + sR * Math.sin(phi) * Math.cos(pTheta);
           pos[index * 3 + 1] = py + sR * Math.cos(phi);
           pos[index * 3 + 2] = cz + sR * Math.sin(phi) * Math.sin(pTheta);

           vel[index * 3] = 0;
           vel[index * 3 + 1] = 0;
           vel[index * 3 + 2] = 0;

           const c = candleColors[Math.floor(Math.random() * candleColors.length)];
           col[index * 3] = c.r; col[index * 3 + 1] = c.g; col[index * 3 + 2] = c.b;
           
           origPos[index * 3] = pos[index * 3];
           origPos[index * 3 + 1] = pos[index * 3 + 1];
           origPos[index * 3 + 2] = pos[index * 3 + 2];
           origCol[index * 3] = col[index * 3];
           origCol[index * 3 + 1] = col[index * 3 + 1];
           origCol[index * 3 + 2] = col[index * 3 + 2];
           explCol[index * 3] = col[index * 3];
           explCol[index * 3 + 1] = col[index * 3 + 1];
           explCol[index * 3 + 2] = col[index * 3 + 2];
           
           flameFlags[index] = 0;
           index++;
       }

       for(let j=0; j<750; j++) {
           const h = Math.random();
           const shapeW = (1 - h) * (0.2 + 0.8 * Math.sin(h * Math.PI));
           const radius = 0.15 * shapeW * Math.random();
           const theta = Math.random() * Math.PI * 2;
           
           pos[index * 3] = cx + flamePos[0] + Math.cos(theta) * radius;
           pos[index * 3 + 1] = flamePos[1] + h * 0.6;
           pos[index * 3 + 2] = cz + Math.sin(theta) * radius;

           const outwardSpeed = 3.0 + Math.random() * 5.0;
           vel[index * 3] = Math.cos(theta) * outwardSpeed;
           vel[index * 3 + 1] = 2.0 + Math.random() * 5.0;
           vel[index * 3 + 2] = Math.sin(theta) * outwardSpeed;

           const c = flameColors[Math.floor(Math.random() * flameColors.length)];
           const cExpl = cakeColors[Math.floor(Math.random() * cakeColors.length)];
           col[index * 3] = c.r; col[index * 3 + 1] = c.g; col[index * 3 + 2] = c.b;
           
           origPos[index * 3] = pos[index * 3];
           origPos[index * 3 + 1] = pos[index * 3 + 1];
           origPos[index * 3 + 2] = pos[index * 3 + 2];
           origVel[index * 3] = vel[index * 3];
           origVel[index * 3 + 1] = vel[index * 3 + 1];
           origVel[index * 3 + 2] = vel[index * 3 + 2];
           origCol[index * 3] = col[index * 3];
           origCol[index * 3 + 1] = col[index * 3 + 1];
           origCol[index * 3 + 2] = col[index * 3 + 2];
           explCol[index * 3] = cExpl.r;
           explCol[index * 3 + 1] = cExpl.g;
           explCol[index * 3 + 2] = cExpl.b;
           
           flameFlags[index] = 1;
           index++;
       }
    });
    
    const explosionVelocities = new Float32Array(particleCount * 3);
    const textPositions = new Float32Array(particleCount * 3);
    const textColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const speed = 12.0 + Math.random() * 20.0;
        explosionVelocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
        explosionVelocities[i * 3 + 1] = Math.cos(phi) * speed;
        explosionVelocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    const textFinalColors = [
      new THREE.Color('#ffaa00'),
      new THREE.Color('#3399ff'),
      new THREE.Color('#88ccff'),
      new THREE.Color('#ffffff')
    ];
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 90px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('公主', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('请发财', canvas.width / 2, canvas.height / 2 + 50);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const validPoints: {x:number, y:number}[] = [];
        for (let y = 0; y < canvas.height; y += 2) {
          for (let x = 0; x < canvas.width; x += 2) {
            const idx = (y * canvas.width + x) * 4;
            if (imgData[idx] > 128) {
               validPoints.push({ 
                 x: (x - canvas.width / 2) * 0.022, 
                 y: -(y - canvas.height / 2) * 0.022 + 1.0 
               });
            }
          }
        }
        
        if (validPoints.length > 0) {
          // Shuffle to avoid pattern artifacts
          const shuffledTokens = [...validPoints].sort(() => Math.random() - 0.5);
          for (let i = 0; i < particleCount; i++) {
            const p = shuffledTokens[i % shuffledTokens.length];
            textPositions[i * 3] = p.x + (Math.random() - 0.5) * 0.04;
            textPositions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.04;
            textPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
            
            const c = textFinalColors[Math.floor(Math.random() * textFinalColors.length)];
            textColors[i * 3] = c.r;
            textColors[i * 3 + 1] = c.g;
            textColors[i * 3 + 2] = c.b;
          }
        }
      }
    } catch (e) {
      console.error('Canvas text generation failed', e);
    }
    
    return { 
      originalPositions: origPos, 
      originalVelocities: origVel, 
      originalColors: origCol, 
      explosionColors: explCol,
      positions: pos, 
      velocities: vel, 
      colors: col, 
      isFlame: flameFlags,
      explosionVelocities,
      textPositions,
      textColors
    };
  }, []);

  const blowTimeRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useFrame((state, delta) => {
    if (pointsRef.current) {
        const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const colArray = pointsRef.current.geometry.attributes.color.array as Float32Array;
        
        if (isBlown) {
          if (blowTimeRef.current === null) {
            blowTimeRef.current = state.clock.elapsedTime;
            phaseRef.current = 1;
            for (let i = 0; i < particleCount; i++) {
              if (isFlame[i] === 1) {
                colArray[i * 3] = explosionColors[i * 3];
                colArray[i * 3 + 1] = explosionColors[i * 3 + 1];
                colArray[i * 3 + 2] = explosionColors[i * 3 + 2];
              }
            }
          }
          
          const timeSinceBlow = state.clock.elapsedTime - blowTimeRef.current;
          
          let currentRotSpeed = 0;
          if (timeSinceBlow > 2.0 && timeSinceBlow < 4.0) {
             currentRotSpeed = 0.03;
          } else if (timeSinceBlow >= 4.0 && timeSinceBlow < 8.0) {
             currentRotSpeed = 0.03 * (1.0 - (timeSinceBlow - 4.0) / 4.0);
          }
          
          if (currentRotSpeed > 0) {
             const angle = delta * currentRotSpeed;
             const cos = Math.cos(angle);
             const sin = Math.sin(angle);
             for(let i=0; i<particleCount; i++) {
                const px = posArray[i * 3];
                const pz = posArray[i * 3 + 2];
                posArray[i * 3] = px * cos - pz * sin;
                posArray[i * 3 + 2] = px * sin + pz * cos;
             }
          }
          
          if (timeSinceBlow < 2.0) {
            // PHASE 1: Candles blow out, cake is static
            for (let i = 0; i < particleCount; i++) {
              if (isFlame[i] === 1) {
                posArray[i * 3] += velocities[i * 3] * delta;
                posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta;
                posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta;
                
                velocities[i * 3] *= 0.96;
                velocities[i * 3 + 1] -= 3 * delta;
                velocities[i * 3 + 2] *= 0.96;
                
                colArray[i * 3] *= 0.95;
                colArray[i * 3 + 1] *= 0.95;
                colArray[i * 3 + 2] *= 0.95;
              }
            }
          } else if (timeSinceBlow < 4.0) {
            // PHASE 2: Cake explosion (Starry field)
            if (phaseRef.current === 1) {
               phaseRef.current = 2;
               for (let i = 0; i < particleCount; i++) {
                 // Initialize explosion velocities for all particles
                 velocities[i * 3] = explosionVelocities[i * 3];
                 velocities[i * 3 + 1] = explosionVelocities[i * 3 + 1] + 5.0; // slight upward bias
                 velocities[i * 3 + 2] = explosionVelocities[i * 3 + 2];
                 
                 // Make sure non-flame particles glow too
                 if (isFlame[i] === 0) {
                   colArray[i * 3] = explosionColors[i * 3];
                   colArray[i * 3 + 1] = explosionColors[i * 3 + 1];
                   colArray[i * 3 + 2] = explosionColors[i * 3 + 2];
                 }
               }
            }
            
            for (let i = 0; i < particleCount; i++) {
               posArray[i * 3] += velocities[i * 3] * delta;
               posArray[i * 3 + 1] += velocities[i * 3 + 1] * delta;
               posArray[i * 3 + 2] += velocities[i * 3 + 2] * delta;
               
               // Heavy drag for 'space stopping' effect
               velocities[i * 3] *= 0.95;
               velocities[i * 3 + 1] *= 0.95;
               velocities[i * 3 + 2] *= 0.95;
               
               // Gradually blend text colors
               colArray[i * 3] += (textColors[i * 3] - colArray[i * 3]) * 0.05;
               colArray[i * 3 + 1] += (textColors[i * 3 + 1] - colArray[i * 3 + 1]) * 0.05;
               colArray[i * 3 + 2] += (textColors[i * 3 + 2] - colArray[i * 3 + 2]) * 0.05;
            }
          } else if (timeSinceBlow < 8.0) {
            // PHASE 3: Gather to form "生日快乐"
            if (phaseRef.current === 2) {
               phaseRef.current = 3;
            }
            
            for (let i = 0; i < particleCount; i++) {
               posArray[i * 3] += (textPositions[i * 3] - posArray[i * 3]) * 0.06;
               posArray[i * 3 + 1] += (textPositions[i * 3 + 1] - posArray[i * 3 + 1]) * 0.06;
               posArray[i * 3 + 2] += (textPositions[i * 3 + 2] - posArray[i * 3 + 2]) * 0.06;
               
               colArray[i * 3] += (textColors[i * 3] - colArray[i * 3]) * 0.1;
               colArray[i * 3 + 1] += (textColors[i * 3 + 1] - colArray[i * 3 + 1]) * 0.1;
               colArray[i * 3 + 2] += (textColors[i * 3 + 2] - colArray[i * 3 + 2]) * 0.1;
            }
            
            if (timeSinceBlow > 6.0 && phaseRef.current === 3) {
               phaseRef.current = 4;
               if (onBlownComplete) onBlownComplete();
            }
          } else {
            // PHASE 4: Float gently as text
            const t = state.clock.elapsedTime;
            for (let i = 0; i < particleCount; i++) {
               posArray[i * 3] = textPositions[i * 3] + Math.sin(t * 2 + i) * 0.02;
               posArray[i * 3 + 1] = textPositions[i * 3 + 1] + Math.cos(t * 1.5 + i) * 0.02;
            }
          }

          if (glowRef.current) {
            glowRef.current.scale.setScalar(Math.max(0, glowRef.current.scale.x - delta * 5));
          }
          
          pointsRef.current.geometry.attributes.position.needsUpdate = true;
          pointsRef.current.geometry.attributes.color.needsUpdate = true;
        } else {
          if (glowRef.current) {
             glowRef.current.scale.setScalar(1.0);
          }

          // Check for reset
          if (blowTimeRef.current !== null) {
             blowTimeRef.current = null;
             pointsRef.current.rotation.set(0, 0, 0); // Reset rotation entirely
             // Reset all particles
             for (let i = 0; i < particleCount; i++) {
                 posArray[i * 3] = originalPositions[i * 3];
                 posArray[i * 3 + 1] = originalPositions[i * 3 + 1];
                 posArray[i * 3 + 2] = originalPositions[i * 3 + 2];
                 velocities[i * 3] = originalVelocities[i * 3];
                 velocities[i * 3 + 1] = originalVelocities[i * 3 + 1];
                 velocities[i * 3 + 2] = originalVelocities[i * 3 + 2];
                 colArray[i * 3] = originalColors[i * 3];
                 colArray[i * 3 + 1] = originalColors[i * 3 + 1];
                 colArray[i * 3 + 2] = originalColors[i * 3 + 2];
             }
             pointsRef.current.geometry.attributes.position.needsUpdate = true;
             pointsRef.current.geometry.attributes.color.needsUpdate = true;
          }
          
          // Flame flicker effect
          const time = state.clock.elapsedTime;
          for (let i = 0; i < particleCount; i++) {
             if (isFlame[i] === 1) {
                 const yOffset = originalPositions[i * 3 + 1] - 3.05; // approx 0 to 0.6
                 const wiggle = Math.sin(time * 15 + yOffset * 10 + i) * 0.02 * yOffset;
                 posArray[i * 3] = originalPositions[i * 3] + wiggle;
                 posArray[i * 3 + 2] = originalPositions[i * 3 + 2] + Math.cos(time * 12 + yOffset * 10 + i) * 0.02 * yOffset;
                 
                 const intensityWiggle = 0.8 + 0.2 * Math.sin(time * 20 + i);
                 colArray[i * 3] = originalColors[i * 3] * intensityWiggle;
                 colArray[i * 3 + 1] = originalColors[i * 3 + 1] * intensityWiggle;
                 colArray[i * 3 + 2] = originalColors[i * 3 + 2] * intensityWiggle;
             }
          }
          pointsRef.current.geometry.attributes.position.needsUpdate = true;
          pointsRef.current.geometry.attributes.color.needsUpdate = true;
        }
    }
  });

  return (
    <group position={[0, -0.5, 0]} rotation={[0, 0, 0]}>
      <OrbitControls 
        enablePan={false} 
        enableDamping
        dampingFactor={0.05}
      />
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          size={0.06} 
          vertexColors 
          transparent 
          opacity={0.8} 
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Yellow Glow for Flames */}
      <group ref={glowRef}>
        {[0, 1].map((i) => {
          const shapes = [
            { cx: -0.35, flameY: 3.35 },
            { cx: 0.35, flameY: 3.35 }
          ];
          const x = shapes[i].cx;
          const z = 0;
          return (
            <group key={`glow-${i}`} position={[x, shapes[i].flameY, z]}>
              <mesh>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshBasicMaterial color="#ffaa00" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshBasicMaterial color="#ffcc00" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            </group>
          )
        })}
      </group>
    </group>
  );
}

export function BackgroundStars() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions } = useMemo(() => {
    const count = 1000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    }
    return { positions: pos };
  }, []);
  
  useFrame((_, delta) => {
      if (pointsRef.current) {
          pointsRef.current.rotation.y += delta * 0.05;
          pointsRef.current.rotation.x += delta * 0.02;
      }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.08} 
        color="#ffffff" 
        transparent 
        opacity={0.3} 
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
