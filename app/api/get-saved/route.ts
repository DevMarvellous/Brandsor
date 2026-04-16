import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUidFromBearer } from '@/lib/apiAuth';
import { errorResponse } from '@/lib/apiErrors';

export async function GET(req: Request) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const snapshot = await adminDb.collection('saved_names')
      .where('userId', '==', uid)
      .limit(100)
      .get();

    // Sort client-side to avoid index requirement
    const savedNames = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

    return NextResponse.json({ savedNames });
  } catch (error) {
    console.error("Error fetching saved names:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
