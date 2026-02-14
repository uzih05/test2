'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DistributionItem } from '@/lib/types/api';
import { formatNumber, formatPercentage } from '@/lib/utils';

interface FunctionDistributionProps {
    data: DistributionItem[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export function FunctionDistribution({ data }: FunctionDistributionProps) {
    if (data.length === 0) {
        return (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                No data available
            </div>
        );
    }

    // const total = ... (사용하지 않으므로 제거)

    return (
        <div className="flex h-[250px] items-center">
            <div className="h-full w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data as any}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="count"
                            nameKey="name"
                            paddingAngle={2}
                        >
                            {data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1e',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '12px',
                            }}
                            formatter={(value) => [formatNumber(typeof value === 'number' ? value : 0), 'Count']}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-1/2 space-y-2">
                {data.slice(0, 5).map((item, index) => (
                    // 수정 1: key를 index 기반으로 변경하여 이름 중복/누락 시 경고 방지
                    <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 overflow-hidden"> {/* overflow-hidden 추가 */}
                            <div
                                className="h-3 w-3 shrink-0 rounded-full" // shrink-0 추가 (찌그러짐 방지)
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {/* 수정 3: JS slice 제거하고 CSS truncate만 사용 (반응형 대응) */}
                            <span
                                className="truncate text-muted-foreground"
                                title={item.name || 'Unknown'} // 마우스 올렸을 때 전체 이름 표시
                            >
                {item.name || 'Unknown'}
              </span>
                        </div>
                        <span className="shrink-0 font-medium ml-2"> {/* 숫자가 밀리지 않도록 shrink-0 */}
                            {formatPercentage(item.percentage)}
            </span>
                    </div>
                ))}
                {data.length > 5 && (
                    <div className="text-xs text-muted-foreground pt-1">
                        +{data.length - 5} more
                    </div>
                )}
            </div>
        </div>
    );
}