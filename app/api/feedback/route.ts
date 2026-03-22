import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = adminDb.collection('feedback').doc();
    await docRef.set({
      name,
      email,
      message,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error: any) {
    console.error("Error saving feedback:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
