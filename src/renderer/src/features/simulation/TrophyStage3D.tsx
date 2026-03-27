import React, { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial, Float, Sparkles, OrbitControls, Stage, useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import trophyUrl from '../../assets/trophy.glb?url'

function ImportedTrophy() {
    const groupRef = useRef<THREE.Group>(null)
    const { scene } = useGLTF(trophyUrl)

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.3
        }
    })

    useEffect(() => {
        if (scene) {
            const goldMaterial = new THREE.MeshPhysicalMaterial({
                color: '#FFDF00',
                emissive: '#100500',
                metalness: 1.0,
                roughness: 0.15,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1,
            })

            scene.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh
                    mesh.material = goldMaterial
                    mesh.castShadow = true
                    mesh.receiveShadow = true
                }
            })
        }
    }, [scene])

    return (
        <group ref={groupRef}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <primitive object={scene} />
            </Float>
        </group>
    )
}

useGLTF.preload(trophyUrl)

function LoadingFallback() {
    return (
        <Html center>
            <div className="text-tv-accent text-xl animate-pulse font-bold tracking-widest">
                ASSEMBLING TROPHY...
            </div>
        </Html>
    )
}

export function TrophyStage3D() {
    return (
        <Canvas gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ position: [0, 0, 12], fov: 45 }}>
            <color attach="background" args={['#000000']} />
            <fog attach="fog" args={['#000000', 10, 30]} />

            <Suspense fallback={null}>
                <Stage
                    environment="studio"
                    intensity={1.5}
                    adjustCamera={1.2} // Auto-resize to fit screen!
                    preset="rembrandt"
                    shadows="contact"
                >
                    <ImportedTrophy />
                </Stage>

                <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <MeshReflectorMaterial
                        blur={[300, 100]}
                        resolution={1024}
                        mixBlur={1}
                        mixStrength={100}
                        roughness={0.8}
                        depthScale={1.2}
                        minDepthThreshold={0.4}
                        maxDepthThreshold={1.4}
                        color="#050505"
                        metalness={0.9}
                        mirror={0.9}
                    />
                </mesh>

                <Sparkles count={400} scale={15} size={4} speed={0.2} opacity={0.4} color="#FFD700" />
            </Suspense>

            <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                maxPolarAngle={Math.PI / 2 - 0.05}
                minPolarAngle={Math.PI / 3}
            />
        </Canvas>
    )
}
