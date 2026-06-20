import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import { getStats } from '../api';

interface Stats {
  articleTotal: number;
  articlePublished: number;
  readerTotal: number;
  viewTotal: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ articleTotal: 0, articlePublished: 0, readerTotal: 0, viewTotal: 0 });

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card>
          <Statistic title="文章总数" value={stats.articleTotal} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="已发布" value={stats.articlePublished} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="读者数" value={stats.readerTotal} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="总浏览数" value={stats.viewTotal} />
        </Card>
      </Col>
    </Row>
  );
}
