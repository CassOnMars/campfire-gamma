import * as THREE from "three";
import { useRef, useCallback } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { Image } from "@react-three/drei";
import { Bloom, EffectComposer, Glitch, LUT } from "@react-three/postprocessing";
import { LUTCubeLoader } from "postprocessing";
import { Rainbow } from "./components/Rainbow";
import { Campfire } from "./components/Campfire";
import { Gamma } from "./components/Gamma";
import { Box } from "./components/Box";
import { Log } from "./components/Log";
import './App.css';

export function lerp(object, prop, goal, speed = 0.1) {
  object[prop] = THREE.MathUtils.lerp(object[prop], goal, speed);
}

const vector = new THREE.Vector3();
export function lerpV3(value, goal, speed = 0.1) {
  value.lerp(vector.set(...goal), speed);
}

export function calculateRefractionAngle(
  incidentAngle,
  glassIor = 2.5,
  airIor = 1.000293
) {
  const theta = Math.asin((airIor * Math.sin(incidentAngle)) / glassIor) || 0;
  return theta;
}

export const Campground = () => {
  const ref = useRef()
  useFrame(() => {
    ref.current.material.zoom = 1; // 1 and higher
    ref.current.position.z = -10;
    ref.current.scale.x = 20;
    ref.current.scale.y = 15;
  })
  return <Image opacity={1} ref={ref} url="/campground.png" />
}

export default function App() {
  const texture = useLoader(
    LUTCubeLoader,
    "/DwlG-F-6800-STD.cube"
  );
  return (
    <div className="App">
      <div className="App-content">
        <div className="App-top"></div>
        <div className="App-mid">
          <div className="App-mid-left"><span className="left-divider">Campfire</span></div>
          <div className="App-mid-right">Gamma Troop</div>
        </div>
        <div className="App-bottom">V</div>
        <div className="App-page">
          <h1>Class of 2023</h1>
          <p>
            This site is <a href="https://github.com/CassOnMars/campfire-gamma">open source</a>! Feel free to create a pull request and add your startup.
          </p>
        </div>
      </div>
    <Canvas
      orthographic
      gl={{ antialias: true }}
      camera={{ position: [0, 0, 100], zoom: 70 }}
    >
      <color attach="background" args={["black"]}/>
      <Campground/>
      <Scene />
      <EffectComposer disableNormalPass>
        <Bloom
          mipmapBlur
          levels={10}
          intensity={1.5}
          luminanceThreshold={.5}
          luminanceSmoothing={1}
        />
        <LUT lut={texture} />
        <Glitch
          strength={[.01, .01]}
        />
      </EffectComposer>
    </Canvas>
    </div>
  );
}

function Scene() {
  const ambient = useRef(null);
  const spot = useRef(null);
  const campfire = useRef(null);
  const rainbow = useRef(null);

  const vec = new THREE.Vector3()
  const setRay = useCallback(({ position, normal }) => {
    if (!normal) return
    // Extend the line to the prisms center.
    
    // Calculate refraction angles.
    let angleScreenCenter = Math.atan2(-position.y, -position.x)
    const normalAngle = Math.atan2(normal.y, normal.x)

    // The angle between the ray and the normal.
    const incidentAngle = angleScreenCenter - normalAngle

    // Calculate the refraction for the incident angle.
    const refractionAngle = calculateRefractionAngle(incidentAngle) * 6

    // Apply the refraction.
    angleScreenCenter += refractionAngle
    rainbow.current.rotation.z = Math.PI/2;

    // Set spot light.
    lerpV3(spot.current.target.position, [Math.cos(angleScreenCenter), Math.sin(angleScreenCenter), 0], 0.05)
    spot.current.target.updateMatrixWorld()
  }, [])

  useFrame((state) => {
    // Tie beam to the mouse.
    setRay({
      position: {x: (state.pointer.x * state.viewport.width) / 2, y: (state.pointer.y * state.viewport.height) / 2, z: 0},
      normal: {x:0,y:0,z:0}
    });
    lerp(rainbow.current.material, 'emissiveIntensity', 2.5, 0.1)

    // Animate ambience.
    lerp(ambient.current, "intensity", 0.1 * Math.sin(state.clock.elapsedTime), 0.125);
  });

  return (
    <>
      {/* Lights */}
      <ambientLight ref={ambient} intensity={0} />
      <spotLight
        ref={spot}
        intensity={1}
        distance={7}
        angle={1}
        penumbra={1}
        position={[0, 0, 1]}
      />
      <Box position={[0,-2,0]} />
      <Log position={[.5, -3, 2]} rotation={[1,0,Math.PI/6]}/>
      <Log position={[-.5, -3, 2]} rotation={[1,0,-Math.PI/6]}/>
      <Log position={[0, -3, -2]} rotation={[-1,0,Math.PI]}/>
      <Gamma scale={0.6} position={[0, -0.5, 0]} />
      <Rainbow ref={rainbow} startRadius={0} endRadius={.25} position={[0, -2, 0]}  fade={1} />
      <Campfire ref={campfire} position={[0, 3, -2]} scale={[2, 15, 1]}/>
    </>
  );
}
