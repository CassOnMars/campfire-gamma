import { useRef } from "react";
import { Cylinder, useTexture } from "@react-three/drei";

export const Log = ({rotation, position}) => {
  const ref = useRef(null);
  const texture = useTexture('./wood.png');
  return <Cylinder
    ref={ref}
    args={[.3, .3, 4, 30]}
    position={position ? position : [.05,-3,-1]}
    rotation={rotation ? rotation : [-Math.PI,Math.PI/24,4]}
  ><meshStandardMaterial map={texture} /></Cylinder>;
};