import { NextRequest, NextResponse } from "next/server";
import { db } from "~/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const { permalink } = await request.json();

    if (!permalink) {
      return NextResponse.json({ error: "Permalink required" }, { status: 400 });
    }

    // Find the user by permalink
    const user = await db.user.findUnique({
      where: { permalink },
      include: { family: true },
    });

    if (!user || user.role !== "CHILD") {
      return NextResponse.json({ error: "Invalid permalink" }, { status: 404 });
    }

    // Check if user has an account record, create one if needed
    let account = await db.account.findFirst({
      where: { userId: user.id }
    });

    if (!account) {
      account = await db.account.create({
        data: {
          userId: user.id,
          type: "credentials",
          provider: "permalink",
          providerAccountId: user.permalink!,
        },
      });
    }

    // Create a session manually in the database
    const sessionToken = nanoid(32);
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // Verify the session was created
    const createdSession = await db.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    // Set the session cookie
    const response = NextResponse.json({ success: true });
    const cookieName = process.env.NODE_ENV === "production" 
      ? "__Secure-next-auth.session-token" 
      : "next-auth.session-token";
    
    response.cookies.set(cookieName, sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Also set the callback URL cookie to complete the flow
    response.cookies.set("next-auth.callback-url", "http://localhost:3000/dashboard/child", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}