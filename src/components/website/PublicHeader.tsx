import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Blog", to: "/blogs" },
  { label: "Contact", to: "/contact" },
];

type PublicHeaderProps = {
  siteSetting?: unknown;
  headerPages?: unknown[];
  aboutSlug?: string | null;
};

export function PublicHeader(_props?: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const mobileMenu =
    typeof document !== "undefined"
      ? createPortal(
          <div
            className={`md:hidden fixed inset-0 z-[100] transition-opacity duration-300 ${
              open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!open}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              tabIndex={open ? 0 : -1}
            />
            <div
              className={`absolute top-0 right-0 w-full max-w-[min(20rem,100vw)] h-full bg-background border-l border-border shadow-card-hover flex flex-col pt-20 pb-8 px-6 transition-transform duration-300 ease-out ${
                open ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map((l) => {
                  const isActive = pathname === l.to;
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      tabIndex={open ? 0 : -1}
                      className={`px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                        isActive ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
                <Link
                  to="/app/login"
                  onClick={() => setOpen(false)}
                  tabIndex={open ? 0 : -1}
                  className="mt-4 mx-2 py-3.5 rounded-full text-center text-sm font-semibold gradient-primary text-white shadow-soft"
                >
                  Login
                </Link>
              </nav>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <header
      className={`sticky top-0 left-0 right-0 w-full max-w-full min-w-0 bg-background/70 backdrop-blur-xl border-b border-border/80 shadow-soft ${
        open ? "z-[110]" : "z-50"
      }`}
    >
      <div className="container w-full max-w-full min-w-0 flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
          <img src={logo} alt="EV Yatayat Sewa" className="h-10 w-auto sm:h-12" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => {
            const isActive = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative px-4 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-muted/60"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            to="/app/login"
            className="ml-2 px-5 py-2.5 rounded-full text-sm font-semibold gradient-primary text-white shadow-soft hover:shadow-card-hover hover:opacity-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Login
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden p-3 -m-1 rounded-lg text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenu}
    </header>
  );
}
