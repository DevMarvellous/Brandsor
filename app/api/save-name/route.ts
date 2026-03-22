import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { name, tagline } = await req.json();

    // In a real app with Firebase Admin properly setup, you'd extract the token:
    // const authHeader = req.headers.get("authorization");
    // const decodedToken = await adminAuth.verifyIdToken(token);
    // const uid = decodedToken.uid;
    // For this prototype, we will trust a simple uid header or session if needed,
    // actually let's implement the auth token check.
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // Using dynamic import of adminAuth to avoid errors if not configured in dev
    const { adminAuth } = await import('@/lib/firebaseAdmin');
    let uid;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (e) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    if (!name || !tagline) {
      return NextResponse.json({ error: "Missing name or tagline" }, { status: 400 });
    }

    const docRef = adminDb.collection("saved_names").doc();
    await docRef.set({
      userId: uid,
      name,
      tagline,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error: any) {
    console.error("Error saving name:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
