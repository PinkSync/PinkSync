/**
 * Workers API - Background job management
 */

import { NextRequest, NextResponse } from 'next/server';
import { workerSystem } from '@/services/workers';
import { deafAuthService } from '@/services/deafauth';

async function requireUser(request: NextRequest) {
  const value = request.headers.get('authorization');
  const token = value?.startsWith('Bearer ') ? value.slice(7).trim() : null;
  return token ? deafAuthService.validateToken(token) : null;
}

export async function GET(request: NextRequest) {
  if (!await requireUser(request)) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    if (id) {
      const job = workerSystem.getJob(id);
      if (!job) {
        return NextResponse.json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Job not found' },
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: job,
      });
    }

    if (status) {
      const jobs = workerSystem.getJobsByStatus(status as any);
      return NextResponse.json({
        success: true,
        data: jobs,
      });
    }

    // Return all jobs
    const jobs = workerSystem.getAllJobs();
    return NextResponse.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'WORKER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, payload, priority, jobId } = body;

    if (action === 'queue' && type && payload) {
      const id = await workerSystem.queueJob(type, payload, priority);
      return NextResponse.json({
        success: true,
        data: { jobId: id },
      });
    }

    if (action === 'cancel' && jobId) {
      const success = await workerSystem.cancelJob(jobId);
      return NextResponse.json({
        success,
      });
    }

    if (action === 'stats') {
      const stats = workerSystem.getStats();
      return NextResponse.json({
        success: true,
        data: stats,
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
        code: 'WORKER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 500 });
  }
}
