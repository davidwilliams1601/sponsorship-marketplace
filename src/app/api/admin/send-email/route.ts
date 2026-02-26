import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: string;
  location: string;
  contactEmail: string;
}

function applyMergeTags(template: string, recipient: Recipient): string {
  return template
    .replace(/\{\{name\}\}/g, recipient.name || '')
    .replace(/\{\{email\}\}/g, recipient.email || '')
    .replace(/\{\{type\}\}/g, recipient.type || '')
    .replace(/\{\{location\}\}/g, recipient.location || '')
    .replace(/\{\{contactEmail\}\}/g, recipient.contactEmail || recipient.email || '');
}

function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
}

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service is not configured' }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Verify bearer token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  let uid: string;
  try {
    const payload = decodeJwtPayload(token);
    uid = payload.user_id || payload.sub;
    if (!uid) throw new Error('No UID in token');
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Verify admin role
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists() || userDoc.data()?.type !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
  }

  // Parse request body
  let recipients: Recipient[], subjectTemplate: string, bodyTemplate: string;
  try {
    const body = await request.json();
    recipients = body.recipients;
    subjectTemplate = body.subjectTemplate;
    bodyTemplate = body.bodyTemplate;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Validate
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients provided' }, { status: 400 });
  }
  if (recipients.length > 100) {
    return NextResponse.json({ error: 'Too many recipients (max 100)' }, { status: 400 });
  }
  if (!subjectTemplate?.trim() || !bodyTemplate?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
  }

  // Send emails
  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const subject = applyMergeTags(subjectTemplate, recipient);
      const text = applyMergeTags(bodyTemplate, recipient);
      await resend.emails.send({
        from: 'SponsorConnect Admin <david@sponsorconnect.co>',
        to: recipient.email,
        subject,
        text,
      });
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed, total: recipients.length });
}
