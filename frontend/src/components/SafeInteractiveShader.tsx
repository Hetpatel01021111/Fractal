'use client';

import { useEffect, useState } from 'react';

// Safe wrapper component that only loads shader on client
export function SafeInteractiveShader() {
  const [ShaderComponent, setShaderComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Only import on client side
    import('@/components/ui/interactive-shader-animation').then(module => {
      setShaderComponent(() => module.InteractiveShaderAnimation);
    }).catch(err => {
      console.error('Failed to load interactive shader:', err);
    });
  }, []);

  // Show gradient fallback while loading or if failed
  if (!ShaderComponent) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900" />
    );
  }

  return <ShaderComponent />;
}
