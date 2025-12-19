import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const spiralVertexShader = `
  uniform float uTime;
  uniform float uMorphProgress;
  uniform float uPixelRatio;

  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aProgress; // 0.0 (bottom) to 1.0 (top) along the spiral
  attribute float aSize;
  attribute float aRandom;

  varying float vAlpha;
  varying float vProgress;

  // Cubic easing
  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    vProgress = aProgress;
    
    // Morph Logic
    float localProgress = clamp((uMorphProgress - aRandom * 0.1) / 0.9, 0.0, 1.0);
    float easedProgress = easeInOutCubic(localProgress);

    vec3 pos = mix(aScatterPos, aTreePos, easedProgress);

    // --- SPIRAL ANIMATION ---
    // When formed, add a subtle breathing/tightening effect
    if (uMorphProgress > 0.5) {
       float breath = sin(uTime * 1.5) * 0.05;
       pos.x *= (1.0 + breath);
       pos.z *= (1.0 + breath);
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // --- FLOWING SIZE EFFECT ---
    // Create a "pulse" that travels up the ribbon
    // Frequency: 15.0, Speed: 3.0
    float flow = sin(aProgress * 15.0 - uTime * 4.0);
    float sizePulse = 1.0 + flow * 0.4;
    
    // Twinkle randomly
    float twinkle = 1.0 + sin(uTime * 5.0 + aRandom * 100.0) * 0.3;

    gl_PointSize = aSize * sizePulse * twinkle * uPixelRatio * (50.0 / -mvPosition.z);
    
    // Fade out slightly at the very top of the spiral
    vAlpha = smoothstep(1.0, 0.8, aProgress);
  }
`;

const spiralFragmentShader = `
  uniform float uTime;
  varying float vAlpha;
  varying float vProgress;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Harder core, softer glow
    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 1.5);

    // --- GOLD COLOR PALETTE ---
    // Base Gold
    vec3 colorA = vec3(1.0, 0.7, 0.1); 
    // Highlight Gold (White-ish)
    vec3 colorB = vec3(1.0, 0.95, 0.8);
    
    // Flowing highlight logic matching vertex shader
    float flow = sin(vProgress * 15.0 - uTime * 4.0);
    
    // Mix colors based on flow to create bright bands
    vec3 finalColor = mix(colorA, colorB, smoothstep(0.0, 1.0, flow));
    
    // Extra brightness boost
    finalColor *= 1.5;

    gl_FragColor = vec4(finalColor, vAlpha * glow);
  }
`;

interface GoldenSpiralsProps {
  progress: number;
}

export const GoldenSpirals: React.FC<GoldenSpiralsProps> = ({ progress }) => {
  const particlesPerRibbon = 2000;
  const ribbonCount = 2;
  const totalCount = particlesPerRibbon * ribbonCount;
  
  const meshRef = useRef<THREE.Points>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMorphProgress: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
  }), []);

  const { positions, scatterPositions, treePositions, sizes, progressArray, randoms } = useMemo(() => {
    const pos = new Float32Array(totalCount * 3);
    const scatterPos = new Float32Array(totalCount * 3);
    const treePos = new Float32Array(totalCount * 3);
    const siz = new Float32Array(totalCount);
    const prog = new Float32Array(totalCount);
    const rnd = new Float32Array(totalCount);

    const height = 18;
    const baseRadius = 8.0; // Slightly wider than foliage (7.0) to wrap around
    const rotations = 3.5;

    let idx = 0;

    for (let r = 0; r < ribbonCount; r++) {
        // Offset each ribbon by PI so they are opposite
        const ribbonOffsetAngle = (r * Math.PI * 2) / ribbonCount;

        for (let i = 0; i < particlesPerRibbon; i++) {
            const t = i / particlesPerRibbon; // 0 to 1 (bottom to top)

            // --- TREE POSITION (SPIRAL) ---
            // Calculate height (-h/2 to h/2)
            const y = (t * height) - (height / 2);
            
            // Radius decreases as we go up
            const radius = (1 - t) * baseRadius;
            
            // Angle increases as we go up
            const angle = (t * rotations * Math.PI * 2) + ribbonOffsetAngle;

            // Add ribbon "width" randomness
            // We perturb the radius and angle slightly
            const widthRandom = (Math.random() - 0.5) * 0.6; // Ribbon width
            const currentR = radius + widthRandom;

            treePos[idx * 3] = currentR * Math.cos(angle);
            treePos[idx * 3 + 1] = y;
            treePos[idx * 3 + 2] = currentR * Math.sin(angle);

            // --- SCATTER POSITION ---
            // Random distribution, maybe slightly wider than foliage
            const rScatter = 20 + Math.random() * 10;
            const thetaScatter = Math.random() * Math.PI * 2;
            const phiScatter = Math.acos(2 * Math.random() - 1);
            
            scatterPos[idx * 3] = rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter);
            scatterPos[idx * 3 + 1] = rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter);
            scatterPos[idx * 3 + 2] = rScatter * Math.cos(phiScatter);

            // Init Pos
            pos[idx * 3] = 0; pos[idx * 3 + 1] = 0; pos[idx * 3 + 2] = 0;

            // Attributes
            siz[idx] = 2.0 + Math.random() * 2.0; // Varied particle size
            prog[idx] = t;
            rnd[idx] = Math.random();

            idx++;
        }
    }

    return {
        positions: pos,
        scatterPositions: scatterPos,
        treePositions: treePos,
        sizes: siz,
        progressArray: prog,
        randoms: rnd
    };
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
        const material = meshRef.current.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value = state.clock.getElapsedTime();
        // Smooth lerp for the shader uniform
        material.uniforms.uMorphProgress.value = THREE.MathUtils.lerp(
            material.uniforms.uMorphProgress.value,
            progress,
            0.1
        );
        
        // Rotate the spirals slightly faster/differently than the tree for dynamic effect
        if (progress > 0.8) {
            meshRef.current.rotation.y += 0.003;
        }
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={totalCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={totalCount} array={scatterPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={totalCount} array={treePositions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={totalCount} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aProgress" count={totalCount} array={progressArray} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" count={totalCount} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        vertexShader={spiralVertexShader}
        fragmentShader={spiralFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
