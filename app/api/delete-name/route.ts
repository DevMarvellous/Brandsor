import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing document id" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const { adminAuth } = await import('@/lib/firebaseAdmin');
    let uid;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
    } catch (e) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    // Verify ownership
    const docRef = adminDb.collection("saved_names").doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data()?.userId !== uid) {
      return NextResponse.json({ error: "Forbidden or Not Found" }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error deleting name:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
