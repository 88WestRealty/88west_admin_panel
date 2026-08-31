import type { Metadata } from 'next';
import { APP_NAME } from '@/constants';
import { VendorsScreen } from '@/features/vendors';

export const metadata: Metadata = { title: `Vendors · ${APP_NAME}` };

export default function VendorsPage() {
  return <VendorsScreen />;
}
