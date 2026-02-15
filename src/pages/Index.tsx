import { Link } from 'react-router-dom';
import { Bus, MapPin, Users, Route, ArrowRight, Shield, Zap, BarChart3, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getHomePathForUser } from '@/config/appRoles';

export default function Index() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const homePath = user ? getHomePathForUser(user) : '/login';
  const features = [
    {
      icon: <Bus className="w-6 h-6" />,
      title: 'Fleet Management',
      description: 'Track and manage your entire vehicle fleet in real-time with advanced monitoring tools.',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Route Planning',
      description: 'Create optimized routes with multiple stop points and bidirectional support.',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Driver Management',
      description: 'Assign drivers to vehicles, track performance, and manage schedules efficiently.',
    },
    {
      icon: <Route className="w-6 h-6" />,
      title: 'Booking System',
      description: 'Visual seat management with real-time availability tracking for seamless bookings.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Platform',
      description: 'Enterprise-grade security with role-based access control and data encryption.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics',
      description: 'Comprehensive reports and insights to optimize your fleet operations.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="EV Yatayat Sewa" className="h-10 w-auto object-contain" />
          </Link>
          {isLoading ? (
            <Button disabled>
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to={homePath}>
                <Button variant="outline">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" onClick={() => logout()}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Fleet Management Solution
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground max-w-4xl mx-auto leading-tight">
            Manage Your Fleet with
            <span className="text-primary"> Precision & Ease</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
            The complete solution for managing vehicles, drivers, routes, and bookings.
            Streamline your operations and boost efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link to={isAuthenticated ? homePath : '/login'}>
              <Button size="lg" className="w-full sm:w-auto">
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Powerful features designed to help you manage your fleet operations efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Join EV Yatayat Sewa for green rides and smart commute.
            </p>
            <Link to={isAuthenticated ? homePath : '/login'}>
              <Button size="lg" variant="secondary">
                {isAuthenticated ? 'Go to Dashboard' : 'Start Managing Your Fleet'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} EV Yatayat Sewa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
