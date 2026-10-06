/**
 * Providers API - Service provider management and matching
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiBroker } from '@/services/api-broker';
import { deafAuthService } from '@/services/deafauth';

async function requireUser(request: NextRequest) {
  const value = request.headers.get('authorization');
  const token = value?.startsWith('Bearer ') ? value.slice(7).trim() : null;
  return token ? deafAuthService.validateToken(token) : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');

    if (id) {
      const provider = apiBroker.getProvider(id);
      if (!provider) {
        return NextResponse.json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Provider not found' },
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: provider,
      });
    }

    if (search) {
      const results = apiBroker.searchProviders(search, type as any);
      return NextResponse.json({
        success: true,
        data: results,
      });
    }

    if (type) {
      const providers = apiBroker.getProvidersByType(type as any);
      return NextResponse.json({
        success: true,
        data: providers,
      });
    }

    // Return all providers
    const providers = apiBroker.getAllProviders();
    return NextResponse.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'PROVIDER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await requireUser(request)) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  try {
    const body = await request.json();
    const { action, userId, needs } = body;

    if (action === 'match' && userId && needs) {
      const matches = await apiBroker.matchProviders(userId, needs);
      return NextResponse.json({
        success: true,
        data: matches,
      });
    }

    if (action === 'call' && body.providerId && body.capability) {
      const result = await apiBroker.callProviderApi(
        body.providerId,
        body.capability,
        body.parameters || {}
      );
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_ACTION', message: 'Invalid action' },
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'PROVIDER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}
