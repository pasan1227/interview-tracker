// components/dashboard/dashboard-charts.tsx (continued)

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

export function DashboardCharts({ stats }: DashboardChartsProps) {
  // Colors for the charts
  const COLORS = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff8042',
    '#0088fe',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#a4de6c',
    '#d0ed57',
  ];

  // Transform funnel data for visualization
  const funnelData = [
    { name: 'New', value: stats.hiringFunnel.new },
    { name: 'In Process', value: stats.hiringFunnel.inProcess },
    { name: 'Offered', value: stats.hiringFunnel.offered },
    { name: 'Hired', value: stats.hiringFunnel.hired },
    { name: 'Rejected', value: stats.hiringFunnel.rejected },
    { name: 'Withdrawn', value: stats.hiringFunnel.withdrawn },
  ];

  // Format source data
  const sourceData = stats.candidatesBySource.map((item) => ({
    name: item.source,
    value: item.count,
  }));

  // Format position data
  const positionData = stats.interviewsByPosition.map((item) => ({
    name: item.position,
    interviews: item.count,
  }));

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      <Card className='col-span-1 md:col-span-2 lg:col-span-1'>
        <CardHeader>
          <CardTitle>Hiring Funnel</CardTitle>
          <CardDescription>Candidate distribution by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={funnelData}
                  cx='50%'
                  cy='50%'
                  labelLine={true}
                  nameKey='name'
                  dataKey='value'
                  outerRadius={80}
                  fill='#8884d8'
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius: _innerRadius,
                    outerRadius,
                    value,
                    index,
                  }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 25;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline='central'
                        className='text-xs'
                      >
                        {funnelData[index].name} ({value})
                      </text>
                    );
                  }}
                >
                  {funnelData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className='col-span-1'>
        <CardHeader>
          <CardTitle>Candidates by Source</CardTitle>
          <CardDescription>Where candidates are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx='50%'
                  cy='50%'
                  outerRadius={70}
                  fill='#8884d8'
                  dataKey='value'
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {sourceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className='col-span-1'>
        <CardHeader>
          <CardTitle>Interviews by Position</CardTitle>
          <CardDescription>Most active positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={positionData}
                layout='vertical'
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis type='number' />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={110}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey='interviews' fill='#8884d8' barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className='col-span-1 md:col-span-2 lg:col-span-3'>
        <CardHeader>
          <CardTitle>Monthly Hires</CardTitle>
          <CardDescription>
            Number of candidates hired per month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={stats.monthlyHires}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='count' name='Hires' fill='#82ca9d' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
