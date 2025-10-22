"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

export function InteractiveShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: any
    animationId: number
  } | null>(null)
  const [, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Vertex shader
    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    // Enhanced fragment shader with mouse interaction
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 mouse;
      uniform float animationTrigger;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.002;

        // Mouse influence
        vec2 mouseInfluence = mouse * 2.0 - 1.0;
        float mouseDistance = length(uv - mouseInfluence);
        float mouseEffect = smoothstep(0.8, 0.0, mouseDistance) * animationTrigger;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            float wave = fract(t - 0.01*float(j) + float(i)*0.01 + mouseEffect*0.5) * 5.0;
            float pattern = length(uv - mouseInfluence * 0.3) + mod(uv.x + uv.y + mouseEffect, 0.2);
            color[j] += lineWidth * float(i*i) * (1.0 + mouseEffect) / abs(wave - pattern);
          }
        }
        
        // Add mouse glow effect
        if(animationTrigger > 0.1) {
          float glow = exp(-mouseDistance * 3.0) * animationTrigger;
          color += vec3(glow * 0.5, glow * 0.3, glow * 0.8);
        }
        
        gl_FragColor = vec4(color[0], color[1], color[2], 1.0);
      }
    `

    // Initialize Three.js scene
    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
      mouse: { type: "v2", value: new THREE.Vector2(0.5, 0.5) },
      animationTrigger: { type: "f", value: 0.0 },
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

    container.appendChild(renderer.domElement)

    // Mouse event handlers
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = 1.0 - (event.clientY - rect.top) / rect.height // Flip Y coordinate
      
      setMousePosition({ x, y })
      uniforms.mouse.value.set(x, y)
    }

    const handleMouseEnter = () => {
      setIsAnimating(true)
    }

    const handleMouseLeave = () => {
      setIsAnimating(false)
    }

    const handleClick = () => {
      setIsAnimating(true)
      // Create a pulse effect on click
      uniforms.animationTrigger.value = 1.0
      setTimeout(() => {
        if (sceneRef.current) {
          uniforms.animationTrigger.value = 0.5
        }
      }, 200)
    }

    // Add event listeners
    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('click', handleClick)

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

    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate)
      uniforms.time.value += 0.05

      // Smooth animation trigger
      const targetTrigger = isAnimating ? 1.0 : 0.0
      uniforms.animationTrigger.value += (targetTrigger - uniforms.animationTrigger.value) * 0.05

      renderer.render(scene, camera)

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
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('click', handleClick)

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
  }, [isAnimating])

  return (
    <div
      ref={containerRef}
      className="w-full h-screen cursor-pointer"
      style={{
        background: "#000",
        overflow: "hidden",
      }}
    />
  )
}
