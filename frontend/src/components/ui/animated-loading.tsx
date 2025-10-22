"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import * as THREE from "three"

interface AnimatedLoadingProps {
  onComplete: () => void
}

export function AnimatedLoading({ onComplete }: AnimatedLoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: any
    animationId: number
  } | null>(null)
  const [showText, setShowText] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'animating' | 'final'>('animating')

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Vertex shader
    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    // Fragment shader - same as homepage for consistent animation
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time*0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
          }
        }
        
        gl_FragColor = vec4(color[0],color[1],color[2],1.0);
      }
    `

    // Initialize Three.js scene
    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f", value: 0.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 1.0) // Set clear color to black

    container.appendChild(renderer.domElement)

    // Handle window resize
    const onWindowResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    // Initial resize
    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    // Animation loop - single loop then stop at black
    let animationLoops = 0
    const maxLoops = 1 // Only one animation loop
    let currentPhase: 'animating' | 'final' = 'animating'
    let startTime = Date.now()
    
    // Show text immediately so it's visible throughout the animation
    setTimeout(() => setShowText(true), 500)

    const animate = () => {
      const currentTime = Date.now()
      
      if (currentPhase === 'animating') {
        // Slow animation like homepage - increment by 0.05 each frame
        uniforms.time.value += 0.05
        
        // Check if we've completed one loop (approximately every 12 time units)
        const currentLoop = Math.floor(uniforms.time.value / 12)
        
        if (currentLoop >= maxLoops) {
          // Animation loop complete, go directly to results
          currentPhase = 'final'
          setAnimationPhase('final')
          onComplete()
          return
        }
      }

      renderer.render(scene, camera)

      const animationId = requestAnimationFrame(animate)
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    // Store scene references for cleanup
    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: 0,
    }

    // Start animation
    animate()

    // Cleanup function
    return () => {
      window.removeEventListener("resize", onWindowResize)

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)

        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement)
        }

        sceneRef.current.renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Shader Animation Background */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          background: "#000",
          overflow: "hidden",
        }}
      />
      
      {/* Fractal Branding */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl"
          >
            Fractal
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex items-center justify-center space-x-2"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
