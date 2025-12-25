/**
 * Order Selection Hook
 * 
 * Manages multi-select state for orders with toggle, select all, and clear functionality.
 * 
 * @param {Array} orders - Array of order objects
 * @returns {Object} Selection state and handlers
 */

import { useState, useCallback, useMemo } from 'react';

export function useOrderSelection(orders = []) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Toggle single order selection
  const toggleOne = useCallback((orderId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  // Toggle all visible orders
  const toggleAllVisible = useCallback(() => {
    const allIds = new Set(orders.map((order) => order._id || order.id));
    setSelectedIds((prev) => {
      // If all are selected, deselect all; otherwise select all
      const allSelected = allIds.size > 0 && Array.from(allIds).every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(allIds);
    });
  }, [orders]);

  // Clear all selections
  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Check if order is selected
  const isSelected = useCallback(
    (orderId) => {
      return selectedIds.has(orderId);
    },
    [selectedIds]
  );

  // Check if all visible orders are selected
  const allSelected = useMemo(() => {
    if (orders.length === 0) return false;
    const allIds = orders.map((order) => order._id || order.id);
    return allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  }, [orders, selectedIds]);

  // Get selected order IDs
  const selectedOrderIds = useMemo(() => Array.from(selectedIds), [selectedIds]);

  // Get selected count
  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    selectedOrderIds,
    selectedCount,
    isSelected,
    toggleOne,
    toggleAllVisible,
    clear,
    allSelected,
  };
}

