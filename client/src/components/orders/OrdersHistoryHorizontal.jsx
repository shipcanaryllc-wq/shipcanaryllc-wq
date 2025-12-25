/**
 * Orders History Horizontal Page
 * 
 * Displays orders in a horizontal row layout with multi-select and PDF merge functionality.
 * 
 * Features:
 * - Search by order ID, to name, from name, tracking
 * - Multi-select orders with checkboxes
 * - Download individual labels
 * - Merge selected labels into a single PDF
 * - Filter by date range, label type, per-page
 * 
 * PDF Merge:
 * - Uses pdf-lib to merge multiple PDFs client-side
 * - Fetches PDFs from /api/orders/:id/label endpoint
 * - Caches PDFs per orderId to avoid re-requests
 * - Handles missing PDFs gracefully with toast notifications
 * 
 * Dependencies:
 * - pdf-lib: npm package for PDF manipulation
 * - useOrderSelection hook: manages selection state
 * - OrderRowHorizontal component: renders individual order rows
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useOrderSelection } from '../../hooks/useOrderSelection';
import { mergePdfsFromUrls, downloadPdf } from '../../utils/pdfMerge';
import OrderRowHorizontal from './OrderRowHorizontal';
import './OrdersHistoryHorizontal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const OrdersHistoryHorizontal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [perPage, setPerPage] = useState(100);
  const [labelFilter, setLabelFilter] = useState('');
  const [downloadingMerged, setDownloadingMerged] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // PDF cache to avoid re-requesting the same PDF
  const pdfCacheRef = useRef(new Map());
  
  const {
    selectedOrderIds,
    selectedCount,
    isSelected,
    toggleOne,
    toggleAllVisible,
    clear,
    allSelected,
  } = useOrderSelection(orders);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, perPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/orders`, {
        params: {
          page: 1,
          per_page: perPage,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Handle API response format
      let ordersData = [];
      if (response.data.orders && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (Array.isArray(response.data)) {
        ordersData = response.data;
      }

      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderId = (order._id || order.id || '').toString().toLowerCase();
        const toName = (order.toAddress?.name || order.toAddressData?.name || '').toLowerCase();
        const fromName = (order.fromAddress?.name || order.fromAddressData?.name || '').toLowerCase();
        const tracking = (order.trackingNumber || order.tracking_id || '').toLowerCase();
        
        return (
          orderId.includes(query) ||
          toName.includes(query) ||
          fromName.includes(query) ||
          tracking.includes(query)
        );
      });
    }

    // Date filter
    if (fromDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        const from = new Date(fromDate);
        return orderDate >= from;
      });
    }

    if (toDate) {
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // End of day
        return orderDate <= to;
      });
    }

    // Label type filter
    if (labelFilter) {
      filtered = filtered.filter((order) => {
        const service = order.uspsService || '';
        return service.toLowerCase().includes(labelFilter.toLowerCase());
      });
    }

    return filtered;
  }, [orders, searchQuery, fromDate, toDate, labelFilter]);

  // Get unique label types for filter dropdown
  const labelTypes = useMemo(() => {
    const types = new Set();
    orders.forEach((order) => {
      if (order.uspsService) {
        types.add(order.uspsService);
      }
    });
    return Array.from(types).sort();
  }, [orders]);

  const handleDownloadLabel = async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}/label`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `label-${orderId}.pdf`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error downloading label:', error);
      throw error;
    }
  };

  const handleDownloadMerged = async () => {
    if (selectedCount === 0 || downloadingMerged) return;

    setDownloadingMerged(true);
    setToastMessage(null);

    try {
      const selectedOrders = filteredOrders.filter((order) => {
        const orderId = order._id || order.id;
        return selectedOrderIds.includes(orderId);
      });

      // Build PDF URLs - use proxy endpoint
      const pdfUrls = [];

      for (const order of selectedOrders) {
        const orderId = order._id || order.id;
        
        // Check cache first
        if (pdfCacheRef.current.has(orderId)) {
          const cachedUrl = pdfCacheRef.current.get(orderId);
          pdfUrls.push(cachedUrl);
          continue;
        }

        // Build proxy URL
        const proxyUrl = `${API_URL}/orders/${orderId}/label`;
        pdfUrls.push(proxyUrl);
        pdfCacheRef.current.set(orderId, proxyUrl);
      }

      // Merge PDFs with auth token
      const authToken = localStorage.getItem('token');
      const { pdf: mergedPdf, missingCount } = await mergePdfsFromUrls(pdfUrls, { authToken });

      // Generate filename with date
      const today = new Date().toISOString().split('T')[0];
      const filename = `labels-${today}.pdf`;

      // Download merged PDF
      downloadPdf(mergedPdf, filename);

      // Show success message
      if (missingCount > 0) {
        setToastMessage(`${missingCount} label(s) missing PDFs, skipped.`);
      } else {
        setToastMessage(`Successfully downloaded ${selectedCount} label(s).`);
      }

      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      setToastMessage('Failed to merge PDFs. Please try again.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setDownloadingMerged(false);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!user) {
    return (
      <div className="orders-history-horizontal">
        <div className="login-prompt">
          <h3>🔒 Sign Up Required</h3>
          <p>Create an account to view your order history.</p>
          <button onClick={() => navigate('/register')} className="signup-prompt-button">
            Sign Up Free
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-history-horizontal">
        <div className="loading-state">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-history-horizontal">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="orders-header">
        <h1>Orders History</h1>
        <div className="breadcrumb">Home / Orders History</div>
      </div>

      {/* Top Bar - Search and Filters */}
      <div className="orders-top-bar">
        <div className="search-section">
          <label>SEARCH</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by ID, To Name, From Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="search-btn" title="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
            <button className="filter-btn" title="All">All</button>
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label>FROM DATE</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="filter-group">
            <label>TO DATE</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="filter-group">
            <label>PER PAGE</label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="select-input"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          <div className="filter-group">
            <label>LABEL</label>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="select-input"
            >
              <option value="">Select Label</option>
              {labelTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="actions-section">
          <button
            className="btn-merge-pdf"
            onClick={handleDownloadMerged}
            disabled={selectedCount === 0 || downloadingMerged}
            title={selectedCount === 0 ? 'Select orders to merge' : `Download ${selectedCount} selected label(s)`}
          >
            {downloadingMerged ? 'Merging...' : `Download Selected (${selectedCount})`}
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-list-container">
        <div className="orders-list-header">
          <div className="select-all-checkbox">
            <input
              type="checkbox"
              checked={allSelected && filteredOrders.length > 0}
              onChange={toggleAllVisible}
              aria-label="Select all orders"
            />
          </div>
          <div className="orders-count">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            {selectedCount > 0 && ` (${selectedCount} selected)`}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found.</p>
          </div>
        ) : (
          <>
            {/* Column Headings */}
            <div className="orders-list-headings">
              <div className="cell-heading cell-number number-cell">#</div>
              <div className="cell-heading cell-checkbox checkbox-cell"></div>
              <div className="cell-heading cell-label label-cell">Label</div>
              <div className="cell-heading cell-from from-cell">From</div>
              <div className="cell-heading cell-to to-cell">To</div>
              <div className="cell-heading cell-tracking tracking-cell">Tracking</div>
              <div className="cell-heading cell-status status-cell">Status</div>
              <div className="cell-heading cell-actions download-cell">Download</div>
            </div>
            
            {/* Orders List */}
            <div className="orders-list">
              {filteredOrders.map((order, index) => {
                const orderId = order._id || order.id;
                const rowNumber = filteredOrders.length - index; // Newest first = highest number at top
                return (
                  <OrderRowHorizontal
                    key={orderId}
                    order={order}
                    rowNumber={rowNumber}
                    isSelected={isSelected(orderId)}
                    onToggleSelect={toggleOne}
                    onDownloadLabel={handleDownloadLabel}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersHistoryHorizontal;

/**
 * MANUAL TEST CHECKLIST
 * 
 * Before deploying, verify:
 * 
 * ✅ Selection:
 *   - [ ] Checkbox per row selects/deselects individual orders
 *   - [ ] "Select all" checkbox selects/deselects all visible orders
 *   - [ ] Selected count updates correctly
 *   - [ ] Selected rows have visual highlight (blue border/background)
 * 
 * ✅ Tracking:
 *   - [ ] Tracking number is clickable and opens USPS tracking in new tab
 *   - [ ] Copy button copies tracking number to clipboard
 *   - [ ] Copy button shows "Copied" feedback for ~1.2s
 *   - [ ] Missing tracking shows "—" and link/copy are disabled
 * 
 * ✅ Status Display:
 *   - [ ] Status badges show human-readable text ("Label created", "In transit", "Delivered", etc.)
 *   - [ ] Status colors match tone (green=delivered, blue=transit, gray=created, red=failed, orange=exception)
 *   - [ ] Secondary badge shows provider status when available
 *   - [ ] Handles missing status fields gracefully (no errors)
 * 
 * ✅ Date/Time:
 *   - [ ] Created date shows as "Dec 24, 2025" format
 *   - [ ] Created time shows as "1:26 PM" format
 *   - [ ] Missing dates show "—"
 * 
 * ✅ Download:
 *   - [ ] Individual "Download Label" button downloads single PDF
 *   - [ ] "Download Selected (n)" button merges multiple PDFs
 *   - [ ] Merged PDF filename is "labels-YYYY-MM-DD.pdf"
 *   - [ ] Missing PDFs are handled gracefully (toast notification)
 *   - [ ] PDF cache prevents re-requesting same PDF
 * 
 * ✅ Search/Filter:
 *   - [ ] Search filters by order ID, to name, from name, tracking
 *   - [ ] Date filters work correctly
 *   - [ ] Label type filter works
 *   - [ ] Per-page dropdown updates list size
 * 
 * ✅ UI Polish:
 *   - [ ] Column headings are clear and aligned
 *   - [ ] Rows are properly aligned with headings
 *   - [ ] Responsive on mobile (stacks vertically)
 *   - [ ] No console errors
 *   - [ ] No visual glitches or layout breaks
 */

