"use client";

// Removed framer-motion to fix Vercel HTML import error
import { Card, CardContent } from "@/components/ui/card";
import { useRef } from "react";

interface SimpleCardProps {
  id: string;
  title: string;
  description: string;
  url: string;
  index: number;
}

export function SimpleCard({ 
  id, 
  title, 
  description, 
  url, 
  index 
}: SimpleCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const handleClick = () => {
    window.open(url, '_blank');
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 100 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Card 
        className="bg-slate-800/30 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 cursor-pointer"
        onClick={handleClick}
      >
        <CardContent className="p-6">
          <h3 className="text-xl text-white mb-2 group-hover:text-blue-300 transition-colors">
            {title}
          </h3>
          <p className="text-slate-400 mb-2">
            {description}
          </p>
          <a 
            href={url} 
            className="text-blue-400 hover:text-blue-300 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}
