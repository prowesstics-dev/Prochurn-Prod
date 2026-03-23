import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fulldata, fulldatadownload } from "../api";
import Sidebar from "./SidebarUpload.jsx";
import { 
  Table, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Card, 
  Avatar, 
  Dropdown, 
  message,
  Spin,
  Tag,
  Tooltip,
  Modal
} from 'antd';
import { 
  SearchOutlined, 
  DownloadOutlined, 
  UserOutlined, 
  LogoutOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  UndoOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

const PredictedNewFullData = () => {
  const navigate = useNavigate();
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sortInfo, setSortInfo] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [navigate]);

  useEffect(() => {
    fulldata()
      .then((response) => {
        if (response.data && response.data.length > 0) {
          const dataWithKeys = response.data.map((item, index) => ({
            ...item,
            key: index
          }));
          setAllData(dataWithKeys);
          setFilteredData(dataWithKeys);
        } else {
          setError("No data available.");
        }
      })
      .catch((err) => {
        console.error("Error fetching full data:", err);
        setError("Failed to load data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredData(allData);
      return;
    }

    const filtered = allData.filter((record) =>
      Object.values(record).some((fieldValue) =>
        String(fieldValue).toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Logout?',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to logout?',
      okText: 'Yes',
      cancelText: 'Cancel',
      onOk() {
        localStorage.clear();
        navigate("/login");
      },
    });
  };

  const formatValue = (value, dataIndex) => {
    if (value === "missing" || value === "Null" || value === null || value === undefined) {
      return <Tag color="orange">Missing</Tag>;
    }
    
    if (dataIndex.includes("Probability") && typeof value === "string" && value.includes("%")) {
      const percentage = parseFloat(value);
      const color = percentage > 70 ? "red" : percentage > 40 ? "orange" : "green";
      return <Tag color={color}>{value}</Tag>;
    }
    
    if (dataIndex === "Predicted Status") {
      const color = value === "Not Renewed" ? "red" : "green";
      return <Tag color={color}>{value}</Tag>;
    }
    
    if (dataIndex === "Policy Status") {
      const color = value === "Open" ? "green" : value === "Closed" ? "blue" : "orange";
      return <Tag color={color}>{value}</Tag>;
    }
    
    if (typeof value === "number" && value % 1 !== 0) {
      return value.toFixed(2);
    }
    
    if (typeof value === "string" && value.length > 30) {
      return (
        <Tooltip title={value}>
          {value.substring(0, 30)}...
        </Tooltip>
      );
    }
    
    return value;
  };

  const generateColumns = () => {
    if (allData.length === 0) return [];
    
    const sampleRow = allData[0];
    return Object.keys(sampleRow)
      .filter(key => key !== 'key')
      .map((key) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        dataIndex: key,
        key: key,
        sorter: (a, b) => {
          const aVal = a[key];
          const bVal = b[key];
          
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return aVal - bVal;
          }
          
          return String(aVal).localeCompare(String(bVal));
        },
        render: (value) => formatValue(value, key),
        width: key === 'policy no' || key.includes('Reasons') ? 200 : 150,
        ellipsis: {
          showTitle: false,
        },
      }));
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setSortInfo(sorter);
  };

  const resetSort = () => {
    setSortInfo({});
  };

  const profileMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: Hello, ${username},
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
        <Sidebar />
        <div style={{ 
          flex: 1,
          marginLeft: '280px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          background: 'linear-gradient(135deg, #667eea 0%, #3498db 100%)',
          minWidth: 0
        }}>
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px', fontSize: '16px', color: '#666' }}>
              Loading predicted data...
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
        <Sidebar />
        <div style={{ 
          flex: 1,
          marginLeft: '280px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          background: 'linear-gradient(135deg, #667eea 0%, #3498db 100%)',
          minWidth: 0
        }}>
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', color: '#f5222d' }}>{error}</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <Sidebar />
      
      <div style={{ 
        flex: 1,
        marginLeft: '280px', 
        background: 'linear-gradient(135deg, #667eea 0%, #3498db 100%)',
        padding: '20px',
        minWidth: 0 
      }}>
        <Card 
          style={{ 
            borderRadius: '15px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            height: 'calc(100vh - 40px)'
          }}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px',
            padding: '20px 0',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <Title level={2} style={{ 
              margin: 0, 
              background: 'linear-gradient(45deg, #667eea, #3498db)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              Predicted Full Data Analytics
            </Title>
            
            <Space size="large">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={fulldatadownload}
                style={{
                  background: 'linear-gradient(45deg, #52c41a, #73d13d)',
                  border: 'none',
                  borderRadius: '8px',
                  height: '40px',
                  fontWeight: '500'
                }}
              >
                Download CSV
              </Button>
              
              <Dropdown 
                menu={{ items: profileMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button 
                  style={{ 
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Avatar size="small" icon={<UserOutlined />} />
                  {username}
                </Button>
              </Dropdown>
            </Space>
          </div>

          {/* Search and Controls */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            gap: '16px'
          }}>
            <Search
              placeholder="Search across all columns..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
              style={{ 
                maxWidth: '400px',
                flex: 1
              }}
            />
            
            <Space>
              <Button
                icon={<UndoOutlined />}
                onClick={resetSort}
                disabled={!sortInfo.field}
              >
                Reset Sort
              </Button>
              <Tag color="blue">
                Total Records: {filteredData.length}
              </Tag>
            </Space>
          </div>

          {/* Data Table */}
          <div style={{ height: 'calc(100% - 200px)', overflow: 'hidden' }}>
            <Table
              columns={generateColumns()}
              dataSource={filteredData}
              pagination={{
                pageSize: 12,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  ${range[0]}-${range[1]} of ${total} records,
                style: { marginTop: '16px' }
              }}
              scroll={{ x: 'max-content', y: 'calc(70vh - 200px)' }}
              onChange={handleTableChange}
              bordered
              size="middle"
              style={{
                background: '#fff',
                borderRadius: '8px'
              }}
              rowClassName={(record, index) => 
                index % 2 === 0 ? 'even-row' : 'odd-row'
              }
            />
          </div>
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
        `}</style>
      </div>
    </div>
  );
};

export default PredictedNewFullData;