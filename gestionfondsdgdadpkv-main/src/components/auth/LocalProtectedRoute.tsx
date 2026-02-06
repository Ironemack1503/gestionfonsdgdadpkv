import { Navigate } from "react-router-dom";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Loader2 } from "lucide-react";

interface LocalProtectedRouteProps {
  children: React.ReactNode;
}

export function LocalProtectedRoute({ children }: LocalProtectedRouteProps) {
  const { user, loading } = useLocalAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
