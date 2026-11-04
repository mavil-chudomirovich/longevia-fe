import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/lib/axios';
import { progressApi } from './progress.api';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';

vi.mock('@/lib/axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

describe('progressApi Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDashboardSummary calls correct endpoint and returns mapped model', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        currentWeightKg: 70.0,
        initialWeightKg: 75.0,
        weightDeltaKg: -1.0,
        currentBmi: 22.86,
        currentStreakDays: 3,
        bestStreakDays: 7,
        fastingThisWeekCompleted: 2,
        averageSleepHours: 7.5,
      },
    });

    const result = await progressApi.getDashboardSummary();

    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PROGRESS.DASHBOARD_SUMMARY, {
      signal: undefined,
    });
    expect(result.currentWeightKg).toBe(70.0);
    expect(result.bmiCategoryLabel).toBe('Bình thường');
  });

  it('getCurrentFasting calls correct endpoint and maps active session', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        sessionId: 'sess-123',
        protocol: '16:8',
        startedAt: '2026-10-25T08:00:00Z',
        targetEndedAt: '2026-10-26T00:00:00Z',
        targetHours: 16,
        elapsedHours: 8.0,
        remainingHours: 8.0,
        status: 'InProgress',
      },
    });

    const result = await progressApi.getCurrentFasting();

    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PROGRESS.FASTING_CURRENT, {
      signal: undefined,
    });
    expect(result?.sessionId).toBe('sess-123');
    expect(result?.progressPercent).toBe(50);
  });

  it('startFasting serializes startedAt to ISO UTC instant and posts to start endpoint', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        sessionId: 'sess-123',
        protocol: '16:8',
        startedAt: '2026-10-25T08:00:00.000Z',
        targetEndedAt: '2026-10-26T00:00:00.000Z',
        status: 'InProgress',
      },
    });

    const result = await progressApi.startFasting({
      protocol: '16:8',
      startedAt: '2026-10-25T08:00:00.000Z',
      targetHours: 16,
    });

    expect(api.post).toHaveBeenCalledWith(
      API_ENDPOINTS.PROGRESS.FASTING_START,
      {
        protocol: '16:8',
        startedAt: '2026-10-25T08:00:00.000Z',
        targetHours: 16,
      },
      { showErrorToast: false }
    );
    expect(result.sessionId).toBe('sess-123');
  });

  it('logWater posts amount to water log endpoint', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        date: '2026-10-25',
        consumedMl: 500,
        targetMl: 2500,
        percentComplete: 20.0,
      },
    });

    const result = await progressApi.logWater({ amountMl: 500 });

    expect(api.post).toHaveBeenCalledWith(
      API_ENDPOINTS.PROGRESS.WATER_LOG,
      { amountMl: 500 },
      { showErrorToast: false }
    );
    expect(result.consumedMl).toBe(500);
    expect(result.remainingMl).toBe(2000);
  });

  it('logSleep serializes instants to UTC and posts to sleep log endpoint', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id: 'sleep-1',
        sleptAt: '2026-10-24T23:00:00.000Z',
        wokeAt: '2026-10-25T07:00:00.000Z',
        sleepQuality: 'Good',
        durationHours: 8.0,
        date: '2026-10-25',
      },
    });

    const result = await progressApi.logSleep({
      sleptAt: '2026-10-24T23:00:00.000Z',
      wokeAt: '2026-10-25T07:00:00.000Z',
      sleepQuality: 'Good',
    });

    expect(api.post).toHaveBeenCalledWith(
      API_ENDPOINTS.PROGRESS.SLEEP_LOG,
      {
        sleptAt: '2026-10-24T23:00:00.000Z',
        wokeAt: '2026-10-25T07:00:00.000Z',
        sleepQuality: 'Good',
      },
      { showErrorToast: false }
    );
    expect(result.sleepQualityLabel).toBe('Tốt');
  });

  it('logBodyMetric posts biomarkers and maps resulting snapshot with BMI', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id: 'metric-1',
        loggedAt: '2026-10-25T07:30:00.000Z',
        weightKg: 70.0,
        bmi: 22.86,
        bmiCategory: 'NormalWeight',
        bodyFatPercent: 18.0,
        waistCircumferenceCm: 80.0,
        systolicBloodPressure: 120,
        diastolicBloodPressure: 80,
        restingHeartRate: 65,
      },
    });

    const result = await progressApi.logBodyMetric({
      loggedAt: '2026-10-25T07:30:00.000Z',
      weightKg: 70.0,
      bodyFatPercent: 18.0,
      waistCircumferenceCm: 80.0,
      systolicBloodPressure: 120,
      diastolicBloodPressure: 80,
      restingHeartRate: 65,
    });

    expect(api.post).toHaveBeenCalledWith(
      API_ENDPOINTS.PROGRESS.METRICS,
      {
        loggedAt: '2026-10-25T07:30:00.000Z',
        weightKg: 70.0,
        bodyFatPercent: 18.0,
        waistCircumferenceCm: 80.0,
        systolicBloodPressure: 120,
        diastolicBloodPressure: 80,
        restingHeartRate: 65,
      },
      { showErrorToast: false }
    );
    expect(result.bmi).toBe(22.86);
    expect(result.bmiCategoryLabel).toBe('Bình thường');
  });

  it('getMetricsHistory passes filters as query parameters and returns paginated result', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        items: [],
        pageNumber: 2,
        pageSize: 10,
        totalCount: 15,
        totalPages: 2,
      },
    });

    const result = await progressApi.getMetricsHistory({
      fromDate: '2026-10-01',
      toDate: '2026-10-25',
      pageNumber: 2,
      pageSize: 10,
    });

    expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PROGRESS.METRICS_HISTORY, {
      params: {
        fromDate: '2026-10-01',
        toDate: '2026-10-25',
        pageNumber: 2,
        pageSize: 10,
      },
      signal: undefined,
    });
    expect(result.pageNumber).toBe(2);
    expect(result.hasPrevPage).toBe(true);
    expect(result.hasNextPage).toBe(false);
  });
});
