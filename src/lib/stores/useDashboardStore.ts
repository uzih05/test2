/**
 * Global Dashboard Store (Zustand)
 *
 * 전역 상태 관리:
 * - Time Range (시간 범위)
 * - Fill Mode (차트 스타일)
 * - Custom Date Filter (커스텀 날짜 필터)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ Types ============
export type FillMode = 'stroke-only' | 'gradient' | 'solid';

export interface TimeRange {
    // 프리셋 값 (분 단위): 15, 60, 360, 1440, 10080
    preset: number | null;
    // 커스텀 범위
    customStart: Date | null;
    customEnd: Date | null;
    // 현재 활성화된 모드
    mode: 'preset' | 'custom';
}

export interface DashboardState {
    // 시간 범위
    timeRange: TimeRange;
    // 계산된 시간 범위 (분 단위) - 반응성을 위해 상태로 관리
    timeRangeMinutes: number;
    // 시간 범위 라벨
    timeRangeLabel: string;
    
    setTimeRangePreset: (minutes: number) => void;
    setTimeRangeCustom: (start: Date, end: Date) => void;

    // 차트 스타일
    fillMode: FillMode;
    setFillMode: (mode: FillMode) => void;
}

// ============ 프리셋 옵션 ============
export const TIME_RANGE_PRESETS = [
    { value: 15, label: '15분' },
    { value: 30, label: '30분' },
    { value: 60, label: '1시간' },
    { value: 180, label: '3시간' },
    { value: 360, label: '6시간' },
    { value: 720, label: '12시간' },
    { value: 1440, label: '24시간' },
    { value: 4320, label: '3일' },
    { value: 10080, label: '7일' },
];

// ============ Helper Functions ============
function calculateTimeRangeMinutes(timeRange: TimeRange): number {
    if (timeRange.mode === 'preset' && timeRange.preset) {
        return timeRange.preset;
    }
    if (timeRange.mode === 'custom' && timeRange.customStart && timeRange.customEnd) {
        const diffMs = timeRange.customEnd.getTime() - timeRange.customStart.getTime();
        return Math.floor(diffMs / (1000 * 60));
    }
    return 1440; // 기본값 24시간
}

function calculateTimeRangeLabel(timeRange: TimeRange): string {
    if (timeRange.mode === 'preset' && timeRange.preset) {
        const preset = TIME_RANGE_PRESETS.find(p => p.value === timeRange.preset);
        return preset?.label || `${timeRange.preset}분`;
    }
    if (timeRange.mode === 'custom' && timeRange.customStart && timeRange.customEnd) {
        const formatDate = (d: Date) =>
            d.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        return `${formatDate(timeRange.customStart)} ~ ${formatDate(timeRange.customEnd)}`;
    }
    return '24시간';
}

// ============ Store ============
export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => {
            const defaultTimeRange: TimeRange = {
                preset: 1440, // 24시간
                customStart: null,
                customEnd: null,
                mode: 'preset',
            };

            return {
                // 초기값
                timeRange: defaultTimeRange,
                timeRangeMinutes: calculateTimeRangeMinutes(defaultTimeRange),
                timeRangeLabel: calculateTimeRangeLabel(defaultTimeRange),
                fillMode: 'gradient',

                // 프리셋 시간 범위 설정
                setTimeRangePreset: (minutes: number) => {
                    const newTimeRange: TimeRange = {
                        preset: minutes,
                        customStart: null,
                        customEnd: null,
                        mode: 'preset',
                    };
                    set({
                        timeRange: newTimeRange,
                        timeRangeMinutes: calculateTimeRangeMinutes(newTimeRange),
                        timeRangeLabel: calculateTimeRangeLabel(newTimeRange),
                    });
                },

                // 커스텀 시간 범위 설정
                setTimeRangeCustom: (start: Date, end: Date) => {
                    const newTimeRange: TimeRange = {
                        preset: null,
                        customStart: start,
                        customEnd: end,
                        mode: 'custom',
                    };
                    set({
                        timeRange: newTimeRange,
                        timeRangeMinutes: calculateTimeRangeMinutes(newTimeRange),
                        timeRangeLabel: calculateTimeRangeLabel(newTimeRange),
                    });
                },

                // 차트 스타일 설정
                setFillMode: (mode: FillMode) => {
                    set({ fillMode: mode });
                },
            };
        },
        {
            name: 'vectorsurfer-dashboard',
            // Date 객체 직렬화 처리
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const parsed = JSON.parse(str);
                    // Date 문자열을 Date 객체로 변환
                    if (parsed.state?.timeRange?.customStart) {
                        parsed.state.timeRange.customStart = new Date(parsed.state.timeRange.customStart);
                    }
                    if (parsed.state?.timeRange?.customEnd) {
                        parsed.state.timeRange.customEnd = new Date(parsed.state.timeRange.customEnd);
                    }
                    // 계산된 값들 재계산
                    if (parsed.state?.timeRange) {
                        parsed.state.timeRangeMinutes = calculateTimeRangeMinutes(parsed.state.timeRange);
                        parsed.state.timeRangeLabel = calculateTimeRangeLabel(parsed.state.timeRange);
                    }
                    return parsed;
                },
                setItem: (name, value) => {
                    localStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    localStorage.removeItem(name);
                },
            },
        }
    )
);

export default useDashboardStore;
