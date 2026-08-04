"use client";
// 多页横向对比：这十张页里哪张在跑、哪张在空转。
//
// 分析页原来只能「单页」或「全部」二选一，回答不了这个问题——而同时管多个客户
// 或多条产品线时，这是每天要看的第一眼。点某行即把整页筛到那张页，接着往下钻。

import useSWR from "swr";
import { Card, Table, Typography, Tag } from "antd";
import { ApiRoutes } from "@/lib/constants";

export interface PagePerformanceRow {
  pageId: string;
  name: string;
  views: number;
  clicks: number;
  leads: number;
  cvr: number;
}

export function PageComparison({
  days,
  selectedPageId,
  onSelect,
}: {
  days: number;
  selectedPageId: string;
  onSelect: (pageId: string) => void;
}) {
  const { data, isLoading } = useSWR<PagePerformanceRow[]>(`${ApiRoutes.AnalyticsPages}?days=${days}`);
  const rows = data ?? [];
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <Card
      title="落地页对比"
      extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>点任一行可把下方全部图表筛到该页</Typography.Text>}
    >
      <Table<PagePerformanceRow>
        rowKey="pageId"
        size="small"
        loading={isLoading}
        dataSource={rows}
        pagination={rows.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
        locale={{ emptyText: "还没有落地页" }}
        onRow={(r) => ({
          onClick: () => onSelect(selectedPageId === r.pageId ? "all" : r.pageId),
          style: { cursor: "pointer" },
        })}
        rowClassName={(r) => (r.pageId === selectedPageId ? "ant-table-row-selected" : "")}
        columns={[
          {
            title: "落地页", dataIndex: "name", ellipsis: true,
            render: (name: string, r) => (
              <span>
                {name}
                {/* 有曝光却一条线索都没有，是最该被看见的一类：钱在花，回报为零 */}
                {r.views > 0 && r.leads === 0 && <Tag color="orange" style={{ marginLeft: 8 }}>无线索</Tag>}
                {r.views === 0 && <Tag style={{ marginLeft: 8 }}>无流量</Tag>}
              </span>
            ),
          },
          { title: "曝光", dataIndex: "views", width: 100, sorter: (a, b) => a.views - b.views },
          { title: "CTA 点击", dataIndex: "clicks", width: 110, sorter: (a, b) => a.clicks - b.clicks },
          { title: "线索", dataIndex: "leads", width: 90, sorter: (a, b) => a.leads - b.leads },
          {
            title: "线索转化率", dataIndex: "cvr", width: 120,
            sorter: (a, b) => a.cvr - b.cvr,
            render: (v: number) => pct(v),
          },
        ]}
      />
    </Card>
  );
}
