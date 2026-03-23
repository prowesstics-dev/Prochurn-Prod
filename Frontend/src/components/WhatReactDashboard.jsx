import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Row, Col, Typography, Spin, Select } from 'antd';
import { Pie } from '@visx/shape';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';

const { Title } = Typography;
const { Option } = Select;

const WhatReactDashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ year: '', state: '', branch: '' });
  const [filterOptions, setFilterOptions] = useState({ years: [], states: [], branches: [] });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/churndashboard`, { params: filters });
      setData(res.data);
      if (res.data.filter_options) {
        setFilterOptions(res.data.filter_options);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const pieWidth = 200;
  const pieHeight = 200;
  const radius = Math.min(pieWidth, pieHeight) / 2;

  return (
    <div style={{ padding: '20px', background: '#001f3f', minHeight: '100vh', color: '#fff' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
        <Col>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            Churn Patterns and Analysis
          </Title>
        </Col>

        {/* Filters */}
        <Col>
          <Row gutter={[8, 8]}>
            <Col>
              <Select
                placeholder="Select Year"
                style={{ width: 120 }}
                onChange={(value) => handleFilterChange('year', value)}
                allowClear
              >
                {filterOptions.years && filterOptions.years.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Select State"
                style={{ width: 150 }}
                onChange={(value) => handleFilterChange('state', value)}
                allowClear
              >
                {filterOptions.states && filterOptions.states.map(state => (
                  <Option key={state} value={state}>{state}</Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Select Branch"
                style={{ width: 150 }}
                onChange={(value) => handleFilterChange('branch', value)}
                allowClear
              >
                {filterOptions.branches && filterOptions.branches.map(branch => (
                  <Option key={branch} value={branch}>{branch}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        </Col>
      </Row>

      {loading ? (
        <Spin tip="Loading data..." style={{ display: 'block', margin: '0 auto' }} />
      ) : data ? (
        <>
          {/* Metrics Cards */}
          <Row justify="center" gutter={[16, 16]} style={{ marginBottom: '20px' }}>
            {Object.entries(data.metrics).map(([key, value]) => (
              <Col key={key}>
                <Card style={{ textAlign: 'center', width: 150 }}>
                  <Title level={5}>{key.replace(/_/g, ' ')}</Title>
                  <Title level={4}>{value}</Title>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Charts Layout */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <Card title="Top Branch by Churn">
                <svg width={250} height={150}>
                  {data.top_branch_by_churn && data.top_branch_by_churn.map((d, i) => (
                    <Group key={`bar-${i}`} left={50} top={20 + i * 25}>
                      <text x={-10} y={10} fill="white">{d.branch}</text>
                      <Bar
                        x={0}
                        y={0}
                        width={d.churn_count / 1000}
                        height={20}
                        fill="#1890ff"
                      />
                      <text x={d.churn_count / 1000 + 5} y={15} fill="white">{d.churn_count}</text>
                    </Group>
                  ))}
                </svg>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card title="Product by Churned Policies">
                <svg width={pieWidth} height={pieHeight}>
                  <Group top={pieHeight / 2} left={pieWidth / 2}>
                    <Pie
                      data={data.product_by_churned_policies}
                      pieValue={d => d.policy_count}
                      outerRadius={radius}
                      innerRadius={60}
                      padAngle={0.02}
                    >
                      {pie => (
                        pie.arcs.map((arc, index) => (
                          <g key={`arc-${index}`}>
                            <path d={pie.path(arc)} fill={['#0074D9', '#7FDBFF', '#39CCCC'][index % 3]} />
                            <text
                              transform={`translate(${pie.path.centroid(arc)})`}
                              fill="white"
                              fontSize={10}
                              textAnchor="middle"
                            >
                              {arc.data.product}
                            </text>
                          </g>
                        ))
                      )}
                    </Pie>
                  </Group>
                </svg>
              </Card>
            </Col>

            <Col xs={24} md={12} lg={6}>
              <Card title="Business Type by Churned Policies">
                <svg width={pieWidth} height={pieHeight}>
                  <Group top={pieHeight / 2} left={pieWidth / 2}>
                    <Pie
                      data={data.business_type_by_churned_policies}
                      pieValue={d => d.policy_count}
                      outerRadius={radius}
                      innerRadius={60}
                      padAngle={0.02}
                    >
                      {pie => (
                        pie.arcs.map((arc, index) => (
                          <g key={`arc-${index}`}>
                            <path d={pie.path(arc)} fill={['#FF851B', '#FFDC00', '#FF4136'][index % 3]} />
                            <text
                              transform={`translate(${pie.path.centroid(arc)})`}
                              fill="white"
                              fontSize={10}
                              textAnchor="middle"
                            >
                              {arc.data.business_type}
                            </text>
                          </g>
                        ))
                      )}
                    </Pie>
                  </Group>
                </svg>
              </Card>
            </Col>

            {/* Add similar Col blocks for Tie Ups, Claim Status, Top Vehicle Age using API data */}
          </Row>
        </>
      ) : (
        <p style={{ textAlign: 'center' }}>No data available.</p>
      )}
    </div>
  );
};

export default WhatReactDashboard;
