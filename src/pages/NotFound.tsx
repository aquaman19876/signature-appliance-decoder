import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="p-8 text-center max-w-md">
        <div className="mb-6">
          <Zap className="w-16 h-16 mx-auto text-energy-primary mb-4" />
          <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
          <h2 className="mb-4 text-xl font-semibold">Energy Not Found</h2>
          <p className="text-muted-foreground mb-6">
            Looks like this circuit is disconnected. The page you're looking for doesn't exist in our energy grid.
          </p>
        </div>
        <Button asChild className="bg-energy-primary hover:bg-energy-primary/90">
          <a href="/" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Return to Simulator
          </a>
        </Button>
      </Card>
    </div>
  );
};

export default NotFound;
