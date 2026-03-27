/**
 * TrophyStage3D — Cinematic Trophy Reveal (Phase 1-5)
 *
 * Timeline (all δt-independent via useFrame):
 *  0.0s → Ground crack expands (easeOutExpo, 1.2s)
 *  0.6s → Crack flicker lights ignite
 *  1.2s → Light burst energy peak (0.4s)
 *  1.4s → Trophy begins rising (y: -2 → 1.5, easeOutElastic, 2.5s)
 *  1.6s → Camera starts dolly + orbit
 *  3.9s → All settle → final hold + slow pulse + spotlight sweep
 *
 * No external dependencies — pure THREE / R3F / custom timeline.
 */
import React, { useRef, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, useGLTF, Html, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useQuizStore } from '../../store/useQuizStore'

// ── DYNAMIC ASSET RESOLUTION ──────────────────────────────────────────────
const getTrophyUrl = (index: number) => new URL(`../../assets/trophy_${index}.glb`, import.meta.url).href

// ── EASING FUNCTIONS ─────────────────────────────────────────────────────────
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
const easeOutElastic = (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// ── ENV MAP INJECTOR ──────────────────────────────────────────────────────────
function EnvSetup() {
    const { gl, scene } = useThree()
    useEffect(() => {
        const pmrem = new THREE.PMREMGenerator(gl)
        pmrem.compileEquirectangularShader()
        const white = new THREE.DataTexture(new Uint8Array([255, 255, 240, 255]), 1, 1)
        white.needsUpdate = true
        const envRT = pmrem.fromEquirectangular(white)
        scene.environment = envRT.texture
        scene.environmentIntensity = 6.5
        return () => { pmrem.dispose(); envRT.dispose(); white.dispose() }
    }, [gl, scene])
    return null
}

// ── TIMELINE STATE ─────────────────────────────────────────────────────────────
interface RevealTimeline {
    elapsed: number
    started: boolean
    phase: 'crack' | 'burst' | 'lift' | 'orbit' | 'hold'
}

// ── GROUND CRACK COMPONENT (Phase 1) ────────────────────────────────────────
function GroundCrack({ timelineRef }: { timelineRef: React.MutableRefObject<RevealTimeline> }) {
    const crackRef = useRef<THREE.Mesh>(null)
    const flickerLight1 = useRef<THREE.PointLight>(null)
    const flickerLight2 = useRef<THREE.PointLight>(null)

    // Create crack ring geometry (spiky ring to simulate fractured rock)
    const crackGeo = useMemo(() => {
        const shape = new THREE.Shape()
        const segs = 24
        for (let i = 0; i < segs; i++) {
            const angle = (i / segs) * Math.PI * 2
            const r = i % 2 === 0 ? 1.5 : 1.15
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r
            if (i === 0) shape.moveTo(x, y)
            else shape.lineTo(x, y)
        }
        shape.closePath()

        const hole = new THREE.Path()
        for (let i = 0; i < segs; i++) {
            const angle = (i / segs) * Math.PI * 2
            const r = i % 2 === 0 ? 0.7 : 0.55
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r
            if (i === 0) hole.moveTo(x, y)
            else hole.lineTo(x, y)
        }
        hole.closePath()
        shape.holes.push(hole)

        return new THREE.ShapeGeometry(shape)
    }, [])

    useFrame((_, delta) => {
        const t = timelineRef.current
        const el = t.elapsed

        // Phase 1: 0 → 1.2s crack expansion
        const crackT = clamp01(el / 1.2)
        const crackScale = easeOutExpo(crackT) * 1.4

        if (crackRef.current) {
            crackRef.current.scale.setScalar(crackScale)
            const mat = crackRef.current.material as THREE.MeshStandardMaterial
            mat.emissiveIntensity = crackT * 2.5
        }

        // Flickering lights (0.6s → 3s)
        if (el > 0.6) {
            const flickerIntensity = el < 1.4
                ? (Math.sin(el * 47) * 0.5 + 0.5) * 6  // rapid flicker
                : (Math.sin(el * 3) * 0.5 + 0.5) * 2   // slow pulse
            if (flickerLight1.current) flickerLight1.current.intensity = flickerIntensity
            if (flickerLight2.current) flickerLight2.current.intensity = flickerIntensity * 0.7
        }
    })

    return (
        <group position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {/* Crack ring */}
            <mesh ref={crackRef} geometry={crackGeo} scale={0}>
                <meshStandardMaterial
                    color="#1a0a00"
                    emissive="#FF6600"
                    emissiveIntensity={0}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Crack flicker lights (in world space below) */}
            <pointLight ref={flickerLight1} position={[0, 0, 0.2]} color="#FF6600" intensity={0} distance={6} />
            <pointLight ref={flickerLight2} position={[0.5, 0, 0.2]} color="#FF4400" intensity={0} distance={4} />
        </group>
    )
}

// ── LIGHT BURST COMPONENT (Phase 2) ──────────────────────────────────────────
function LightBurst({ timelineRef }: { timelineRef: React.MutableRefObject<RevealTimeline> }) {
    const burstRef = useRef<THREE.Mesh>(null)
    const coneRef = useRef<THREE.Mesh>(null)
    const burstLightRef = useRef<THREE.PointLight>(null)

    useFrame((state, delta) => {
        const el = timelineRef.current.elapsed

        // Burst: 1.2s → 2.0s (peak at 1.6s)
        const burstT = clamp01((el - 1.2) / 0.8)
        // Rises fast then fades
        const burstIntensity = burstT < 0.5
            ? easeOutExpo(burstT * 2) * 12
            : (1 - easeInOutSine((burstT - 0.5) * 2)) * 4 + 1

        if (burstLightRef.current) {
            burstLightRef.current.intensity = el > 1.2 ? burstIntensity : 0
        }

        // Glow sprite scale
        if (burstRef.current) {
            const s = el > 1.2 ? easeOutExpo(burstT) * 3.5 : 0
            burstRef.current.scale.setScalar(s)
            const mat = burstRef.current.material as THREE.MeshBasicMaterial
            mat.opacity = el > 1.2 ? Math.max(0, 0.9 - burstT * 0.9) : 0
        }

        // Rising light cone (1.2s → 3.0s)
        if (coneRef.current) {
            const coneT = clamp01((el - 1.2) / 1.8)
            coneRef.current.visible = coneT > 0 && coneT < 1
            coneRef.current.position.y = easeOutExpo(coneT) * 4 - 0.5
            const mat = coneRef.current.material as THREE.MeshBasicMaterial
            mat.opacity = coneT < 0.5 ? coneT * 1.4 : (1 - coneT) * 1.4
            coneRef.current.scale.y = 1 + coneT * 2
        }
    })

    return (
        <group position={[0, 0, 0]}>
            <pointLight ref={burstLightRef} position={[0, 0.1, 0]} color="#FFEEAA" intensity={0} distance={12} />

            {/* Glow sprite */}
            <mesh ref={burstRef} position={[0, 0.2, 0]} scale={0}>
                <circleGeometry args={[1, 32]} />
                <meshBasicMaterial color="#FFD700" transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Rising cone */}
            <mesh ref={coneRef} position={[0, -0.5, 0]} visible={false}>
                <coneGeometry args={[0.5, 3, 16, 1, true]} />
                <meshBasicMaterial color="#FFCC44" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
        </group>
    )
}

// ── TROPHY MESH WITH HERO LIFT (Phase 3) ─────────────────────────────────────
function ImportedTrophy({ timelineRef }: { timelineRef: React.MutableRefObject<RevealTimeline> }) {
    const groupRef = useRef<THREE.Group>(null)
    const rimLightRef = useRef<THREE.PointLight>(null)

    // Get the selected trophy index from the store
    const selectedTrophyIndex = useQuizStore(s => s.selectedTrophyIndex || 1)
    const trophyUrl = getTrophyUrl(selectedTrophyIndex)

    const { scene: rawScene } = useGLTF(trophyUrl) as any

    const trophyScene = useMemo(() => rawScene.clone(true), [rawScene])

    // Gold material setup
    useEffect(() => {
        if (!trophyScene) return
        const goldMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#FFDF00'),
            emissive: new THREE.Color('#4a2800'),
            emissiveIntensity: 0.5,
            metalness: 1.0,
            roughness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            reflectivity: 1.0,
        })

        const box = new THREE.Box3().setFromObject(trophyScene)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)

        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) {
            // 3.2 units ≈ 75% of visible vertical viewport at fov=55, z=6
            const scale = 3.2 / maxDim
            trophyScene.scale.setScalar(scale)
            const scaledCenter = center.multiplyScalar(scale)
            trophyScene.position.sub(scaledCenter)
            trophyScene.position.y += (size.y * scale) / 2  // lift base to y=0
        }

        trophyScene.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh
                const name = mesh.name.toLowerCase()

                // Hide built-in bases/plates from the GLB
                if (name.includes('base') || name.includes('plate') || name.includes('floor') || name.includes('stage') || name.includes('ground')) {
                    mesh.visible = false
                    return
                }

                mesh.material = goldMat
                mesh.frustumCulled = false
                mesh.visible = true
                mesh.castShadow = true
            }
        })
    }, [trophyScene])

    useFrame((_, delta) => {
        const el = timelineRef.current.elapsed

        if (!groupRef.current) return

        // Phase 3: Trophy lift — starts at 1.4s, duration 2.5s
        const liftStart = 1.4
        const liftDur = 2.5
        const liftT = clamp01((el - liftStart) / liftDur)
        // Final y=0.35 keeps the top of a 3.2-unit trophy at y≈3.55, ~75% of viewport
        const liftY = THREE.MathUtils.lerp(-3.5, 0.35, easeOutElastic(liftT))

        // Floating oscillation once settled (after 3.9s)
        const floatOffset = el > liftStart + liftDur
            ? Math.sin(el * 1.5) * 0.08
            : 0

        groupRef.current.position.y = liftY + floatOffset

        // Slow continuous rotation
        groupRef.current.rotation.y = el * 0.4

        // Rim light intensity
        if (rimLightRef.current) {
            // During lift: strong rim. After hold: slow pulse
            const rimT = clamp01((el - liftStart) / liftDur)
            const pulse = el > liftStart + liftDur
                ? 1.5 + Math.sin(el * 2) * 0.5
                : rimT * 2
            rimLightRef.current.intensity = pulse
        }
    })

    return (
        <group ref={groupRef} position={[0, -3.5, 0]}>
            {/* Rim light behind trophy for silhouette separation */}
            <pointLight ref={rimLightRef} position={[0, 0, -2.5]} color="#4080FF" intensity={0} distance={8} />
            <Float speed={0} rotationIntensity={0} floatIntensity={0}>
                <primitive object={trophyScene} />
            </Float>
        </group>
    )
}

// ── PRELOAD ALL TROPHIES ─────────────────────────────────────────────────────
for (let i = 1; i <= 7; i++) {
    useGLTF.preload(getTrophyUrl(i))
}

// ── COMPONENT DEFINITIONS ───────────────────────────────────────────────────

// ── HERO CINEMATIC LIGHTING SWEEP (New) ───────────────────────────────────────────
function HeroSweep({ timelineRef }: { timelineRef: React.MutableRefObject<RevealTimeline> }) {
    const light1 = useRef<THREE.PointLight>(null);
    const light2 = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        const el = timelineRef.current.elapsed;
        if (el < 1.4) return; // Only start when trophy appears

        const t = state.clock.getElapsedTime();
        const cycle = t * 0.8;

        if (light1.current) {
            light1.current.position.set(
                Math.sin(cycle) * 4,
                2 + Math.cos(cycle * 0.5) * 2,
                Math.cos(cycle) * 4
            );
        }
        if (light2.current) {
            light2.current.position.set(
                Math.sin(cycle + Math.PI) * 4,
                1 + Math.sin(cycle * 0.7) * 2,
                Math.cos(cycle + Math.PI) * 4
            );
        }
    });

    return (
        <group>
            <pointLight ref={light1} color="#AADDFF" intensity={12} distance={15} />
            <pointLight ref={light2} color="#FFD700" intensity={8} distance={15} />
        </group>
    );
}

// ── ROTATING SPOTLIGHT SWEEP (Phase 5) ────────────────────────────────────────
function SpotlightSweep({ timelineRef }: { timelineRef: React.MutableRefObject<RevealTimeline> }) {
    const spotRef1 = useRef<THREE.SpotLight>(null)
    const spotRef2 = useRef<THREE.SpotLight>(null)
    const targetRef = useRef(new THREE.Object3D())

    useFrame((state) => {
        const el = timelineRef.current.elapsed
        if (el < 3.9) return  // Only active in final hold

        const angle = state.clock.elapsedTime * 0.6
        if (spotRef1.current) {
            spotRef1.current.position.x = Math.sin(angle) * 5
            spotRef1.current.position.z = Math.cos(angle) * 5
            spotRef1.current.position.y = 6
        }
        if (spotRef2.current) {
            spotRef2.current.position.x = Math.sin(angle + Math.PI) * 5
            spotRef2.current.position.z = Math.cos(angle + Math.PI) * 5
            spotRef2.current.position.y = 6
        }
    })

    return (
        <group>
            <primitive object={targetRef.current} position={[0, 1.2, 0]} />
            <spotLight
                ref={spotRef1}
                position={[5, 6, 5]}
                angle={0.3}
                penumbra={0.6}
                intensity={8}
                color="#FFD700"
                castShadow
                target={targetRef.current}
            />
            <spotLight
                ref={spotRef2}
                position={[-5, 6, -5]}
                angle={0.3}
                penumbra={0.6}
                intensity={6}
                color="#AADDFF"
                castShadow
                target={targetRef.current}
            />
        </group>
    )
}

// ── CAMERA RIG (Phase 4) ──────────────────────────────────────────────────────
function CameraRig({ timelineRef }: { timelineRef: React.MutableRefObject<RevealTimeline> }) {
    const { camera } = useThree()
    const shakeRef = useRef(0)  // Remaining shake energy
    const orbitAngle = useRef(0)

    useFrame((_, delta) => {
        const el = timelineRef.current.elapsed

        // Camera shake during burst (1.2s → 1.8s)
        if (el > 1.2 && el < 1.8) {
            shakeRef.current = Math.max(0, shakeRef.current + delta * 6 - delta * 4)
            if (shakeRef.current > 0) {
                camera.position.x += (Math.random() - 0.5) * 0.04 * shakeRef.current
                camera.position.y += (Math.random() - 0.5) * 0.02 * shakeRef.current
            }
        }

        // Phase 4: Orbit begins at 1.6s (lift is underway)
        if (el > 1.6) {
            const orbitT = clamp01((el - 1.6) / 2.5)
            // Keep at radius 6 for the larger trophy
            const startRadius = 8
            const orbitRadius = THREE.MathUtils.lerp(startRadius, 6.0, easeOutExpo(orbitT))
            const orbitHeight = 2.5

            const orbitSpeed = el < 4.5 ? 0.45 : 0.2
            orbitAngle.current += delta * orbitSpeed

            camera.position.x = Math.sin(orbitAngle.current) * orbitRadius
            camera.position.z = Math.cos(orbitAngle.current) * orbitRadius
            camera.position.y = orbitHeight

            // LookAt trophy midpoint (0.9 final y + half of 1.8 height ≈ 0.45 midpoint above ground)
            const trophyEl = Math.min(el, 3.9)
            const liftT = clamp01((trophyEl - 1.4) / 2.5)
            const trophyBaseY = THREE.MathUtils.lerp(-3.5, 0.35, easeOutElastic(liftT))
            const trophyMidY = trophyBaseY + 1.6  // mid of a 3.2-unit trophy
            camera.lookAt(0, Math.max(0.5, trophyMidY), 0)
        } else if (el <= 1.6) {
            const pushT = clamp01(el / 1.6)
            camera.position.z = THREE.MathUtils.lerp(9, 8, easeOutExpo(pushT))
            camera.position.y = THREE.MathUtils.lerp(2.0, 2.5, pushT)
            camera.position.x = 0
            camera.lookAt(0, 0, 0)
        }
    })

    return null
}

// ── LOADING FALLBACK ──────────────────────────────────────────────────────────
function LoadingFallback() {
    return (
        <Html center>
            <div style={{
                color: '#FFD700', fontWeight: 'bold',
                letterSpacing: '0.3em', fontSize: 16, fontFamily: 'monospace',
                textShadow: '0 0 20px #FFD70088'
            }}>
                ⚡ ASSEMBLING TROPHY...
            </div>
        </Html>
    )
}

// ── MASTER SCENE ──────────────────────────────────────────────────────────────
function Scene() {
    const timeline = useRef<RevealTimeline>({
        elapsed: 0,
        started: true,
        phase: 'crack'
    })

    // Advance timeline
    useFrame((_, delta) => {
        if (timeline.current.started) {
            timeline.current.elapsed += delta
        }
    })

    return (
        <>
            <EnvSetup />
            <Environment preset="studio" />

            {/* Foundational lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 8, 4]} intensity={6} castShadow shadow-mapSize={[2048, 2048]} />
            <directionalLight position={[-4, 4, -4]} intensity={3.5} color="#4488FF" />
            <hemisphereLight args={[0xffeeb1, 0x111120, 2.5]} />

            {/* Cinematic sweeps */}
            <HeroSweep timelineRef={timeline} />

            {/* Phase 1 */}
            <GroundCrack timelineRef={timeline} />

            {/* Phase 2 */}
            <LightBurst timelineRef={timeline} />

            {/* Phase 3 */}
            <Suspense fallback={<LoadingFallback />}>
                <ImportedTrophy timelineRef={timeline} />
            </Suspense>

            {/* Phase 4: Camera rig (no render output, just moves camera) */}
            <CameraRig timelineRef={timeline} />

            {/* Phase 5: Rotating spotlight sweep */}
            <SpotlightSweep timelineRef={timeline} />

            {/* Ambient sparkle field */}
            <Sparkles count={200} scale={10} size={2} speed={0.1} opacity={0.4} color="#FFD700" />
        </>
    )
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
export function TrophyStage3D() {
    return (
        <Canvas
            gl={{
                antialias: true,
                preserveDrawingBuffer: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.6
            }}
            camera={{ position: [0, 2.5, 9], fov: 55, near: 0.01, far: 500 }}
            shadows
            style={{ width: '100%', height: '100%' }}
        >
            <color attach="background" args={['#040208']} />
            <Scene />
        </Canvas>
    )
}
