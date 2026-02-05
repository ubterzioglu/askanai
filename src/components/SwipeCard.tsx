import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export const SwipeCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: SwipeCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);

  const threshold = 100; // pixels to trigger swipe

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setTranslateX(diff);
    setOpacity(1 - Math.abs(diff) / 300);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateX > threshold && onSwipeRight) {
      setTranslateX(300);
      setOpacity(0);
      setTimeout(() => {
        onSwipeRight();
        setTranslateX(0);
        setOpacity(1);
      }, 200);
    } else if (translateX < -threshold && onSwipeLeft) {
      setTranslateX(-300);
      setOpacity(0);
      setTimeout(() => {
        onSwipeLeft();
        setTranslateX(0);
        setOpacity(1);
      }, 200);
    } else {
      setTranslateX(0);
      setOpacity(1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUp = () => handleEnd();
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, translateX]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "swipe-card transition-transform",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      style={{
        transform: `translateX(${translateX}px) rotate(${translateX / 30}deg)`,
        opacity,
        transition: isDragging ? "none" : "all 0.3s ease-out",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
};
