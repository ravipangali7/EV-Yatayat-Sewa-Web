import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center max-w-md">
        <h1 className="mb-2 text-6xl font-display font-bold text-foreground">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! This page doesn&apos;t exist.</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold gradient-primary text-primary-foreground shadow-soft hover:shadow-card-hover hover:opacity-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Return to Home
        </Link>
        {location.pathname !== "/" && (
          <p className="mt-4 text-sm text-muted-foreground">Tried to open: {location.pathname}</p>
        )}
      </div>
    </div>
  );
};

export default NotFound;
