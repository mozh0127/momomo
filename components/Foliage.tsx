import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { foliageVertexShader, foliageFragmentShader } from '../shaders';
import { COLORS } from '../types';

interface FoliageProps {
  progress: number; // 0 to 1
}

export const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const count = 75000; 
  const meshRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  // Uniforms for the shader
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMorphProgress: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  }), []);

  // Geometry construction
  const { positions, scatterPositions, treePositions, colors, randoms, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scatterPos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const siz = new Float32Array(count);

    // We boost these colors significantly because single pixels need to stand out
    const colorEmerald = new THREE.Color("#004d3d"); // Much brighter than #00241B
    const colorLite = new THREE.Color("#107a5d");    // Brighter green
    const colorGold = new THREE.Color(COLORS.GOLD_METALLIC);

    for (let i = 0; i < count; i++) {
      // 1. Initial Position (Placeholder)
      pos[i * 3] = 0; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;

      // 2. Scatter Position (Random Sphere)
      const rScatter = 18 + Math.random() * 15;
      const thetaScatter = Math.random() * Math.PI * 2;
      const phiScatter = Math.acos(2 * Math.random() - 1);
      
      scatterPos[i * 3] = rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter);
      scatterPos[i * 3 + 1] = rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter);
      scatterPos[i * 3 + 2] = rScatter * Math.cos(phiScatter);

      // 3. Tree Position (Cone)
      const h = 18; // Taller tree
      const y = Math.random() * h; 
      const rBase = 7.0;
      const radiusAtY = (1 - (y / h)) * rBase; 
      
      const r = Math.sqrt(Math.random()) * radiusAtY; 
      const theta = Math.random() * Math.PI * 2;

      treePos[i * 3] = r * Math.cos(theta);
      treePos[i * 3 + 1] = y - (h/2); 
      treePos[i * 3 + 2] = r * Math.sin(theta);

      // 4. Colors & Attributes
      const mixFactor = Math.random();
      let c = new THREE.Color();
      let s = 1.0;

      if (mixFactor > 0.92) {
        // Gold sparkles
        c.copy(colorGold).multiplyScalar(1.5); 
        s = 3.0 + Math.random() * 2.0; 
      } else {
        // Green Particles
        c.lerpColors(colorEmerald, colorLite, Math.random());
        // Randomly boost some greens to add depth
        c.multiplyScalar(0.8 + Math.random() * 0.5); 
        s = 2.0 + Math.random() * 2.5; // Bigger particles to see the rim
      }

      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      siz[i] = s;
      rnd[i] = Math.random();
    }

    return {
      positions: pos,
      scatterPositions: scatterPos,
      treePositions: treePos,
      colors: col,
      randoms: rnd,
      sizes: siz
    };
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.getElapsedTime();
      
      material.uniforms.uMorphProgress.value = THREE.MathUtils.lerp(
        material.uniforms.uMorphProgress.value,
        progress,
        0.08
      );
      
      if (progress > 0.8) {
         meshRef.current.rotation.y += 0.002;
      }
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={count} array={scatterPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={count} array={treePositions} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={count} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending} 
      />
    </points>
  );
};