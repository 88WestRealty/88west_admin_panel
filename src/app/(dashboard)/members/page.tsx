import type { Metadata } from 'next';
import { APP_NAME } from '@/constants';
import { MembersScreen } from '@/features/members';

export const metadata: Metadata = { title: `Verify members · ${APP_NAME}` };

/** Thin route entry: the screen component owns everything below it. */
export default function MembersPage() {
  return <MembersScreen />;
}
