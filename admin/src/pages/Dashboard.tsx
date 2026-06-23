import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table } from 'antd';
import { Line, Pie } from '@ant-design/charts';
import { getStats, type Stats } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const lineData = [
    ...stats.readerTrend.map((p) => ({ date: p.date, type: '新增读者', count: p.count })),
    ...stats.activeTrend.map((p) => ({ date: p.date, type: '活跃读者', count: p.count })),
    ...stats.viewTrend.map((p) => ({ date: p.date, type: '浏览量', count: p.count })),
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="读者总数" value={stats.readerTotal} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="今日新增" value={stats.readerNew.today} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="今日活跃" value={stats.active.today} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="今日浏览" value={stats.view.today} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="总浏览" value={stats.viewTotal} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已发布文章" value={stats.articlePublished} />
          </Card>
        </Col>
      </Row>

      <Card title="趋势（近 30 天）" style={{ marginBottom: 16 }}>
        <Line data={lineData} xField="date" yField="count" colorField="type" height={300} />
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="分类浏览占比">
            <Pie data={stats.categoryDist} angleField="count" colorField="name" height={300} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="标签浏览占比">
            <Pie data={stats.tagDist} angleField="count" colorField="name" height={300} />
          </Card>
        </Col>
      </Row>

      <Card title="热门文章 Top 10">
        <Table
          rowKey="id"
          dataSource={stats.topArticles}
          pagination={false}
          size="small"
          columns={[
            { title: '标题', dataIndex: 'title' },
            { title: '浏览', dataIndex: 'view_count' },
          ]}
        />
      </Card>
    </div>
  );
}
