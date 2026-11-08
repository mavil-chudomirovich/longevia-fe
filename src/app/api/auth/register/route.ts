import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { BACKEND_URL } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const backend = await fetch(`${BACKEND_URL}${API_ENDPOINTS.IDENTITY.AUTH.REGISTER}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await request.text(),
    });
    const payload: unknown = await backend.json().catch(() => null);
    return NextResponse.json(payload, { status: backend.status });
  } catch {
    return NextResponse.json({ status: 502, title: 'Không thể kết nối máy chủ.' }, { status: 502 });
  }
}
