import { forwardRef, useRef, useMemo, useLayoutEffect } from "react";
import { extend, useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";

class FireMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      defines: { ITERATIONS: "10", OCTIVES: "3" },
      uniforms: {
        fireTex: { type: "t", value: null },
        color: { type: "c", value: null },
        time: { type: "f", value: 0.0 },
        seed: { type: "f", value: 0.0 },
        invModelMatrix: { type: "m4", value: null },
        scale: { type: "v3", value: null },
        noiseScale: { type: "v4", value: new THREE.Vector4(1, 2, 1, 0.3) },
        magnitude: { type: "f", value: 1.5 },
        lacunarity: { type: "f", value: 3.0 },
        gain: { type: "f", value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        }`,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float seed;
        uniform mat4 invModelMatrix;
        uniform vec3 scale;
        uniform vec4 noiseScale;
        uniform float magnitude;
        uniform float lacunarity;
        uniform float gain;
        uniform sampler2D fireTex;
        varying vec3 vWorldPos;              
        float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
        
        float snoise(vec3 p){
            vec3 a = floor(p);
            vec3 d = p - a;
            d = d * d * (3.0 - 2.0 * d);
        
            vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
            vec4 k1 = perm(b.xyxy);
            vec4 k2 = perm(k1.xyxy + b.zzww);
        
            vec4 c = k2 + a.zzzz;
            vec4 k3 = perm(c);
            vec4 k4 = perm(c + 1.0);
        
            vec4 o1 = fract(k3 * (1.0 / 41.0));
            vec4 o2 = fract(k4 * (1.0 / 41.0));
        
            vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
            vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
        
            return o4.y * d.y + o4.x * (1.0 - d.y);
        }

        float turbulence(vec3 p) {
          float sum = 0.0;
          float freq = 1.0;
          float amp = 1.0;
          for(int i = 0; i < OCTIVES; i++) {
            sum += abs(snoise(p * freq)) * amp;
            freq *= lacunarity;
            amp *= gain;
          }
          return sum;
        }

        vec4 samplerFire (vec3 p, vec4 scale) {
          vec2 st = vec2(sqrt(dot(p.xz, p.xz)), p.y);
          if(st.x <= 0.0 || st.x >= 1.0 || st.y <= 0.0 || st.y >= 1.0) return vec4(0.0);
          p.y -= (seed + time) * scale.w;
          p *= scale.xyz;
          st.y += sqrt(st.y) * magnitude * turbulence(p);
          if(st.y <= 0.0 || st.y >= 1.0) return vec4(0.0);
          return texture2D(fireTex, st);
        }

        vec3 localize(vec3 p) {
          return (invModelMatrix * vec4(p, 1.0)).xyz;
        }

        void main() {
          vec3 rayPos = vWorldPos;
          vec3 rayDir = normalize(rayPos - cameraPosition);
          float rayLen = 0.0288 * length(scale.xyz);
          vec4 col = vec4(0.0);
          for(int i = 0; i < ITERATIONS; i++) {
            rayPos += rayDir * rayLen;
            vec3 lp = localize(rayPos);
            lp.y += 0.5;
            lp.xz *= 2.0;
            col += samplerFire(lp, noiseScale);
          }
          col.r *= 1.5;
          col.a = col.r;
          gl_FragColor = col;
        }`
    });
  }
}

extend({ FireMaterial });

export const Campfire = forwardRef(({ color, ...props }, fRef) => {
  const ref = useRef();
  const texture = useLoader(
    THREE.TextureLoader,
    "data:image/png;base64,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"
  );
  useFrame((state) => {
    const invModelMatrix = ref.current.material.uniforms.invModelMatrix.value;
    ref.current.updateMatrixWorld();
    invModelMatrix.copy(ref.current.matrixWorld).invert();
    ref.current.material.uniforms.time.value = state.clock.elapsedTime;
    ref.current.material.uniforms.invModelMatrix.value = invModelMatrix;
    ref.current.material.uniforms.scale.value = ref.current.scale;
  });
  useLayoutEffect(() => {
    texture.magFilter = texture.minFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    ref.current.material.uniforms.fireTex.value = texture;
    ref.current.material.uniforms.color.value =
      color || new THREE.Color(0xffffff);
    ref.current.material.uniforms.invModelMatrix.value = new THREE.Matrix4();
    ref.current.material.uniforms.scale.value = new THREE.Vector3(1, 1, 1);
    ref.current.material.uniforms.seed.value = Math.random() * 19.19;
  }, []);
  return (
    <mesh ref={ref} {...props}>
      <boxGeometry />
      <fireMaterial transparent depthWrite={false} depthTest={true} />
    </mesh>
  );
});
