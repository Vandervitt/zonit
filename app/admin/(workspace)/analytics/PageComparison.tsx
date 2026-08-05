"use client";
// 多页横向对比：这十张页里哪张在跑、哪张在空转。
//
// 分析页原来只能「单页」或「全部」二选一，回答不了这个问题——而同时管多个客户
// 或多条产品线时，这是每天要看的第一眼。点某行即把整页筛到那张页，接着往下钻。

import useSWR from "swr";
import { Card, Table, Typography, Tag } from "antd";
import { ApiRoutes } from "@/lib/constants";
import { useAdminT } from "@/lib/i18n/admin/context";

export interface PagePerformanceRow {
  pageId: string;
  name: string;
  views: number;
  clicks: number;
  leads: number;
  cvr: number;
}

export function PageComparison({
  rangeQuery,
  selectedPageId,
  onSelect,
}: {
  /** 已拼好的区间参数（days=30 或 from=..&to=..），与主报表共用同一段。 */
  rangeQuery: string;
  selectedPageId: string;
  onSelect: (pageId: string) => void;
}) {
  const t = useAdminT().analytics.pageComparison;
  const { data, isLoading } = useSWR<PagePerformanceRow[]>(`${ApiRoutes.AnalyticsPages}?${rangeQuery}`);
  const rows = data ?? [];
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <Card
      title={t.title}
      extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>{t.hint}</Typography.Text>}
    >
      <Table<PagePerformanceRow>
        rowKey="pageId"
        size="small"
        loading={isLoading}
        dataSource={rows}
        pagination={rows.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
        locale={{ emptyText: t.empty }}
        onRow={(r) => ({
          onClick: () => onSelect(selectedPageId === r.pageId ? "all" : r.pageId),
          style: { cursor: "pointer" },
        })}
        rowClassName={(r) => (r.pageId === selectedPageId ? "ant-table-row-selected" : "")}
        columns={[
          {
            title: t.columns.page, dataIndex: "name", ellipsis: true,
            render: (name: string, r) => (
              <span>
                {name}
                {/* 有曝光却一条线索都没有，是最该被看见的一类：钱在花，回报为零 */}
                {r.views > 0 && r.leads === 0 && <Tag color="orange" style={{ marginLeft: 8 }}>{t.noLeads}</Tag>}
                {r.views === 0 && <Tag style={{ marginLeft: 8 }}>{t.noTraffic}</Tag>}
              </span>
            ),
          },
          { title: t.columns.views, dataIndex: "views", width: 100, sorter: (a, b) => a.views - b.views },
          { title: t.columns.clicks, dataIndex: "clicks", width: 110, sorter: (a, b) => a.clicks - b.clicks },
          { title: t.columns.leads, dataIndex: "leads", width: 90, sorter: (a, b) => a.leads - b.leads },
          {
            title: t.columns.cvr, dataIndex: "cvr", width: 120,
            sorter: (a, b) => a.cvr - b.cvr,
            render: (v: number) => pct(v),
          },
        ]}
      />
    </Card>
  );
}
