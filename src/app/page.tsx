import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants';

/** The middleware sends signed-out visitors to /login before this runs. */
export default function HomePage() {
  redirect(ROUTES.members);
}
