import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../types';

interface OrnamentsProps {
  progress: number;
}

export const Ornaments: React.FC<OrnamentsProps> = ({ progress }) => {
  const baubleCount = 120; // Medium (Standard Ornaments on branches)
  const starCount = 1200;  // Light (Fairy Lights/Stars)
  
  // Heavy elements split (Bottom pile)
  const heavyBoxCount = 20;
  const heavySphereCount = 25; // Increased slightly for density
  const heavyGemCount = 20;

  const baubleRef = useRef<THREE.InstancedMesh>(null);
  const starRef = useRef<THREE.InstancedMesh>(null);
  
  const heavyBoxRef = useRef<THREE.InstancedMesh>(null);
  const heavySphereRef = useRef<THREE.InstancedMesh>(null);
  const heavyGemRef = useRef<THREE.InstancedMesh>(null);

  const tempObj = useMemo(() => new THREE.Object3D(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  
  // --- Data Generation Helpers ---

  type OrnamentType = 'bauble' | 'star' | 'heavyBox' | 'heavySphere' | 'heavyGem';

  const generateData = (count: number, type: OrnamentType) => {
    const data = [];
    const height = 16;
    const baseRadius = 6.5;

    // --- VIVID COLOR PALETTE (High Gloss / Saturated) ---
    // Instead of dark velvet colors, we use bright saturated colors that work well with Metalness=1.0
    const cVividRed = new THREE.Color("#ff0040"); // Bright Crimson
    const cVividGold = new THREE.Color("#ffcc00"); // Rich Yellow Gold
    const cVividGreen = new THREE.Color("#00dd66"); // Bright Emerald
    const cVividBlue = new THREE.Color("#0066ff"); // Sapphire (accent)
    const cVividWhite = new THREE.Color("#ffffff");
    
    // Standard Palette references
    const cWhite = new THREE.Color(COLORS.WHITE_WARM).multiplyScalar(2.0); 

    const isHeavy = type.startsWith('heavy');

    for (let i = 0; i < count; i++) {
        // 1. Scatter Position
        let rS, yBias;
        
        if (isHeavy) {
           // Heavy items scatter lower and stay closer to ground
           rS = 8 + Math.random() * 10;
           yBias = -5; 
        } else if (type === 'star') {
           rS = 25 + Math.random() * 25;
           yBias = 12; 
        } else {
           rS = 12 + Math.random() * 15;
           yBias = 0;
        }

        const thetaS = Math.random() * Math.PI * 2;
        const phiS = Math.acos(2 * Math.random() - 1);
        
        const scatterPos = new THREE.Vector3(
            rS * Math.sin(phiS) * Math.cos(thetaS),
            rS * Math.sin(phiS) * Math.sin(thetaS) + yBias,
            rS * Math.cos(phiS)
        );

        // 2. Tree Position
        let yT, rT, thetaT;
        if (isHeavy) {
            // Heavy items accumulate at the base of the tree
            // Range from -8 (base) to -2 (lower branches)
            yT = (Math.random() * 6) - 8; 
            rT = (Math.random() * 4) + 2.0; 
        } else {
            yT = (Math.random() * height) - (height/2);
            const nh = (yT + (height/2)) / height;
            const coneR = (1 - nh) * baseRadius;
            const offset = type === 'star' ? (0.2 + Math.random() * 2.0) : (Math.random() * 0.5);
            rT = coneR + offset;
        }
        
        thetaT = Math.random() * Math.PI * 2;
        const treePos = new THREE.Vector3(rT * Math.cos(thetaT), yT, rT * Math.sin(thetaT));

        // 3. Scale & Weight
        let scale, weight;
        if (isHeavy) {
            weight = 0.8 + Math.random() * 0.2; // Heavy
            
            if (type === 'heavySphere') {
                // REDUCED SIZE: Heavy spheres are now smaller and more delicate than boxes
                scale = 0.2 + Math.random() * 0.2; 
            } else {
                // Boxes and Gems remain large and chunky
                scale = 0.35 + Math.random() * 0.3; 
            }

        } else if (type === 'star') {
            scale = 0.05 + Math.random() * 0.08; 
            weight = 0.02 + Math.random() * 0.1; 
        } else {
            scale = 0.2 + Math.random() * 0.25; 
            weight = 0.4 + Math.random() * 0.3; 
        }

        // 4. Color Logic (Vivid & Glossy)
        let color = new THREE.Color();
        const roll = Math.random();

        if (isHeavy) {
             // For heavy items, we want PURE VIVID colors to pop against the gold floor
             if (type === 'heavyGem') {
                 // Gems: Deep Emerald, Ruby, or Bright Diamond/Gold
                 if (roll < 0.3) color.copy(cVividGreen).multiplyScalar(1.2);
                 else if (roll < 0.6) color.copy(cVividRed).multiplyScalar(1.2);
                 else color.copy(cVividWhite);
             } else {
                 // Heavy Boxes/Spheres: Mix of Red/Green/Gold/Blue
                 if (roll < 0.35) color.copy(cVividRed);
                 else if (roll < 0.60) color.copy(cVividGold);
                 else if (roll < 0.85) color.copy(cVividGreen);
                 else color.copy(cVividBlue);
             }
        } else if (type === 'bauble') {
            // Standard baubles
            if (roll < 0.45) color.copy(cVividGold);
            else if (roll < 0.75) color.copy(cVividRed);
            else color.copy(cVividGreen);
            color.multiplyScalar(1.2); // Boost brightness
        } else {
            // Stars
            if (roll < 0.8) color.copy(cWhite);
            else color.copy(cVividGold);
        }

        data.push({ 
            scatterPos, 
            treePos, 
            scale, 
            color, 
            weight, 
            randomRotation: [Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI] 
        });
    }
    return data;
  };

  const baubles = useMemo(() => generateData(baubleCount, 'bauble'), []);
  const stars = useMemo(() => generateData(starCount, 'star'), []);
  
  const heavyBoxes = useMemo(() => generateData(heavyBoxCount, 'heavyBox'), []);
  const heavySpheres = useMemo(() => generateData(heavySphereCount, 'heavySphere'), []);
  const heavyGems = useMemo(() => generateData(heavyGemCount, 'heavyGem'), []);

  // --- Animation Loop ---

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    const animateGroup = (ref: React.RefObject<THREE.InstancedMesh>, dataSet: any[], type: OrnamentType) => {
        if (!ref.current) return;
        const isHeavy = type.startsWith('heavy');

        for (let i = 0; i < dataSet.length; i++) {
            const data = dataSet[i];
            
            // 1. Morphing
            const ease = (t: number) => t<.5 ? 2*t*t : -1+(4-2*t)*t;
            const t = ease(progress);

            tempPos.lerpVectors(data.scatterPos, data.treePos, t);

            // 2. Floating
            if (progress < 0.98 || type === 'star') {
                const floatAmp = (1.0 - data.weight) * (progress < 0.98 ? 1.5 : 0.1); 
                const floatFreq = 0.5 + (1.0 - data.weight); 
                
                tempPos.y += Math.sin(time * floatFreq + i) * floatAmp * (1 - progress * 0.9);
                
                if (type === 'star') {
                    const drift = Math.cos(time * 0.3 + i) * floatAmp * 0.5 * (1 - progress);
                    tempPos.x += drift;
                    tempPos.z += Math.sin(time * 0.3 + i) * floatAmp * 0.5 * (1 - progress);
                }
            }

            // 3. Rotation
            if (isHeavy && progress > 0.8) {
                // Heavy items settle on ground/base
                 tempObj.rotation.set(0, data.randomRotation[1], 0);
            } else {
                tempObj.rotation.set(
                    data.randomRotation[0] + time * (0.2 / (data.weight + 0.1)),
                    data.randomRotation[1] + time * (0.1 / (data.weight + 0.1)),
                    data.randomRotation[2]
                );
            }

            // 4. Scale
            let s = data.scale;
            if (type === 'star') {
                const twinkle = Math.sin(time * 3.0 + i * 10.0);
                s *= (0.8 + 0.5 * twinkle); 
            } else {
                 s *= (0.9 + 0.1 * Math.sin(time + i));
            }
            tempObj.scale.setScalar(s);

            tempObj.position.copy(tempPos);
            tempObj.updateMatrix();
            ref.current!.setMatrixAt(i, tempObj.matrix);
        }

        ref.current.instanceMatrix.needsUpdate = true;
        if (progress > 0.8) ref.current.rotation.y += 0.001;
    };

    animateGroup(baubleRef, baubles, 'bauble');
    animateGroup(starRef, stars, 'star');
    animateGroup(heavyBoxRef, heavyBoxes, 'heavyBox');
    animateGroup(heavySphereRef, heavySpheres, 'heavySphere');
    animateGroup(heavyGemRef, heavyGems, 'heavyGem');
  });

  // Initial color
  useLayoutEffect(() => {
    const applyColors = (ref: React.RefObject<THREE.InstancedMesh>, dataSet: any[]) => {
        if (ref.current) {
            dataSet.forEach((data, i) => ref.current!.setColorAt(i, data.color));
            ref.current.instanceColor!.needsUpdate = true;
        }
    };
    applyColors(baubleRef, baubles);
    applyColors(starRef, stars);
    applyColors(heavyBoxRef, heavyBoxes);
    applyColors(heavySphereRef, heavySpheres);
    applyColors(heavyGemRef, heavyGems);
  }, []);

  return (
    <group>
      {/* 1. Medium Ornaments (High Gloss Baubles) */}
      <instancedMesh ref={baubleRef} args={[undefined, undefined, baubleCount]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
            metalness={1.0} roughness={0.05} envMapIntensity={3.0}
        />
      </instancedMesh>

      {/* 2. Light Ornaments (Stars/Lights) */}
      <instancedMesh ref={starRef} args={[undefined, undefined, starCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
            emissiveIntensity={4} toneMapped={false} color="#ffffff" emissive="#ffffff"
        />
      </instancedMesh>

      {/* --- HEAVY ELEMENTS (Vivid & Glossy) --- */}

      {/* 3a. Heavy Boxes - High Gloss */}
      <instancedMesh ref={heavyBoxRef} args={[undefined, undefined, heavyBoxCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
            metalness={0.95} 
            roughness={0.1} 
            envMapIntensity={3.5}
            color="#ffffff" // Base white lets instance color shine through
        />
      </instancedMesh>

      {/* 3b. Heavy Spheres - Smaller Size & Extreme Gloss */}
      <instancedMesh ref={heavySphereRef} args={[undefined, undefined, heavySphereCount]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial 
            metalness={1.0} 
            roughness={0.05} 
            envMapIntensity={4.0}
            color="#ffffff"
        />
      </instancedMesh>

       {/* 3c. Heavy Gems - Faceted & Jewel-like */}
      <instancedMesh ref={heavyGemRef} args={[undefined, undefined, heavyGemCount]}>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
            metalness={1.0} 
            roughness={0.0} 
            envMapIntensity={5.0}
            flatShading={true} 
            color="#ffffff"
        />
      </instancedMesh>

    </group>
  );
};