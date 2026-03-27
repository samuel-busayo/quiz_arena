/**
 * TROPHY DIAGNOSTIC SCENE — Phases 1-5
 *
 * A completely isolated ThreeJS test environment that:
 * - Loads the GLB with full logging (Phase 1)
 * - Traverses all meshes and logs their state (Phase 2)
 * - Forces MeshNormalMaterial + disables frustum culling (Phase 3)
 * - Auto-frames camera from bounding sphere (Phase 4)
 * - Applies slow Y-axis rotation to confirm render loop (Phase 5)
 * - Falls back to a BoxGeometry placeholder if model is empty (Phase 6)
 */
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const TROPHY_URL = new URL('../../assets/trophy.glb', import.meta.url).href

export function TrophyDiagnostic() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // ─── PHASE 1: ISOLATED SCENE ────────────────────────────────────────
        const scene = new THREE.Scene()
        scene.background = new THREE.Color('#050510')

        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.01, 1000)
        camera.position.set(0, 1.5, 5)
        camera.lookAt(0, 0, 0)

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(container.clientWidth, container.clientHeight)
        renderer.shadowMap.enabled = true
        container.appendChild(renderer.domElement)

        // Strong debug lighting
        const ambient = new THREE.AmbientLight(0xffffff, 2)
        scene.add(ambient)

        const dirLight = new THREE.DirectionalLight(0xffffff, 3)
        dirLight.position.set(3, 5, 4)
        dirLight.castShadow = true
        scene.add(dirLight)

        const hemi = new THREE.HemisphereLight(0xffeeb1, 0x080820, 1.5)
        scene.add(hemi)

        // Helpers
        scene.add(new THREE.GridHelper(10, 10))
        scene.add(new THREE.AxesHelper(5))

        // Trophy group (rotates in animation loop)
        const trophyGroup = new THREE.Group()
        scene.add(trophyGroup)

        console.log('[DIAGNOSTIC] Scene created. Starting GLTFLoader...')
        console.log('[DIAGNOSTIC] Loading from URL:', TROPHY_URL)

        // ─── PHASE 2: MODEL LOADING + VISIBILITY DIAGNOSTIC ─────────────────
        const loader = new GLTFLoader()
        loader.load(
            TROPHY_URL,
            (gltf) => {
                console.log('[DIAGNOSTIC] ✅ GLB LOADED SUCCESSFULLY')
                console.log('[DIAGNOSTIC] Scene children count:', gltf.scene.children.length)

                let meshCount = 0

                gltf.scene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh
                        meshCount++
                        console.log(`[DIAGNOSTIC] Mesh #${meshCount}:`, {
                            name: mesh.name || '(unnamed)',
                            materialType: Array.isArray(mesh.material)
                                ? mesh.material.map(m => m.type)
                                : (mesh.material as THREE.Material).type,
                            visible: mesh.visible,
                            scale: mesh.scale.toArray(),
                            position: mesh.position.toArray(),
                        })

                        // ─── PHASE 3: FORCED VISIBILITY MODE ────────────────
                        mesh.material = new THREE.MeshNormalMaterial()
                        mesh.frustumCulled = false
                        mesh.visible = true
                        mesh.castShadow = true
                    }
                })

                console.log('[DIAGNOSTIC] Total meshes found:', meshCount)

                if (meshCount === 0) {
                    console.error('[DIAGNOSTIC] ❌ NO MESHES FOUND IN GLB. Adding fallback BoxGeometry.')
                    const fallback = new THREE.Mesh(
                        new THREE.BoxGeometry(1, 1, 1),
                        new THREE.MeshNormalMaterial()
                    )
                    trophyGroup.add(fallback)
                } else {
                    // ─── PHASE 2 cont: COMPUTE BOUNDING BOX → CENTER + NORMALIZE ─────
                    const box = new THREE.Box3().setFromObject(gltf.scene)
                    const center = new THREE.Vector3()
                    const size = new THREE.Vector3()
                    box.getCenter(center)
                    box.getSize(size)

                    const maxDim = Math.max(size.x, size.y, size.z)
                    const scale = 2.0 / maxDim
                    console.log('[DIAGNOSTIC] Bounding box:', { center: center.toArray(), size: size.toArray(), maxDim, appliedScale: scale })

                    gltf.scene.scale.setScalar(scale)
                    gltf.scene.position.sub(center.multiplyScalar(scale))

                    trophyGroup.add(gltf.scene)

                    // ─── PHASE 4: CAMERA AUTO-FRAMING ────────────────────────
                    const sphere = new THREE.Sphere()
                    new THREE.Box3().setFromObject(trophyGroup).getBoundingSphere(sphere)
                    const dist = sphere.radius * 3
                    camera.position.set(sphere.center.x, sphere.center.y + sphere.radius * 0.5, sphere.center.z + dist)
                    camera.lookAt(sphere.center)
                    console.log('[DIAGNOSTIC] Camera repositioned to:', camera.position.toArray())
                }
            },
            (progress) => {
                if (progress.total > 0) {
                    const pct = ((progress.loaded / progress.total) * 100).toFixed(1)
                    console.log(`[DIAGNOSTIC] Loading... ${pct}%`)
                }
            },
            (error) => {
                console.error('[DIAGNOSTIC] ❌ LOAD ERROR:', error)
                // Phase 6: If load fails, add wireframe box at origin
                const fallback = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 2, 1.5),
                    new THREE.MeshNormalMaterial({ wireframe: true })
                )
                trophyGroup.add(fallback)
            }
        )

        // ─── PHASE 5: ROTATION ANIMATION LOOP ────────────────────────────────
        let animId: number
        const clock = new THREE.Clock()
        const animate = () => {
            animId = requestAnimationFrame(animate)
            trophyGroup.rotation.y += clock.getDelta() * 0.5
            renderer.render(scene, camera)
        }
        animate()

        // Handle resize
        const onResize = () => {
            if (!container) return
            camera.aspect = container.clientWidth / container.clientHeight
            camera.updateProjectionMatrix()
            renderer.setSize(container.clientWidth, container.clientHeight)
        }
        window.addEventListener('resize', onResize)

        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', onResize)
            renderer.dispose()
            if (container && renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [])

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#050510' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
            <div style={{
                position: 'absolute', top: 16, left: 16,
                background: 'rgba(0,0,0,0.7)', color: '#00e5ff',
                padding: '8px 16px', borderRadius: 8,
                fontFamily: 'monospace', fontSize: 13,
                border: '1px solid #00e5ff44'
            }}>
                🔬 TROPHY DIAGNOSTIC SCENE — Check DevTools Console
            </div>
        </div>
    )
}
