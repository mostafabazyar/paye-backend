import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing'; // use './i18n/routing' if file is inside src/

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)'],
};