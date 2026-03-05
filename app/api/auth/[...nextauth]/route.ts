import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDatabase } from "@/lib/mongodb";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
            clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        }),
    ],
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user }: { user: any }) {
            try {
                const db = await getDatabase();
                const usersCollection = db.collection("users");

                // Upsert user on sign-in
                await usersCollection.updateOne(
                    { email: user.email },
                    {
                        $set: {
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            lastLogin: new Date(),
                        },
                        $setOnInsert: {
                            createdAt: new Date(),
                            plan: "free",
                        },
                    },
                    { upsert: true }
                );

                return true;
            } catch (error) {
                console.error("Sign-in error:", error);
                return true; // Still allow sign-in even if DB fails
            }
        },
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session.user) {
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
