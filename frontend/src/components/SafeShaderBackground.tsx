'use client';

import { useEffect, useState } from 'react';

// Safe wrapper component that only loads shader on client
export function SafeShaderBackground() {
  const [ShaderComponent, setShaderComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Only import on client side
    import('@/components/ui/static-shader-background').then(module => {
      setShaderComponent(() => module.StaticShaderBackground);
    }).catch(err => {
      console.error('Failed to load shader background:', err);
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
