import { NavLink, useLocation } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { Wallet, ListChecks, Dumbbell, Target, Sparkles, type LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const items: NavItem[] = [
  { to: '/money', label: 'Money', Icon: Wallet },
  { to: '/tasks', label: 'Tasks', Icon: ListChecks },
  { to: '/workouts', label: 'Workouts', Icon: Dumbbell },
  { to: '/goals', label: 'Goals', Icon: Target },
  { to: '/coach', label: 'Coach', Icon: Sparkles },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: 'max(var(--safe-bottom), 16px)' }}
      aria-label="Primary"
    >
      <div className="glass shadow-nav relative flex w-full max-w-md items-center justify-between rounded-pill px-2 py-2">
        <LayoutGroup id="bottom-nav">
          {items.map((item) => {
            const active = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-pill px-2 py-2 outline-none"
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 rounded-pill bg-accent-grad shadow-glow"
                    style={{ opacity: 0.85 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <motion.span
                  whileTap={{ scale: 0.9 }}
                  className="relative z-10 flex flex-col items-center gap-0.5"
                >
                  <item.Icon
                    size={20}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={active ? 'text-text-primary' : 'text-text-secondary'}
                  />
                  <span
                    className={`text-[10px] font-medium tracking-wide ${
                      active ? 'text-text-primary' : 'text-text-muted'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.span>
              </NavLink>
            );
          })}
        </LayoutGroup>
      </div>
    </nav>
  );
}
