'use client'

import { useEffect, useRef } from "react";

interface AiBlobProps {
  isListening: boolean;
  isSpeaking: boolean;
}

const AiBlob = ({ isListening, isSpeaking }: AiBlobProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }> = [];
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      createParticles();
    };
    
    const createParticles = () => {
      particles = [];
      const particleCount = 30;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: canvas.width / 2 + (Math.random() * 40 - 20),
          y: canvas.height / 2 + (Math.random() * 40 - 20),
          size: Math.random() * 4 + 2,
          speedX: Math.random() * 2 - 1,
          speedY: Math.random() * 2 - 1,
          color: isSpeaking 
            ? `rgba(64, 179, 255, ${Math.random() * 0.7 + 0.3})` 
            : isListening 
              ? `rgba(255, 76, 76, ${Math.random() * 0.7 + 0.3})` 
              : `rgba(124, 77, 255, ${Math.random() * 0.7 + 0.3})`
        });
      }
    };
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw base circle
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2, 
        canvas.height / 2, 
        isSpeaking ? 50 + Math.sin(Date.now() / 200) * 10 : 
        isListening ? 50 + Math.sin(Date.now() / 100) * 10 : 50, 
        0, 
        Math.PI * 2
      );
      ctx.fillStyle = isSpeaking 
        ? "rgba(64, 179, 255, 0.3)" 
        : isListening 
          ? "rgba(255, 76, 76, 0.3)" 
          : "rgba(124, 77, 255, 0.3)";
      ctx.fill();
      
      // Draw particles
      particles.forEach(particle => {
        particle.x += particle.speedX * (isSpeaking ? 1.5 : isListening ? 2 : 0.5);
        particle.y += particle.speedY * (isSpeaking ? 1.5 : isListening ? 2 : 0.5);
        
        // Boundary check and bounce
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isListening, isSpeaking]);
  
  return (
    <div className="w-64 m-4 h-64 relative mx-auto">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full" 
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default AiBlob;
