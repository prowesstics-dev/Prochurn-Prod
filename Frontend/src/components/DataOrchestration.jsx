import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Button, List, Checkbox, message, Spin, Card, Form } from 'antd';
import styles from './DataOrchestration.module.css';
import axios from 'axios';
//
const DataOrchestration = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [connectionString, setConnectionString] = useState('');
  const [containerName, setContainerName] = useState('');
  const [fileList, setFileList] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiForm] = Form.useForm();
  const [apiKeyReadonly, setApiKeyReadonly] = useState(true);
  const [mask, setMask] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFetchFiles = async () => {
    if (!connectionString || !containerName) {
      message.error('Please fill both fields');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/azure-files`, {
        connection_string: connectionString,
        container_name: containerName,
      });
      setFileList(res.data.files || []);
      setSelectedFiles([]);
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileCheck = (file) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const handleLoad = async () => {
    if (selectedFiles.length === 0) {
      message.warning('Please select at least one file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await axios.post(`${API_URL}/triggerazureimport`, {
        connection_string: connectionString,
        container_name: containerName,
        selected_files: selectedFiles,
        schema_name: 'stage',          // Default schema
        sensitive_columns: []          // Add if you have sensitive columns to encrypt
      });

      const dagRunId = response.data.dag_run_id;
      message.success('Import started successfully!');
      pollDagStatus(dagRunId);
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to start import');
      setUploading(false);
    }
  };

  const pollDagStatus = async (dagRunId) => {
    try {
      const response = await axios.get(`${API_URL}/checkdagstatus`, {
        params: { dag_run_id: dagRunId }
      });

      const status = response.data.state;

      if (status === 'success') {
        message.success('Files imported successfully!');
        setUploading(false);
        setIsModalOpen(false);
      } else if (status === 'failed') {
        message.error('File import failed');
        setUploading(false);
      } else {
        const progress = response.data.progress || uploadProgress + 10;
        setUploadProgress(Math.min(progress, 90)); // Cap at 90% while processing
        setTimeout(() => pollDagStatus(dagRunId), 3000);
      }
    } catch (error) {
      message.error('Error checking import status');
      setUploading(false);
    }
  };

  const handleApiConnect = async (values) => {
    console.log('API Integration values:', values);
    
    // Show info message
    message.info({
      content: 'We are currently working on API integration functionality. Stay tuned for updates!',
      duration: 4,
      style: {
        marginTop: '20vh',
      },
    });

    // Close modal and reset form
    setIsApiModalOpen(false);
    apiForm.resetFields();
  };

  const handleApiModalCancel = () => {
    setIsApiModalOpen(false);
    apiForm.resetFields();
  };

  const CardItem = ({ img, title, description, onClick }) => (
    <Card className={styles.customCard} hoverable onClick={onClick}>
      <div className={styles.cardInner}>
        <img src={img} alt={title} className={styles.cardImage} />
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDescription}>{description}</p>
      </div>
    </Card>
  );

  return (
    <div className={styles.dContainer}>
      <h2
        style={{
          // marginTop: -10,
          fontSize: '2.8rem',
          fontFamily : "var(--app-font-family)",
          padding :'40px 0 0 0',
          fontWeight: 750,
          textAlign: 'center',
          background: 'linear-gradient(to right, #0f172a, #0284c7, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 0.5rem 0'
        }}
      >
        Data Ingestion Interface
      </h2>

      <div className={styles.cardGrid}>
        <CardItem
          img="Icons/AzureBlob.png"
          title="Azure Blob Storage"
          description="Connect and load files from Azure Blob Storage"
          onClick={() => setIsModalOpen(true)}
        />

        <CardItem
          img="Icons/EXCEL.png"
          title="Excel Upload"
          description="Upload and process Excel files manually"
          onClick={() => navigate('/uploadpage')}
        />
        
        <CardItem
          img="Icons/api.png"
          title="API Integration"
          description="Connect and load files using API"
          onClick={() => setIsApiModalOpen(true)}
        />
      </div>

      {/* Azure Blob Storage Modal */}
      <Modal
  title="Connect to Azure Blob Storage"
  open={isModalOpen}
  onCancel={() => {
    setIsModalOpen(false);
    setConnectionString('');
    setContainerName('');
    setFileList([]);
    setSelectedFiles([]);
  }}
  footer={null}
  width={600}
>
  <Form
    layout="vertical"
    onFinish={handleFetchFiles}
    autoComplete="off"
  >
    <Form.Item
      label="Azure Connection String"
      name="connectionString"
      rules={[{ required: true, message: 'Please enter the connection string' }]}
    >
      <Input.TextArea
        rows={3}
        placeholder="Azure Connection String"
        value={connectionString}
        onChange={(e) => setConnectionString(e.target.value)}
      />
    </Form.Item>

    <Form.Item
      label="Container Name"
      name="containerName"
      rules={[{ required: true, message: 'Please enter the container name' }]}
    >
      <Input
        placeholder="Container Name"
        value={containerName}
        onChange={(e) => setContainerName(e.target.value)}
      />
    </Form.Item>

    <Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        loading={loading}
        style={{ width: '100%' }}
      >
        Fetch Files
      </Button>
    </Form.Item>
  </Form>

  {loading ? (
    <Spin style={{ marginTop: 20 }} />
  ) : (
    fileList.length > 0 && (
      <div style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 10 }}>
          {selectedFiles.length} file(s) selected
        </div>
        <List
          style={{ maxHeight: 300, overflowY: 'auto' }}
          bordered
          dataSource={fileList}
          renderItem={(item) => (
            <List.Item>
              <Checkbox
                checked={selectedFiles.includes(item)}
                onChange={() => handleFileCheck(item)}
              >
                {item}
              </Checkbox>
            </List.Item>
          )}
        />
      </div>
    )
  )}

  {fileList.length > 0 && (
    <div style={{ marginTop: 20 }}>
      <Button
        type="primary"
        onClick={handleLoad}
        style={{ width: '100%' }}
        disabled={selectedFiles.length === 0 || uploading}
        loading={uploading}
      >
        {uploading ? `Loading (${uploadProgress}%)` : 'Load Selected Files'}
      </Button>
      {uploading && (
        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <Spin />
          <p>Processing files... This may take a few minutes</p>
        </div>
      )}
    </div>
  )}
</Modal>

      {/* API Integration Modal */}
      <Modal
        title="API Integration Setup"
        open={isApiModalOpen}
        onCancel={handleApiModalCancel}
        footer={null}
        width={500}
      >
        <Form
  form={apiForm}
  layout="vertical"
  onFinish={handleApiConnect}
  autoComplete="off"
  style={{ marginTop: 20 }}
>
  {/* Off-screen decoys BEFORE the real fields */}
  <div style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
    <input type="text" name="username" autoComplete="username" />
    <input type="password" name="password" autoComplete="new-password" />
  </div>

  <Form.Item
    label="API Base URL"
    name="apiBaseUrl"
    rules={[
      { required: true, message: 'Please enter the API base URL' },
      { type: 'url', message: 'Please enter a valid URL' }
    ]}
  >
    <Input
      placeholder="https://api.example.com"
      autoComplete="off"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      inputMode="url"
      // data-lpignore="true" data-1p-ignore
    />
  </Form.Item>

  <Form.Item
    label="API Integration Key"
    name="apiIntegrationKey"  // avoid 'password' naming heuristics
    rules={[{ required: true, message: 'Please enter the API integration key' }]}
  >
    <Input
  placeholder="Enter your API key"
  type="text"
  autoComplete="off"
  name="apiIntegrationKey"
  id="apiIntegrationKey"
  style={mask ? { WebkitTextSecurity: 'disc' } : undefined} // Blink/WebKit
  onDoubleClick={() => setMask((m) => !m)} // simple toggle
/>
  </Form.Item>

  <Form.Item
    label="Webhook URL"
    name="webhookUrl"
    rules={[
      { required: true, message: 'Please enter the webhook URL' },
      { type: 'url', message: 'Please enter a valid URL' }
    ]}
  >
    <Input
      placeholder="https://your-domain.com/webhook"
      autoComplete="off"
      spellCheck={false}
      autoCapitalize="off"
      autoCorrect="off"
      inputMode="url"
      // data-lpignore="true" data-1p-ignore
    />
  </Form.Item>

  <Form.Item style={{ marginTop: 30, marginBottom: 0 }}>
    <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large">
      Connect
    </Button>
  </Form.Item>
</Form>

      </Modal>

      <div style={{ height: '100px', backgroundColor: '#FFFF' }} />
    </div>
  );
};

export default DataOrchestration;