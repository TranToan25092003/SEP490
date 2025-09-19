import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, RefreshCw, Calendar, User, Activity, Database, X, Trash } from 'lucide-react';
import { customFetch } from '../../utils/customAxios';

const ActivityLogList = () => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 10;
  const [filters, setFilters] = useState({
    userName: '',
    actionType: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);

  // Fetch tất cả logs
  const fetchAllActivityLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const timestamp = new Date().getTime();
      const response = await customFetch.get('/admin/activity-logs', {
        params: { 
          page: 1, 
          limit: 1000, 
          _t: timestamp,
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      });
      const logs = Array.isArray(response.data.data) ? response.data.data : [];
      setAllLogs(logs);
    } catch (err) {
      console.error('❌ Lỗi khi lấy lịch sử hoạt động:', err);
      setError('Không thể tải lịch sử hoạt động. Vui lòng thử lại.');
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate]);

  // Fetch chi tiết log
  const fetchLogDetails = useCallback(async (logId) => {
    try {
      setLoading(true);
      const response = await customFetch.get(`/admin/activity-logs/${logId}`);
      setSelectedLog(response.data.data || null);
    } catch (err) {
      console.error('❌ Lỗi khi lấy chi tiết lịch sử hoạt động:', err);
      setError('Không thể tải chi tiết lịch sử hoạt động. Vui lòng thử lại.');
      setSelectedLog(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa log
  const deleteLog = useCallback(async (logId) => {
    try {
      await customFetch.delete(`/admin/activity-logs/${logId}`);
      await fetchAllActivityLogs();
      setError(null);
      setShowDeleteConfirm(false);
      setLogToDelete(null);
    } catch (err) {
      console.error('❌ Lỗi khi xóa log:', err);
      setError('Không thể xóa bản ghi. Vui lòng thử lại.');
    }
  }, [fetchAllActivityLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = allLogs;
    if (filters.userName.trim()) {
      filtered = filtered.filter((log) =>
        log.userName?.toLowerCase().includes(filters.userName.toLowerCase())
      );
    }
    if (filters.actionType.trim()) {
      filtered = filtered.filter((log) =>
        log.actionType?.toLowerCase().includes(filters.actionType.toLowerCase())
      );
    }
    return filtered;
  }, [allLogs, filters.userName, filters.actionType]);

  // Pagination
  const paginatedLogs = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const logs = filteredLogs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredLogs.length / limit);
    setPages(totalPages || 1);
    return logs;
  }, [filteredLogs, page]);

  useEffect(() => {
    setActivityLogs(paginatedLogs);
  }, [paginatedLogs]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    fetchAllActivityLogs();
  }, [fetchAllActivityLogs]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pages) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN');
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType?.toUpperCase()) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'LOGIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const clearFilters = () => {
    setFilters({ userName: '', actionType: '', startDate: '', endDate: '' });
  };

  const hasActiveFilters = filters.userName || filters.actionType || filters.startDate || filters.endDate;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
          <p className="mt-4 text-gray-600 text-lg">Đang tải lịch sử hoạt động...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <Activity className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Có lỗi xảy ra</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchAllActivityLogs}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lịch Sử Hoạt Động</h1>
                <p className="text-gray-600 mt-1">Theo dõi và quản lý các hoạt động của hệ thống</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  showFilters || hasActiveFilters
                    ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {Object.values(filters).filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                onClick={fetchAllActivityLogs}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bộ lọc tìm kiếm</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Xóa bộ lọc
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Tên người dùng
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="userName"
                      placeholder="Nhập tên người dùng..."
                      value={filters.userName}
                      onChange={handleFilterChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Activity className="inline h-4 w-4 mr-1" />
                    Loại Hành Động
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="actionType"
                      placeholder="Nhập loại hành động..."
                      value={filters.actionType}
                      onChange={handleFilterChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    Tìm thấy <span className="font-semibold">{filteredLogs.length}</span> kết quả
                    {filters.userName && <span className="ml-1">cho "{filters.userName}"</span>}
                    {filters.actionType && <span className="ml-1">với loại "{filters.actionType}"</span>}
                    {filters.startDate && <span className="ml-1">từ {new Date(filters.startDate).toLocaleDateString('vi-VN')}</span>}
                    {filters.endDate && <span className="ml-1">đến {new Date(filters.endDate).toLocaleDateString('vi-VN')}</span>}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng bản ghi</p>
                <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Trang hiện tại</p>
                <p className="text-2xl font-bold text-gray-900">{page} / {pages}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Hiển thị</p>
                <p className="text-2xl font-bold text-gray-900">{activityLogs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {Array.isArray(activityLogs) && activityLogs.length === 0 ? (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Không có dữ liệu</h3>
              <p className="mt-2 text-sm text-gray-500">
                {hasActiveFilters
                  ? 'Không tìm thấy bản ghi nào với bộ lọc hiện tại.'
                  : 'Chưa có bản ghi lịch sử hoạt động nào.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành Động</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô Tả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối Tượng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời Gian</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activityLogs.map((log, index) => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 font-medium">{log.userName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getActionTypeColor(log.actionType)}`}>
                          {log.actionType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{log.entityType || 'N/A'}</div>
                          {log.entityId && (
                            <div className="text-xs text-gray-500 font-mono">{log.entityId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {formatDateTime(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => fetchLogDetails(log._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </button>
                        <button
                          onClick={() => {
                            setLogToDelete(log._id);
                            setShowDeleteConfirm(true);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {activityLogs.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 mx-auto">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    page === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Trước
                </button>
                <div className="flex items-center space-x-1">
                  {[...Array(pages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pages}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    page === pages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Sau
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for log details */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center transition-opacity duration-300">
          <div className="relative mx-auto p-6 border w-11/12 max-w-lg shadow-xl rounded-lg bg-white transform transition-all duration-300 scale-95 animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Chi Tiết Hoạt Động</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Người dùng</p>
                <p className="text-base text-gray-900">{selectedLog.userName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hành động</p>
                <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full border ${getActionTypeColor(selectedLog.actionType)}`}>
                  {selectedLog.actionType || 'N/A'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mô tả</p>
                <p className="text-base text-gray-900">{selectedLog.description || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Đối tượng</p>
                <p className="text-base text-gray-900">{selectedLog.entityType || 'N/A'}</p>
                {selectedLog.entityId && (
                  <p className="text-sm text-gray-500 font-mono">{selectedLog.entityId}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Thời gian</p>
                <p className="text-base text-gray-900">{formatDateTime(selectedLog.createdAt)}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center transition-opacity duration-300">
          <div className="relative mx-auto p-6 border w-11/12 max-w-md shadow-xl rounded-lg bg-white transform transition-all duration-300 scale-95 animate-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Xác Nhận Xóa</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-base text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa bản ghi lịch sử hoạt động này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteLog(logToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogList;