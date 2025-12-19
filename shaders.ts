// Vertex Shader: Handles the interpolation (morphing) between scattered and tree positions
export const foliageVertexShader = `
  uniform float uTime;
  uniform float uMorphProgress; // 0.0 = Scattered, 1.0 = Tree
  uniform float uPixelRatio;

  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;
  attribute float aSize;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vIsGold;
  varying float vRandom;

  // Cubic easing for smooth movement
  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    vColor = aColor;
    vRandom = aRandom;
    // Simple heuristic to detect if this is a gold sparkle or green leaf based on redness
    vIsGold = step(0.5, aColor.r); 

    // Add individual offset to morph progress for organic feel
    float localProgress = clamp((uMorphProgress - aRandom * 0.2) / 0.8, 0.0, 1.0);
    float easedProgress = easeInOutCubic(localProgress);

    // Interpolate position
    vec3 newPos = mix(aScatterPos, aTreePos, easedProgress);

    // --- ENHANCED BREATHING ---
    float breath = sin(uTime * 2.0 + aRandom * 15.0) * 0.15;
    
    // Apply breathing mostly when formed as a tree
    if (uMorphProgress > 0.5) {
        vec3 breathDir = normalize(vec3(newPos.x, 0.0, newPos.z)); 
        newPos += breathDir * breath * easedProgress;
    }

    // --- FLOATING (SCATTERED) ---
    float floatAnim = sin(uTime * 0.5 + aRandom * 20.0) * 0.5;
    if (uMorphProgress < 0.5) {
        newPos.y += floatAnim * (1.0 - easedProgress);
    }

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // --- TWINKLE SIZE ---
    // Make particles pulsate in size slightly
    float twinkle = 1.0 + sin(uTime * 3.0 + aRandom * 100.0) * 0.2; 

    // Size attenuation
    gl_PointSize = aSize * twinkle * uPixelRatio * (25.0 / -mvPosition.z);
    
    // Fade out particles slightly when they are far back
    vAlpha = smoothstep(60.0, 10.0, -mvPosition.z);
  }
`;

// Fragment Shader: Draws the glowing particle with "Star Shine" effect instead of Rim
export const foliageFragmentShader = `
  uniform float uTime;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vIsGold;
  varying float vRandom;

  void main() {
    // Coordinate from 0.0 to 1.0 (center at 0.5, 0.5)
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    
    if (dist > 0.5) discard;

    // --- SOFT SHAPE ---
    // Gaussian-like falloff for a glowing point look
    // 0.0 at center -> 1.0 at edge
    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 2.0); // Smooth bell curve

    // --- STAR SHINE ANIMATION ---
    // Instead of a static rim, we make the whole particle pulse brightness
    // Frequency varies per particle
    float shineSpeed = 2.0 + vRandom * 4.0;
    float shinePhase = uTime * shineSpeed + vRandom * 100.0;
    
    // Base shine factor
    float shine = 0.8 + 0.4 * sin(shinePhase); 
    
    // Boost brightness for gold sparkles significantly
    if (vIsGold > 0.5) {
        shine = 1.5 + 1.5 * sin(shinePhase * 1.5); // Rapid high contrast sparkle
        // Hot center for gold
        if (dist < 0.15) shine += 3.0;
    } else {
        // For green particles:
        // No white rim. 
        // Just a subtle "alive" shimmer in intensity to show depth.
        shine = 0.9 + 0.3 * sin(shinePhase);
    }

    // Apply shine to color
    vec3 finalColor = vColor * shine;

    // Final alpha composition
    gl_FragColor = vec4(finalColor, vAlpha * glow);
  }
`;