import React, { useState, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useAuth } from '../../context/AuthContext';
import './BulkOrders.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BulkOrders = () => {
  const { user, updateBalance, fetchUser } = useAuth();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('upload'); // upload, map, review, processing, complete
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mappedData, setMappedData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [defaultFromAddress, setDefaultFromAddress] = useState(null);
  const [defaultLabelType, setDefaultLabelType] = useState(null);
  const [labelTypes, setLabelTypes] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  // Field mappings - what we need vs what user might have
  const requiredFields = {
    toName: ['name', 'to name', 'recipient name', 'to_name', 'recipient'],
    toStreet: ['street', 'address', 'street1', 'street 1', 'to street', 'to_street', 'address line 1'],
    toCity: ['city', 'to city', 'to_city'],
    toState: ['state', 'to state', 'to_state', 'province'],
    toZip: ['zip', 'zipcode', 'zip code', 'postal code', 'postal', 'to zip', 'to_zip', 'zipcode'],
    toCountry: ['country', 'to country', 'to_country']
  };

  const optionalFields = {
    toCompany: ['company', 'to company', 'to_company'],
    toStreet2: ['street2', 'street 2', 'address line 2', 'address2', 'to street2', 'to_street2'],
    weight: ['weight', 'package weight', 'weight (lbs)', 'weight (oz)', 'lbs', 'oz', 'weight_lbs', 'weight_oz'],
    length: ['length', 'package length', 'length (in)', 'length_in', 'l'],
    width: ['width', 'package width', 'width (in)', 'width_in', 'w'],
    height: ['height', 'package height', 'height (in)', 'height_in', 'h'],
    orderId: ['order id', 'order_id', 'order number', 'order_number', 'id']
  };

  // Auto-detect column mapping
  const autoMapColumns = (headers) => {
    const mapping = {};
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    // Map required fields
    Object.keys(requiredFields).forEach(field => {
      const possibleNames = requiredFields[field];
      for (let i = 0; i < lowerHeaders.length; i++) {
        if (possibleNames.some(name => lowerHeaders[i].includes(name))) {
          mapping[field] = headers[i];
          break;
        }
      }
    });

    // Map optional fields
    Object.keys(optionalFields).forEach(field => {
      const possibleNames = optionalFields[field];
      for (let i = 0; i < lowerHeaders.length; i++) {
        if (possibleNames.some(name => lowerHeaders[i].includes(name))) {
          mapping[field] = headers[i];
          break;
        }
      }
    });

    return mapping;
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setErrors([]);

    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();

    try {
      if (fileExtension === 'csv') {
        // Parse CSV
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setErrors(results.errors.map(e => e.message));
            }
            if (results.data && results.data.length > 0) {
              const data = results.data.filter(row => Object.keys(row).some(key => row[key]));
              setRawData(data);
              setHeaders(Object.keys(data[0] || {}));
              const mapping = autoMapColumns(Object.keys(data[0] || {}));
              setColumnMapping(mapping);
              setStep('map');
            } else {
              setErrors(['No data found in CSV file']);
            }
          },
          error: (error) => {
            setErrors([error.message]);
          }
        });
      } else if (['xls', 'xlsx'].includes(fileExtension)) {
        // Parse Excel
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            
            if (data.length > 0) {
              setRawData(data);
              setHeaders(Object.keys(data[0]));
              const mapping = autoMapColumns(Object.keys(data[0]));
              setColumnMapping(mapping);
              setStep('map');
            } else {
              setErrors(['No data found in Excel file']);
            }
          } catch (error) {
            setErrors([error.message]);
          }
        };
        reader.readAsBinaryString(uploadedFile);
      } else {
        setErrors(['Unsupported file format. Please upload CSV, XLS, or XLSX files.']);
      }
    } catch (error) {
      setErrors([error.message || 'Error parsing file']);
    }
  };

  // Fetch label types and default from address
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [labelTypesRes, addressesRes] = await Promise.all([
          axios.get(`${API_URL}/orders/label-types`),
          axios.get(`${API_URL}/addresses`)
        ]);
        
        setLabelTypes(labelTypesRes.data);
        if (labelTypesRes.data.length > 0) {
          setDefaultLabelType(labelTypesRes.data[0].id);
        }
        
        // Addresses API returns array directly
        const addressesList = Array.isArray(addressesRes.data) 
          ? addressesRes.data 
          : (addressesRes.data.addresses || []);
        
        setAddresses(addressesList);
        
        if (addressesList.length > 0) {
          setDefaultFromAddress(addressesList[0]._id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    if (step === 'map') {
      fetchData();
    }
  }, [step]);

  // Process mapped data
  const processMappedData = () => {
    const processed = rawData.map((row, index) => {
      const item = {
        rowNumber: index + 2, // +2 because row 1 is header, rows start at 2
        toName: row[columnMapping.toName] || '',
        toCompany: row[columnMapping.toCompany] || '',
        toStreet: row[columnMapping.toStreet] || '',
        toStreet2: row[columnMapping.toStreet2] || '',
        toCity: row[columnMapping.toCity] || '',
        toState: row[columnMapping.toState] || '',
        toZip: row[columnMapping.toZip] || '',
        toCountry: row[columnMapping.toCountry] || 'US',
        weight: parseFloat(row[columnMapping.weight]) || 1,
        length: parseFloat(row[columnMapping.length]) || 6,
        width: parseFloat(row[columnMapping.width]) || 6,
        height: parseFloat(row[columnMapping.height]) || 6,
        orderId: row[columnMapping.orderId] || `BULK-${index + 1}`,
        errors: []
      };

      // Validate required fields
      if (!item.toName) item.errors.push('Missing recipient name');
      if (!item.toStreet) item.errors.push('Missing street address');
      if (!item.toCity) item.errors.push('Missing city');
      if (!item.toState) item.errors.push('Missing state');
      if (!item.toZip) item.errors.push('Missing zip code');

      return item;
    });

    setMappedData(processed);
    setStep('review');
  };

  // Create bulk orders
  const createBulkOrders = async () => {
    if (!defaultFromAddress || !defaultLabelType) {
      setErrors(['Please select a default from address and label type']);
      return;
    }

    setProcessing(true);
    setStep('processing');
    setErrors([]);

    const validItems = mappedData.filter(item => item.errors.length === 0);
    const invalidItems = mappedData.filter(item => item.errors.length > 0);

    const results = {
      successful: [],
      failed: [],
      skipped: invalidItems.length
    };

    // Process orders sequentially to avoid overwhelming the API
    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      try {
        // Check balance before each order
        if (user.balance < 5) { // Minimum estimated cost
          results.failed.push({
            ...item,
            error: 'Insufficient balance'
          });
          continue;
        }

        const response = await axios.post(`${API_URL}/orders`, {
          labelTypeId: defaultLabelType,
          fromAddressId: defaultFromAddress,
          toAddress: {
            name: item.toName,
            company: item.toCompany || null,
            street1: item.toStreet,
            street2: item.toStreet2 || null,
            city: item.toCity,
            state: item.toState,
            zip: item.toZip,
            country: item.toCountry
          },
          package: {
            weight: item.weight,
            length: item.length,
            width: item.width,
            height: item.height
          },
          reference1: item.orderId
        });

        results.successful.push({
          ...item,
          order: response.data.order,
          trackingNumber: response.data.order.trackingNumber
        });

        // Update balance
        if (response.data.newBalance !== undefined) {
          updateBalance(response.data.newBalance);
        }
      } catch (error) {
        results.failed.push({
          ...item,
          error: error.response?.data?.message || error.message || 'Unknown error'
        });
      }

      // Small delay to avoid rate limiting
      if (i < validItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setResults(results);
    setProcessing(false);
    setStep('complete');
    await fetchUser(); // Refresh user data
  };

  // Reset and start over
  const reset = () => {
    setFile(null);
    setFileName('');
    setRawData([]);
    setHeaders([]);
    setMappedData([]);
    setColumnMapping({});
    setResults(null);
    setErrors([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bulk-orders">
      <div className="bulk-orders-header">
        <h1>Bulk Order Upload</h1>
        <p className="subtitle">Upload a spreadsheet (CSV, XLS, or XLSX) to create multiple shipping labels at once</p>
      </div>

      {step === 'upload' && (
        <div className="upload-step">
          <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-icon">📄</div>
            <h3>Drag & drop your spreadsheet here</h3>
            <p>or click to browse</p>
            <p className="file-formats">Supports: CSV, XLS, XLSX</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          {errors.length > 0 && (
            <div className="error-box">
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'map' && (
        <div className="map-step">
          <div className="step-header">
            <h2>Map Your Columns</h2>
            <p>We've auto-detected your columns, but you can adjust them if needed.</p>
          </div>

          <div className="mapping-section">
            <h3>Required Fields</h3>
            <div className="mapping-grid">
              {Object.keys(requiredFields).map(field => (
                <div key={field} className="mapping-row">
                  <label>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                  <select
                    value={columnMapping[field] || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <h3>Optional Fields</h3>
            <div className="mapping-grid">
              {Object.keys(optionalFields).map(field => (
                <div key={field} className="mapping-row">
                  <label>{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                  <select
                    value={columnMapping[field] || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="default-settings">
            <h3>Default Settings</h3>
            <div className="settings-grid">
              <div className="setting-row">
                <label>From Address (for all orders)</label>
                <select
                  value={defaultFromAddress || ''}
                  onChange={(e) => setDefaultFromAddress(e.target.value)}
                >
                  {addresses.length === 0 ? (
                    <option value="">No saved addresses. Please create one first.</option>
                  ) : (
                    addresses.map(addr => (
                      <option key={addr._id} value={addr._id}>
                        {addr.label || addr.name} - {addr.street1}, {addr.city}, {addr.state} {addr.zip}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="setting-row">
                <label>Default Label Type</label>
                <select
                  value={defaultLabelType || ''}
                  onChange={(e) => setDefaultLabelType(e.target.value)}
                >
                  {labelTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} - ${type.price} (Max {type.maxWeight}lbs, {type.maxDimensions}" total)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="step-actions">
            <button onClick={() => setStep('upload')} className="btn-secondary">Back</button>
            <button onClick={processMappedData} className="btn-primary">
              Review Data ({rawData.length} rows)
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="review-step">
          <div className="step-header">
            <h2>Review Your Data</h2>
            <p>Review and edit your orders before creating labels. Invalid rows will be skipped.</p>
          </div>

          <div className="review-stats">
            <div className="stat">
              <span className="stat-label">Total Rows:</span>
              <span className="stat-value">{mappedData.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Valid:</span>
              <span className="stat-value valid">{mappedData.filter(i => i.errors.length === 0).length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Invalid:</span>
              <span className="stat-value invalid">{mappedData.filter(i => i.errors.length > 0).length}</span>
            </div>
          </div>

          <div className="review-table-container">
            <table className="review-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Recipient</th>
                  <th>Address</th>
                  <th>City, State ZIP</th>
                  <th>Package</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mappedData.map((item, index) => (
                  <tr key={index} className={item.errors.length > 0 ? 'invalid-row' : ''}>
                    <td>{item.rowNumber}</td>
                    <td>{item.toName}</td>
                    <td>{item.toStreet}</td>
                    <td>{item.toCity}, {item.toState} {item.toZip}</td>
                    <td>{item.weight}lbs, {item.length}x{item.width}x{item.height}"</td>
                    <td>
                      {item.errors.length > 0 ? (
                        <span className="error-badge" title={item.errors.join(', ')}>
                          {item.errors.length} error(s)
                        </span>
                      ) : (
                        <span className="valid-badge">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="step-actions">
            <button onClick={() => setStep('map')} className="btn-secondary">Back</button>
            <button
              onClick={createBulkOrders}
              className="btn-primary"
              disabled={mappedData.filter(i => i.errors.length === 0).length === 0}
            >
              Create {mappedData.filter(i => i.errors.length === 0).length} Labels
            </button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="processing-step">
          <div className="processing-spinner">⏳</div>
          <h2>Creating Labels...</h2>
          <p>Please wait while we process your orders. This may take a few minutes.</p>
        </div>
      )}

      {step === 'complete' && results && (
        <div className="complete-step">
          <div className="step-header">
            <h2>Bulk Order Complete!</h2>
          </div>

          <div className="results-summary">
            <div className="result-stat success">
              <span className="result-label">Successful</span>
              <span className="result-value">{results.successful.length}</span>
            </div>
            <div className="result-stat failed">
              <span className="result-label">Failed</span>
              <span className="result-value">{results.failed.length}</span>
            </div>
            <div className="result-stat skipped">
              <span className="result-label">Skipped</span>
              <span className="result-value">{results.skipped}</span>
            </div>
          </div>

          {results.successful.length > 0 && (
            <div className="results-section">
              <h3>Successful Orders</h3>
              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Recipient</th>
                      <th>Tracking Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.successful.map((item, index) => (
                      <tr key={index}>
                        <td>{item.orderId}</td>
                        <td>{item.toName}</td>
                        <td>{item.trackingNumber}</td>
                        <td><span className="status-badge success">Created</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.failed.length > 0 && (
            <div className="results-section">
              <h3>Failed Orders</h3>
              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Recipient</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.failed.map((item, index) => (
                      <tr key={index}>
                        <td>{item.orderId}</td>
                        <td>{item.toName}</td>
                        <td className="error-text">{item.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="step-actions">
            <button onClick={reset} className="btn-primary">Upload Another File</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOrders;

