import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const snowVertexShader = `
  uniform float uTime;
  uniform float uHeight;
  uniform float uSpeed;
  uniform float uPixelRatio;
  
  attribute float aRandom;
  attribute float aSize;
  
  varying float vAlpha;
  varying float vRandom;

  void main() {
    vRandom = aRandom;
    vec3 pos = position;
    
    // Falling animation
    float fallDistance = uTime * (uSpeed + aRandom * 1.5); 
    
    // Wrap height logic
    float height = uHeight;
    // Offset by height/2 to center the wrap range around 0
    pos.y = mod(position.y - fallDistance + height * 0.5, height) - height * 0.5;
    
    // Complex Wind/Sway
    // Combine two sine waves for more organic motion
    float swayTime = uTime * 0.5 + aRandom * 100.0;
    float swayAmp = 0.5 + aRandom * 0.5; 
    
    pos.x += sin(swayTime) * swayAmp + sin(swayTime * 3.0) * 0.2;
    pos.z += cos(swayTime * 0.8) * swayAmp + cos(swayTime * 2.5) * 0.2;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation with Pixel Ratio support for crisp rendering on all devices
    gl_PointSize = aSize * uPixelRatio * (40.0 / -mvPosition.z);
    
    // Alpha Logic (Fade edges)
    float edgeThreshold = 8.0;
    float alphaTop = smoothstep(height * 0.5, height * 0.5 - edgeThreshold, pos.y);
    float alphaBottom = smoothstep(-height * 0.5, -height * 0.5 + edgeThreshold, pos.y);
    
    // Twinkle/Breath
    float twinkle = 0.8 + 0.2 * sin(uTime * 2.0 + aRandom * 50.0);
    
    vAlpha = 0.8 * alphaTop * alphaBottom * twinkle;
  }
`;

const snowFragmentShader = `
  varying float vAlpha;
  varying float vRandom;
  
  void main() {
    // Soft circle shape
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) discard;
    
    // Radial gradient for fluffy look
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 2.0); // Soft falloff
    
    // Silver / White Gloss Colors
    // vRandom splits them into slightly different tones of white/silver
    vec3 cWhite = vec3(1.0, 1.0, 1.0);
    vec3 cSilver = vec3(0.85, 0.90, 0.95); // Cool blue-ish silver
    
    vec3 finalColor = mix(cSilver, cWhite, step(0.5, vRandom));
    
    // Boost brightness for "Gloss/Bloom" effect
    finalColor *= 2.0;
    
    gl_FragColor = vec4(finalColor, vAlpha * strength);
  }
`;

export const AmbientParticles: React.FC = () => {
  const count = 5000;
  const meshRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHeight: { value: 60.0 },
    uSpeed: { value: 2.0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
  }), []);

  const { positions, randoms, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    const siz = new Float32Array(count);
    
    const rangeXZ = 60;
    const rangeY = 60; 
    
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * rangeXZ;
        pos[i * 3 + 1] = (Math.random() - 0.5) * rangeY;
        pos[i * 3 + 2] = (Math.random() - 0.5) * rangeXZ;
        
        rnd[i] = Math.random();
        // Varied sizes - slightly smaller generally to accommodate higher density, but keep some large
        siz[i] = 1.5 + Math.random() * 3.5; 
    }
    
    return { positions: pos, randoms: rnd, sizes: siz };
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
        const material = meshRef.current.material as THREE.ShaderMaterial;
        material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        vertexShader={snowVertexShader}
        fragmentShader={snowFragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};