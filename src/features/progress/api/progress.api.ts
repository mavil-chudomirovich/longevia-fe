import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import {
  BodyMetricResponseDto,
  CurrentFastingResponseDto,
  DashboardSummaryResponseDto,
  EndFastingRequestDto,
  EndFastingResponseDto,
  FastingSessionResponseDto,
  FastingHistoryPageDto,
  GetMetricsHistoryParamsDto,
  LogBodyMetricRequestDto,
  LogSleepRequestDto,
  LogWaterRequestDto,
  MetricsHistoryResponseDto,
  SleepResponseDto,
  StartFastingRequestDto,
  WaterSummaryResponseDto,
} from '../types/progress.dto';
import {
  BodyMetricRecord,
  CurrentFastingSession,
  DashboardSummary,
  EndFastingResult,
  FastingHistoryPageModel,
  FastingSessionResult,
  GetMetricsHistoryFilters,
  MetricsHistory,
  SleepRecord,
  WaterSummary,
} from '../types/progress.model';
import {
  EndFastingFormValues,
  LogBodyMetricFormValues,
  LogSleepFormValues,
  LogWaterFormValues,
  StartFastingFormValues,
} from '../schemas/progress.schema';
import { progressMapper } from '../mappers/progress.mapper';
import { toUtcInstantIsoString } from '../utils/progress-date';

export const progressApi = {
  /**
   * Lấy tổng hợp chỉ số dashboard & streak
   * GET /api/progress/dashboard/summary
   */
  getDashboardSummary: async (signal?: AbortSignal): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummaryResponseDto>(
      API_ENDPOINTS.PROGRESS.DASHBOARD_SUMMARY,
      { signal }
    );
    return progressMapper.toDashboardSummary(res.data);
  },

  /**
   * Lấy thông tin phiên nhịn ăn đang hoạt động (trả về null nếu không có)
   * GET /api/progress/fasting/current
   */
  getCurrentFasting: async (signal?: AbortSignal): Promise<CurrentFastingSession | null> => {
    const res = await api.get<CurrentFastingResponseDto | null>(
      API_ENDPOINTS.PROGRESS.FASTING_CURRENT,
      { signal }
    );
    return progressMapper.toCurrentFastingSession(res.data);
  },

  getFastingHistory: async (
    page: number,
    pageSize: number,
    signal?: AbortSignal
  ): Promise<FastingHistoryPageModel> => {
    const res = await api.get<FastingHistoryPageDto>(API_ENDPOINTS.PROGRESS.FASTING_HISTORY, {
      params: { page, pageSize },
      signal,
      silent: true,
    });
    return progressMapper.toFastingHistoryPage(res.data);
  },

  /**
   * Bắt đầu một phiên nhịn ăn mới
   * POST /api/progress/fasting/start
   */
  startFasting: async (
    values: StartFastingFormValues,
    signal?: AbortSignal
  ): Promise<FastingSessionResult> => {
    const payload: StartFastingRequestDto = {
      protocol: values.protocol,
      startedAt: toUtcInstantIsoString(values.startedAt),
      targetHours: values.targetHours,
    };

    const res = await api.post<FastingSessionResponseDto>(
      API_ENDPOINTS.PROGRESS.FASTING_START,
      payload,
      { silent: true, showErrorToast: false, signal }
    );
    return progressMapper.toFastingSessionResult(res.data);
  },

  /**
   * Kết thúc phiên nhịn ăn hiện tại
   * POST /api/progress/fasting/end
   */
  endFasting: async (
    values: EndFastingFormValues,
    signal?: AbortSignal
  ): Promise<EndFastingResult> => {
    const payload: EndFastingRequestDto = {
      sessionId: values.sessionId,
      endedAt: toUtcInstantIsoString(values.endedAt),
    };

    const res = await api.post<EndFastingResponseDto>(API_ENDPOINTS.PROGRESS.FASTING_END, payload, {
      silent: true,
      showErrorToast: false,
      signal,
    });
    return progressMapper.toEndFastingResult(res.data);
  },

  /**
   * Lấy tổng lượng nước uống hôm nay
   * GET /api/progress/water/today
   */
  getWaterToday: async (signal?: AbortSignal): Promise<WaterSummary> => {
    const res = await api.get<WaterSummaryResponseDto>(API_ENDPOINTS.PROGRESS.WATER_TODAY, {
      signal,
    });
    return progressMapper.toWaterSummary(res.data);
  },

  /**
   * Ghi nhận lượng nước uống
   * POST /api/progress/water/log
   */
  logWater: async (values: LogWaterFormValues, signal?: AbortSignal): Promise<WaterSummary> => {
    const payload: LogWaterRequestDto = {
      amountMl: values.amountMl,
    };

    const res = await api.post<WaterSummaryResponseDto>(API_ENDPOINTS.PROGRESS.WATER_LOG, payload, {
      silent: true,
      showErrorToast: false,
      signal,
    });
    return progressMapper.toWaterSummary(res.data);
  },

  /**
   * Ghi nhận giấc ngủ
   * POST /api/progress/sleep/log
   */
  logSleep: async (values: LogSleepFormValues, signal?: AbortSignal): Promise<SleepRecord> => {
    const payload: LogSleepRequestDto = {
      sleptAt: toUtcInstantIsoString(values.sleptAt),
      wokeAt: toUtcInstantIsoString(values.wokeAt),
      sleepQuality: values.sleepQuality,
    };

    const res = await api.post<SleepResponseDto>(API_ENDPOINTS.PROGRESS.SLEEP_LOG, payload, {
      silent: true,
      showErrorToast: false,
      signal,
    });
    return progressMapper.toSleepRecord(res.data);
  },

  /**
   * Ghi nhận chỉ số cơ thể & snapshot BMI
   * POST /api/progress/metrics
   */
  logBodyMetric: async (
    values: LogBodyMetricFormValues,
    signal?: AbortSignal
  ): Promise<BodyMetricRecord> => {
    const payload: LogBodyMetricRequestDto = {
      loggedAt: toUtcInstantIsoString(values.loggedAt),
      weightKg: values.weightKg,
      bodyFatPercent: values.bodyFatPercent ?? null,
      waistCircumferenceCm: values.waistCircumferenceCm ?? null,
      systolicBloodPressure: values.systolicBloodPressure ?? null,
      diastolicBloodPressure: values.diastolicBloodPressure ?? null,
      restingHeartRate: values.restingHeartRate ?? null,
    };

    const res = await api.post<BodyMetricResponseDto>(API_ENDPOINTS.PROGRESS.METRICS, payload, {
      silent: true,
      showErrorToast: false,
      signal,
    });
    return progressMapper.toBodyMetricRecord(res.data);
  },

  /**
   * Tra cứu lịch sử chỉ số cơ thể có phân trang
   * GET /api/progress/metrics/history
   */
  getMetricsHistory: async (
    filters?: GetMetricsHistoryFilters,
    signal?: AbortSignal
  ): Promise<MetricsHistory> => {
    const params: GetMetricsHistoryParamsDto = {
      fromDate: filters?.fromDate,
      toDate: filters?.toDate,
      pageNumber: filters?.pageNumber ?? 1,
      pageSize: filters?.pageSize ?? 20,
    };

    const res = await api.get<MetricsHistoryResponseDto>(API_ENDPOINTS.PROGRESS.METRICS_HISTORY, {
      params,
      signal,
    });
    return progressMapper.toMetricsHistory(res.data);
  },
};
