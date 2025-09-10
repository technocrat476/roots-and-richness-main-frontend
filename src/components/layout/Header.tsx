import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { state: cartState } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/about', label: 'About' },
    { href: '/blog', label: 'Blog' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setIsMenuOpen(false); // close mobile sheet if open
  };

  return (
    <header className="bg-white shadow-sm border-b border-neutral-light sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 relative">

          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden min-w-[48px] min-h-[48px] p-0"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-full sm:w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Sheet Header */}
                <div className="p-6 border-b border-neutral-light font-playfair font-bold text-xl text-secondary">
                  Roots & Richness
                </div>

                {/* Mobile Nav */}
                <nav className="flex-1 px-6 py-4">
                  <div className="space-y-1">
                    {navItems.map(item => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`block font-medium text-lg py-3 px-4 rounded-lg transition-colors hover:bg-neutral-light ${
                          isActive(item.href) ? 'text-primary bg-primary/10' : 'text-neutral-dark'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* Mobile Search */}
                <div className="p-6 border-t border-neutral-light lg:hidden">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-neutral-medium" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full pl-10 pr-12 py-2 border border-neutral-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-neutral-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      onClick={handleSearch}
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 text-neutral-dark hover:text-primary"
                      aria-label="Search"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link
            to="/"
            className="absolute left-1/2 transform -translate-x-1/2 lg:static lg:transform-none font-playfair font-bold text-lg sm:text-2xl text-secondary tracking-tight"
          >
            Roots & Richness
          </Link>

{/* Desktop Navigation Centered */}
<nav className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 space-x-6 xl:space-x-8">
  {navItems.map(item => (
    <Link
      key={item.href}
      to={item.href}
      className={`font-medium transition-colors hover:text-primary text-sm xl:text-base ${
        isActive(item.href) ? 'text-primary' : 'text-neutral-dark'
      }`}
    >
      {item.label}
    </Link>
  ))}
</nav>

          {/* Right Section (Desktop Search + Cart) */}
          <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">

            {/* Desktop Search */}
            <div className="hidden lg:flex relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">

              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-5 pr-10 py-1 border border-neutral-light rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-neutral-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="absolute inset-y-0 right-1 flex items-center justify-center px-3 text-neutral-dark hover:text-primary"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            </div>

            {/* Cart */}
            <Link
              to="/cart"
              className="flex items-center p-2 sm:p-3 hover:bg-neutral-light rounded-full transition-colors relative min-w-[48px] min-h-[48px] justify-center"
            >
              <ShoppingCart size={20} className="text-neutral-dark" />
              {cartState.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {cartState.itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
