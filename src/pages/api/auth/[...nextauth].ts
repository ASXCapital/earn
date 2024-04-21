import { IncomingMessage } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getCsrfToken } from 'next-auth/react';
import { SiweMessage } from 'siwe';

export function getAuthOptions(req: IncomingMessage): NextAuthOptions {
    const providers = [
        CredentialsProvider({
            async authorize(credentials) {
                try {
                    const siwe = new SiweMessage(
                        JSON.parse(credentials?.message || '{}')
                    );

                    const nextAuthUrl =
                        process.env.NEXTAUTH_URL ||
                        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

                    if (!nextAuthUrl) {
                        console.error("No NextAuth URL configured.");
                        return null;
                    }

                    const nextAuthHost = new URL(nextAuthUrl).host;

                    if (siwe.domain !== nextAuthHost) {
                        console.error("Domain mismatch:", siwe.domain, "vs", nextAuthHost);
                        return null;
                    }

                    const csrfToken = await getCsrfToken({ req: { headers: req.headers } });

                    if (siwe.nonce !== csrfToken) {
                        console.error("Nonce mismatch:", siwe.nonce, "vs", csrfToken);
                        return null;
                    }

                    await siwe.validate(credentials?.signature || '');

                    return {
                        id: siwe.address,
                    };
                } catch (e) {
                    return null;
                }
            },
            credentials: {
                message: {
                    label: 'Message',
                    placeholder: '0x0',
                    type: 'text',
                },
                signature: {
                    label: 'Signature',
                    placeholder: '0x0',
                    type: 'text',
                },
            },
            name: 'Ethereum',
        }),
    ];
    console.log("Fetching CSRF token...");
    console.log("Headers:", req.headers);
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("WalletConnect Project ID:", process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);


    return {
        callbacks: {
            async session({ session, token }) {
                console.log("Session callback called with token:", token);
                session.address = token.sub;
                session.user = {
                    name: token.sub,
                };
                console.log("Session object modified with address and user name:", session);
                return session;
            },
        },
        providers,
        secret: process.env.NEXTAUTH_SECRET,
        session: {
            strategy: 'jwt',
        },
    };
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    console.log("Auth function called with request method:", req.method);
    console.log("Request query parameters:", req.query.nextauth);

    const authOptions = getAuthOptions(req);
    if (!Array.isArray(req.query.nextauth)) {
        console.error("Bad request: query parameter 'nextauth' is not an array");
        res.status(400).send('Bad request');
        return;
    }

    const isDefaultSigninPage = req.method === 'GET' && req.query.nextauth.find(value => value === 'signin');
    console.log("Is default sign-in page:", isDefaultSigninPage);

    // Hide Sign-In with Ethereum from default sign page
    if (isDefaultSigninPage) {
        authOptions.providers.pop();
        console.log("Ethereum provider removed from the options");
    }

    return await NextAuth(req, res, authOptions);
}
