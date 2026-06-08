'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardStats } from '@/data/dashboard';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';

interface DashboardChartsProps {
  stats: DashboardStats;
}

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--foreground)',
  padding: '8px 10px',
  boxShadow: '0 12px 24px -16px rgba(14,59,46,0.18)',
};

const axisTick = { fill: 'var(--muted-foreground)', fontSize: 11 };

export function DashboardCharts({ stats }: Readonly<DashboardChartsProps>) {
  const funnelData = [
    { name: 'New', value: stats.hiringFunnel.new },
    { name: 'In Process', value: stats.hiringFunnel.inProcess },
    { name: 'Offered', value: stats.hiringFunnel.offered },
    { name: 'Hired', value: stats.hiringFunnel.hired },
    { name: 'Rejected', value: stats.hiringFunnel.rejected },
    { name: 'Withdrawn', value: stats.hiringFunnel.withdrawn },
  ];

  const sourceData = stats.candidatesBySource.map((item) => ({
    name: item.source,
    value: item.count,
  }));

  const positionData = stats.interviewsByPosition.map((item) => ({
    name: item.position,
    interviews: item.count,
  }));

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      <ChartCard title='Hiring funnel' description='Candidate distribution by status'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={funnelData}
              cx='50%'
              cy='50%'
              nameKey='name'
              dataKey='value'
              outerRadius={84}
              innerRadius={48}
              paddingAngle={2}
              labelLine={false}
              label={({ cx, cy, midAngle, outerRadius, value, index }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 16;
                const angle = midAngle ?? 0;
                const x = cx + radius * Math.cos(-angle * RADIAN);
                const y = cy + radius * Math.sin(-angle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline='central'
                    fill='var(--muted-foreground)'
                    fontSize={11}
                  >
                    {funnelData[index].name} ({value})
                  </text>
                );
              }}
            >
              {funnelData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke='var(--card)'
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Candidates by source' description='Where candidates come from'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={sourceData}
              cx='50%'
              cy='50%'
              outerRadius={74}
              innerRadius={40}
              paddingAngle={2}
              dataKey='value'
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {sourceData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke='var(--card)'
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title='Interviews by position' description='Most active roles'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={positionData}
            layout='vertical'
            margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
            <XAxis type='number' tick={axisTick} stroke='var(--border)' />
            <YAxis
              type='category'
              dataKey='name'
              width={110}
              tick={axisTick}
              stroke='var(--border)'
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--secondary)' }} />
            <Bar dataKey='interviews' fill='var(--forest)' barSize={18} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card className='col-span-1 rounded-xl border-border bg-card shadow-none md:col-span-2 lg:col-span-3'>
        <CardHeader className='border-b border-border'>
          <CardTitle className='text-[15px] font-medium tracking-[-0.01em]'>
            Monthly hires
          </CardTitle>
          <CardDescription className='text-[13px]'>
            Candidates hired per month
          </CardDescription>
        </CardHeader>
        <CardContent className='p-5'>
          <div className='h-72'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={stats.monthlyHires}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
                <XAxis dataKey='month' tick={axisTick} stroke='var(--border)' />
                <YAxis tick={axisTick} stroke='var(--border)' />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--secondary)' }} />
                <Bar dataKey='count' name='Hires' fill='var(--forest)' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <Card className='rounded-xl border-border bg-card shadow-none'>
      <CardHeader className='border-b border-border'>
        <CardTitle className='text-[15px] font-medium tracking-[-0.01em]'>
          {title}
        </CardTitle>
        <CardDescription className='text-[13px]'>{description}</CardDescription>
      </CardHeader>
      <CardContent className='p-5'>
        <div className='h-72'>{children}</div>
      </CardContent>
    </Card>
  );
}
