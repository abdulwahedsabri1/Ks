import { Link } from "@tanstack/react-router";
import { QrCode } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background py-12 md:py-16 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <QrCode className="size-4" />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                My QR Link
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm mb-6">
              The premium digital experience platform for local businesses, restaurants, and
              creators.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary">
                  Features
                </a>
              </li>
              <li>
                <a href="#showcase" className="text-muted-foreground hover:text-primary">
                  QR Builder
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-muted-foreground hover:text-primary">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Templates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary">
                  Legal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} My QR Link. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
