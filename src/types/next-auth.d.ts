// types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
    /**
     * Extending the built-in session type
     */
    interface Session {
        /** Ethereum address of the user */
        address?: string;
    }
}
