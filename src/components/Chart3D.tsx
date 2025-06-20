
import { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Chart3DProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  zAxis?: string;
  chartType: '3d-bar' | '3d-scatter' | '3d-surface';
}

const BarChart3D = ({ data, xAxis, yAxis, zAxis }: { data: any[], xAxis: string, yAxis: string, zAxis?: string }) => {
  const bars = useMemo(() => {
    return data.slice(0, 20).map((item, index) => {
      const xValue = typeof item[xAxis] === 'string' ? index : item[xAxis];
      const yValue = typeof item[yAxis] === 'number' ? item[yAxis] : 0;
      const zValue = zAxis && typeof item[zAxis] === 'number' ? item[zAxis] : index;
      
      return {
        position: [xValue * 2, yValue / 2, zValue * 2] as [number, number, number],
        scale: [0.8, Math.max(yValue, 0.1), 0.8] as [number, number, number],
        color: `hsl(${(index * 137.508) % 360}, 70%, 60%)`,
        label: `${item[xAxis]}: ${yValue}`
      };
    });
  }, [data, xAxis, yAxis, zAxis]);

  return (
    <>
      {bars.map((bar, index) => (
        <group key={index}>
          <mesh
            position={bar.position}
            scale={bar.scale}
            onClick={() => console.log(bar.label)}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={bar.color} />
          </mesh>
          <Text
            position={[bar.position[0], bar.position[1] + bar.scale[1] + 0.5, bar.position[2]]}
            fontSize={0.3}
            color="black"
            anchorX="center"
            anchorY="middle"
          >
            {bar.label}
          </Text>
        </group>
      ))}
    </>
  );
};

const ScatterChart3D = ({ data, xAxis, yAxis, zAxis }: { data: any[], xAxis: string, yAxis: string, zAxis?: string }) => {
  const points = useMemo(() => {
    return data.slice(0, 50).map((item, index) => {
      const xValue = typeof item[xAxis] === 'number' ? item[xAxis] : index;
      const yValue = typeof item[yAxis] === 'number' ? item[yAxis] : 0;
      const zValue = zAxis && typeof item[zAxis] === 'number' ? item[zAxis] : Math.random() * 10;
      
      return {
        position: [xValue, yValue, zValue] as [number, number, number],
        color: `hsl(${(index * 137.508) % 360}, 70%, 60%)`,
        size: 0.2 + Math.random() * 0.3
      };
    });
  }, [data, xAxis, yAxis, zAxis]);

  return (
    <>
      {points.map((point, index) => (
        <mesh
          key={index}
          position={point.position}
        >
          <sphereGeometry args={[point.size]} />
          <meshStandardMaterial color={point.color} />
        </mesh>
      ))}
    </>
  );
};

export const Chart3D = ({ data, xAxis, yAxis, zAxis, chartType }: Chart3DProps) => {
  const controlsRef = useRef();

  const renderChart = () => {
    switch (chartType) {
      case '3d-bar':
        return <BarChart3D data={data} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />;
      case '3d-scatter':
        return <ScatterChart3D data={data} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />;
      case '3d-surface':
        return <BarChart3D data={data} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />;
      default:
        return <BarChart3D data={data} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />;
    }
  };

  return (
    <div className="w-full h-96 bg-gradient-to-br from-gray-900 to-blue-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        {renderChart()}
        
        {/* Grid */}
        <primitive object={new THREE.GridHelper(20, 20, 0x444444, 0x444444)} />
        
        {/* Axis labels */}
        <Text
          position={[10, 0, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.5}
          color="white"
        >
          {xAxis}
        </Text>
        <Text
          position={[0, 10, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.5}
          color="white"
        >
          {yAxis}
        </Text>
        {zAxis && (
          <Text
            position={[0, 0, 10]}
            rotation={[0, 0, 0]}
            fontSize={0.5}
            color="white"
          >
            {zAxis}
          </Text>
        )}
        
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>
    </div>
  );
};
