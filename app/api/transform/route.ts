/**
 * Content Transformation API
 */

import { NextRequest, NextResponse } from 'next/server';
import { pinkFlowEngine } from '@/services/pinkflow';
import { workerSystem } from '@/services/workers';
import { TransformationType } from '@/types';
import { deafAuthService } from '@/services/deafauth';

function authToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7).trim() || null : null;
}

async function requireUser(request: NextRequest) {
  const token = authToken(request);
  return token ? deafAuthService.validateToken(token) : null;
}

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  try {
    const body = await request.json();
    const { content, type, userId, preferences, async = false } = body;

    if (!content || !type) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Content and type are required' },
      }, { status: 400 });
    }

    // Validate transformation type
    const validTypes: TransformationType[] = ['simplify', 'visualize', 'transcribe', 'sign-language', 'structure'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'Invalid transformation type' },
      }, { status: 400 });
    }

    if (async) {
      // Queue as background job
      const jobId = await workerSystem.queueJob('content.simplify', {
        content,
        userId,
        preferences,
      });

      return NextResponse.json({
        success: true,
        data: {
          jobId,
          status: 'queued',
        },
      });
    } else {
      // Process synchronously
      const result = await pinkFlowEngine.transform(content, type, userId, preferences);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'TRANSFORM_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (id) {
      const transformation = pinkFlowEngine.getTransformation(id);
      if (!transformation) {
        return NextResponse.json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Transformation not found' },
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: transformation,
      });
    }

    if (userId) {
      const transformations = pinkFlowEngine.getUserTransformations(userId);
      return NextResponse.json({
        success: true,
        data: transformations,
      });
    }

    return NextResponse.json({
      success: false,
      error: { code: 'INVALID_QUERY', message: 'ID or userId required' },
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'QUERY_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}
