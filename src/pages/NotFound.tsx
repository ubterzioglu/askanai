import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center animate-slide-up">
        <div className="mb-6 text-8xl">🤷</div>
        <h1 className="mb-2 text-6xl font-bold text-glow-blue">404</h1>
        <p className="mb-8 text-xl text-muted-foreground">page not found</p>
        <Link to="/">
          <Button className="btn-neon">
            go home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
