import { NextRequest, NextResponse } from 'next/server';
import { deafAuthService } from '@/services/deafauth';

const errorResponse = (code: string, message: string, status: number) =>
  NextResponse.json({ success: false, error: { code, message } }, { status });

function bearerToken(request: NextRequest, bodyToken?: unknown): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim() || null;
  return typeof bodyToken === 'string' && bodyToken.length <= 512 ? bodyToken : null;
}

async function authenticatedUser(request: NextRequest, bodyToken?: unknown) {
  const token = bearerToken(request, bodyToken);
  return token ? { token, user: await deafAuthService.validateToken(token) } : null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await authenticatedUser(request);
    if (!session?.user) return errorResponse('INVALID_TOKEN', 'Authentication required', 401);
    return NextResponse.json({
      success: true,
      preferences: session.user.preferences,
      user: { id: session.user.id, username: session.user.username, email: session.user.email, displayName: session.user.profile?.displayName },
    });
  } catch {
    return errorResponse('AUTH_ERROR', 'Authentication failed', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || typeof body.action !== 'string') return errorResponse('INVALID_INPUT', 'A valid action is required', 400);

    switch (body.action) {
      case 'login': {
        const credentials = body.credentials;
        const verification = body.verification;
        if (!credentials || typeof credentials.username !== 'string' || typeof credentials.password !== 'string' || credentials.username.length > 128 || credentials.password.length > 1024) return errorResponse('INVALID_INPUT', 'Valid credentials are required', 400);
        if (!verification || !Array.isArray(verification.pattern) || verification.pattern.length < 3 || verification.pattern.length > 32) return errorResponse('INVALID_VERIFICATION', 'Visual verification is required', 400);
        const result = await deafAuthService.authenticate(credentials, verification);
        return NextResponse.json({ success: result.success, data: result.success ? { user: result.user, token: result.token } : undefined, user: result.user, token: result.token, error: result.error ? { code: 'AUTH_FAILED', message: 'Authentication failed' } : undefined }, { status: result.success ? 200 : 401 });
      }
      case 'register': {
        const { credentials, profile } = body;
        if (!credentials || typeof credentials.username !== 'string' || typeof credentials.password !== 'string' || !profile || typeof profile.email !== 'string' || typeof profile.displayName !== 'string') return errorResponse('INVALID_INPUT', 'Valid registration details are required', 400);
        const result = await deafAuthService.register(credentials, profile);
        return NextResponse.json({ success: result.success, data: result.user, error: result.error ? { code: 'REGISTRATION_FAILED', message: 'Registration failed' } : undefined }, { status: result.success ? 200 : 400 });
      }
      case 'validate': {
        const session = await authenticatedUser(request, body.token);
        return NextResponse.json({ success: !!session?.user, data: session?.user ?? null }, { status: session?.user ? 200 : 401 });
      }
      case 'logout': {
        const session = await authenticatedUser(request, body.token);
        if (!session?.user) return errorResponse('INVALID_TOKEN', 'Authentication required', 401);
        await deafAuthService.logout(session.token);
        return NextResponse.json({ success: true });
      }
      case 'update-preferences': {
        const session = await authenticatedUser(request);
        if (!session?.user) return errorResponse('INVALID_TOKEN', 'Authentication required', 401);
        if (body.userId !== session.user.id || !body.preferences || typeof body.preferences !== 'object') return errorResponse('FORBIDDEN', 'Cannot update another user', 403);
        await deafAuthService.updatePreferences(session.user.id, body.preferences);
        return NextResponse.json({ success: true });
      }
      default: return errorResponse('INVALID_ACTION', 'Invalid action', 400);
    }
  } catch {
    return errorResponse('AUTH_ERROR', 'Authentication request failed', 500);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export { bearerToken };
export { authenticatedUser };
