'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants';
import { SignOutButton } from '@/features/auth';
import { selectUser, useAuthStore } from '@/store/auth.store';
import styles from './AppNav.module.css';

const LINKS = [
  { href: ROUTES.members, label: 'Verify members' },
  { href: ROUTES.vendors, label: 'Vendors' },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const user = useAuthStore(selectUser);

  return (
    <nav className={styles.nav} aria-label="Main">
      <span className={styles.brand}>
        <span className={styles.brandAccent}>88</span>WEST
      </span>

      <ul className={styles.links}>
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={styles.link}
              data-active={pathname.startsWith(link.href) || undefined}
              aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.account}>
        {user ? <span className={styles.email}>{user.email}</span> : null}
        <SignOutButton className={styles.signOut} />
      </div>
    </nav>
  );
}
