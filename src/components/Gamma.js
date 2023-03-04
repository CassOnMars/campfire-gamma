import { useRef } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from '@react-three/fiber'

export function Gamma({ onRayOver, onRayOut, onRayMove, ...props }) {
  const ref = useRef(null);
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime;
  });
  
  return (
    <group {...props}>
      <Text3D
        ref={ref}
        font="font.json"
        renderOrder={10}
        scale={2}
        smooth={1}
        lineHeight={0.5}
        rotation={[0, 0.1, 0]}
      >γ<meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0}
          transmission={2}
          thickness={1}
          roughness={0.2}
          toneMapped={false}
        /></Text3D>
    </group>
  );
}
