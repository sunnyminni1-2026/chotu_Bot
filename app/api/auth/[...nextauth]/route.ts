import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDatabase } from "@/lib/mongodb";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
            clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user }) {
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as Record<string, unknown>).id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
