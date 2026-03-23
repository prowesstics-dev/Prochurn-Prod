import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Input, 
  Typography, 
  Tag, 
  Space,
  Card
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

const PredictiveScores = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const allData = [
    {
      id: 1,
      displayName: 'Churned policies in next 7 days',
      updated: '07/01/24 11:11 PM',
      type: 'Table and Line',
      lastRefreshed: '06/07/25 6:48 AM',
      refreshStatus: 'On Schedule',
      route: '/next7days'
    },
    {
      id: 2,
      displayName: 'Churned policies in next 30 days',
      updated: '08/20/22 12:41 AM',
      type: 'Table and Bar',
      lastRefreshed: '06/07/25 6:37 AM',
      refreshStatus: 'On Schedule',
      route: '/next30days'
    }
  ];

  const filteredData = allData.filter(item =>
    item.displayName.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Report Name',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <a onClick={() => navigate(record.route)}>{text}</a>
      ),
      sorter: (a, b) => a.displayName.localeCompare(b.displayName),
    },
    {
      title: 'Updated',
      dataIndex: 'updated',
      key: 'updated',
      sorter: (a, b) => new Date(a.updated) - new Date(b.updated),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: 'Last Refreshed',
      dataIndex: 'lastRefreshed',
      key: 'lastRefreshed',
      sorter: (a, b) => new Date(a.lastRefreshed) - new Date(b.lastRefreshed),
    },
    {
      title: 'Refresh Status',
      dataIndex: 'refreshStatus',
      key: 'refreshStatus',
      render: (status) => (
        <Tag color={status === 'On Schedule' ? 'green' : 'orange'}>
          {status}
        </Tag>
      ),
      sorter: (a, b) => a.refreshStatus.localeCompare(b.refreshStatus),
    },
  ];

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div style={{ 
      padding: '30px 0 0 0',
      minHeight: '100vh'
    }}>
      <Card 
        style={{ 
          borderRadius: '12px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          marginTop: '8px'
        }}
      >
        <div style={{ 
          display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  rowGap: '1rem',
  marginBottom: '16px',
  padding: '12px 0',
  borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={2} style={{ 
            fontSize: '1.8rem',
            fontWeight: 700,
            textAlign: 'center',
            background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 0 0.5rem 0'
          }}>
            At-Risk Policy Alerts
          </Title>
        </div>

        <div style={{ margin: '0 0 12px 0' }}>
          <Search
            placeholder="Search reports..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={handleSearchChange}
            onSearch={setSearchText} // Still allow search on Enter if needed
            style={{ maxWidth: '400px' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => (
              <Space>
                Showing {range[0]}-{range[1]} of {total} reports
                <span style={{ marginLeft: '8px' }}>
                  Rows per page: {pageSize}
                </span>
              </Space>
            ),
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          scroll={{ x: '100%' }}
          bordered
          size="middle"
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'even-row' : 'odd-row'
          }
          onRow={(record) => ({
            onClick: () => navigate(record.route),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>

      <style>{`
  .even-row {
    background-color: #fafafa;
  }
  .odd-row {
    background-color: #ffffff;
  }
  .even-row:hover, .odd-row:hover {
    background-color: #e6f7ff !important;
  }
  .ant-table-thead > tr > th {
    background: linear-gradient(45deg, #667eea, #3498db);
    color: white;
    font-weight: 600;
    text-align: center;
  }
  .ant-table-tbody > tr > td {
    text-align: center;
  }
  .ant-pagination-item-active {
    background: linear-gradient(45deg, #667eea, #3498db);
    border-color: #667eea;
  }
  .ant-pagination-item-active a {
    color: white;
  }

  /* 🔽 ADD THIS RESPONSIVE STYLE BELOW */
  @media (max-width: 768px) {
    .ant-table {
      font-size: 0.85rem;
    }
    .ant-typography h2 {
      font-size: 1.3rem !important;
      text-align: center !important;
    }
    .ant-input-search {
      width: 100% !important;
    }
  }
`}</style>

    </div>
  );
};

export default PredictiveScores;