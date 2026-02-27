import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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

  // Verify admin role via Firestore REST API
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    const firestoreRes = await fetch(firestoreUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!firestoreRes.ok) {
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 500 });
    }
    const firestoreData = await firestoreRes.json();
    const userType = firestoreData.fields?.type?.stringValue;
    if (userType !== 'admin') {
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

  // Send emails via batch API (single request, avoids rate limiting)
  const batch = recipients.map((recipient) => ({
    from: 'SponsorConnect Admin <david@sponsorconnect.co>',
    to: recipient.email,
    subject: applyMergeTags(subjectTemplate, recipient),
    text: applyMergeTags(bodyTemplate, recipient),
  }));

  const { data, error } = await resend.batch.send(batch);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent = data?.data?.length ?? 0;
  const failed = recipients.length - sent;

  // Log the email send to Firestore
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const logUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/emailLogs`;
    await fetch(logUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          adminId: { stringValue: uid },
          subject: { stringValue: subjectTemplate },
          sentAt: { timestampValue: new Date().toISOString() },
          sentCount: { integerValue: sent },
          failedCount: { integerValue: failed },
          recipients: {
            arrayValue: {
              values: recipients.map((r) => ({
                mapValue: {
                  fields: {
                    id: { stringValue: r.id },
                    name: { stringValue: r.name },
                    email: { stringValue: r.email },
                  },
                },
              })),
            },
          },
        },
      }),
    });
  } catch {
    // Non-fatal: logging failure shouldn't block the response
  }

  return NextResponse.json({ sent, failed, total: recipients.length });
}
