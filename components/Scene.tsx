import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { AmbientParticles } from './AmbientParticles';
import { GoldenSpirals } from './GoldenSpirals';
import * as THREE from 'three';

interface SceneProps {
  isFormed: boolean;
}

export const Scene: React.FC<SceneProps> = ({ isFormed }) => {
  // Use a ref to animate the progress value independently of React renders for performance
  const progressRef = useRef(0);
  const starRef = useRef<THREE.Group>(null);
  const starMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const starLightRef = useRef<THREE.PointLight>(null);
  
  const [animProgress, setAnimProgress] = useState(0);

  // --- Star Geometry Generation ---
  const { starShape, extrudeSettings } = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.9;
    const innerRadius = 0.45;
    
    for (let i = 0; i < points * 2; i++) {
        // -PI/2 to start at top center
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    
    // Sharp edges ("正角") - No bevels
    const settings = {
        depth: 0.2, 
        bevelEnabled: false, 
    };
    
    return { starShape: shape, extrudeSettings: settings };
  }, []);

  useFrame((state, delta) => {
    const target = isFormed ? 1 : 0;
    const speed = 1.5; 
    // Simple linear interpolation with clamp
    const diff = target - progressRef.current;
    if (Math.abs(diff) > 0.001) {
        progressRef.current += diff * speed * delta;
        // Clamp
        if (target === 1 && progressRef.current > 1) progressRef.current = 1;
        if (target === 0 && progressRef.current < 0) progressRef.current = 0;
        
        setAnimProgress(progressRef.current);
    }

    const time = state.clock.getElapsedTime();

    // Animate Star Rotation & Pulsing Glow
    if (starRef.current && isFormed) {
        starRef.current.rotation.y -= delta * 0.5;

        // "一闪一闪" (Twinkle/Pulse effect)
        // Sine wave between 0 and 1
        const pulse = (Math.sin(time * 5.0) + 1.0) * 0.5; 
        
        // Base intensity + pulse amount
        const glowIntensity = 2.0 + (pulse * 4.0); 

        if (starMaterialRef.current) {
            starMaterialRef.current.emissiveIntensity = glowIntensity;
        }
        if (starLightRef.current) {
            // Light pulses in sync with the mesh
            starLightRef.current.intensity = glowIntensity * 1.5 * progressRef.current;
        }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 35]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minDistance={15} 
        maxDistance={60}
        autoRotate={isFormed}
        autoRotateSpeed={0.5}
      />

      {/* Lighting - Dramatic and Warm */}
      <ambientLight intensity={0.2} color="#00100d" />
      <spotLight 
        position={[10, 40, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#fff5cc" 
        castShadow 
      />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#004433" />
      
      {/* Environment for reflections on gold */}
      <Environment preset="city" background={false} />

      {/* Ambient Snow Particles */}
      <AmbientParticles />

      <group position={[0, -2, 0]}>
         {/* The Foliage (Needles) */}
         <Foliage progress={animProgress} />
         
         {/* Golden Spirals Wrapping the Tree */}
         <GoldenSpirals progress={animProgress} />

         {/* The Ornaments (Baubles/Gifts) */}
         <Ornaments progress={animProgress} />
         
         {/* Tree Topper - Sharp 5 Pointed Star */}
         {/* Moved up to 9.6 to clear the tree top (Foliage ends at ~9.0) */}
         <group position={[0, 9.6, 0]} scale={animProgress} ref={starRef}>
             {/* Center geometry on Z axis based on depth (0.2) */}
             <mesh position={[0, 0, -0.1]}>
                <extrudeGeometry args={[starShape, extrudeSettings]} />
                <meshStandardMaterial 
                    ref={starMaterialRef}
                    color="#ffcf00"
                    emissive="#ffaa00"
                    emissiveIntensity={2}
                    metalness={1.0}
                    roughness={0.05}
                    envMapIntensity={3.0}
                />
             </mesh>
         </group>
         
         {/* Point light follows the star position */}
         <pointLight ref={starLightRef} position={[0, 9.6, 0]} intensity={0} distance={25} color="#ffaa00" />
      </group>

      {/* Post Processing for the "Cinematic Glow" */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.8} // Only very bright things glow (gold reflections, light sources)
            mipmapBlur 
            intensity={1.5} 
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </>
  );
};