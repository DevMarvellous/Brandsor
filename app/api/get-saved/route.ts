import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Since this is a simple GET, we are using query param for ease.
    // In production, we'd still want headers verifying the token.
    const snapshot = await adminDb.collection('saved_names')
      .where('userId', '==', uid)
      .get();

    const savedNames = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a: any, b: any) => {
      const timeA = a.createdAt?.toDate?.() || 0;
      const timeB = b.createdAt?.toDate?.() || 0;
      return timeB - timeA;
    });

    return NextResponse.json({ savedNames });
  } catch (error: any) {
    console.error("Error fetching saved names:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
