import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, FileSpreadsheet, BarChart3, Download, Eye, Trash } from "lucide-react";
import { toast } from "sonner";
import { getUserFiles, getFileAnalyses, downloadAnalysis, getFilePreview } from "@/utils/api";
import { DataPreview } from "./DataPreview";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface FileHistory {
  id: string;
  fileName: string;
  uploadDate: string;
  rows: number;
  columns: number;
  status: string;
  analyses: AnalysisHistory[];
}

interface AnalysisHistory {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  status: string;
  summary?: string;
  hasInsights?: boolean;
}

interface UploadHistoryProps {
  userRole?: string;
}

export const UploadHistory = ({ userRole }: UploadHistoryProps = {}) => {
  const [files, setFiles] = useState<FileHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | string[] | null>(null);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<number>(0);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token') || undefined;
        const fileRes = await getUserFiles(token);
        const filesData = fileRes.data.files;
        // Throttled sequential fetch for analyses
        const filesWithAnalyses: FileHistory[] = [];
        for (let i = 0; i < filesData.length; i++) {
          const file = filesData[i];
          let analyses: AnalysisHistory[] = [];
          try {
            const analysisRes = await getFileAnalyses(file._id, token);
            analyses = analysisRes.data.history;
          } catch (e) {
            // If no analyses, leave empty
          }
          filesWithAnalyses.push({
            id: file._id,
            fileName: file.originalName,
            uploadDate: new Date(file.createdAt).toLocaleDateString(),
            rows: file.rowCount || 0,
            columns: file.columnCount || 0,
            status: file.processingStatus,
            analyses,
          });
          // Throttle requests
          if (i < filesData.length - 1) await new Promise(res => setTimeout(res, 150));
        }
        setFiles(filesWithAnalyses);
      } catch (e: any) {
        setError(e.message || 'Failed to load upload history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleViewDetails = async (fileId: string, fileName: string) => {
    setPreviewFileId(fileId);
    setPreviewFileName(fileName);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const token = localStorage.getItem('token') || undefined;
      const res = await getFilePreview(fileId, token);
      // Convert rows/headers to array of objects for DataPreview
      const { headers, rows } = res.data;
      const data = rows.map((row: any[]) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
      setPreviewData(data);
    } catch (e: any) {
      setPreviewError(e.message || 'Failed to load file preview');
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadCharts = async (analysisId: string) => {
    try {
      const token = localStorage.getItem('token') || undefined;
      const blob = await downloadAnalysis(analysisId, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (e: any) {
      toast.error(e.message || 'Failed to download charts');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Aggregate stats
  const totalUploads = files.length;
  const totalCharts = files.reduce((sum, f) => sum + (f.analyses?.length || 0), 0);
  const totalRows = files.reduce((sum, f) => sum + (f.rows || 0), 0);
  const successRate = totalUploads > 0 ? Math.round((files.filter(f => f.status === 'completed').length / totalUploads) * 100) : 0;

  // Modal close handler for user-friendliness
  const handleClosePreview = useCallback(() => {
    setPreviewFileId(null);
    setPreviewData(null);
    setPreviewFileName("");
    setPreviewError(null);
  }, []);

  // Close modal on Escape key or click outside
  useEffect(() => {
    if (!previewFileId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClosePreview();
    };
    const handleClick = (e: MouseEvent) => {
      const modal = document.getElementById("preview-modal");
      if (modal && e.target instanceof Node && !modal.contains(e.target)) {
        handleClosePreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [previewFileId, handleClosePreview]);

  // Single delete handler (opens dialog)
  const handleDeleteFile = (fileId: string) => {
    setConfirmTarget(fileId);
    setShowConfirm(true);
  };

  // Bulk delete handler (opens dialog)
  const handleBulkDelete = () => {
    setConfirmTarget([...selectedFiles]);
    setShowConfirm(true);
  };

  // Confirm delete (single or bulk)
  const confirmDelete = async () => {
    const token = localStorage.getItem('token') || undefined;
    let ids: string[] = [];
    if (typeof confirmTarget === 'string') ids = [confirmTarget];
    else if (Array.isArray(confirmTarget)) ids = confirmTarget;
    setBulkDeleting(true);
    setBulkDeleteProgress(0);
    try {
      for (let i = 0; i < ids.length; i++) {
        const fileId = ids[i];
        await fetch(`/api/file/${fileId}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setBulkDeleteProgress(Math.round(((i + 1) / ids.length) * 100));
        if (i < ids.length - 1) await new Promise(res => setTimeout(res, 200));
      }
      setFiles(files => files.filter(f => !ids.includes(f.id)));
      setSelectedFiles(sel => sel.filter(id => !ids.includes(id)));
      toast.success(ids.length > 1 ? 'Files deleted successfully' : 'File deleted successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete file(s)');
    } finally {
      setShowConfirm(false);
      setConfirmTarget(null);
      setBulkDeleting(false);
      setBulkDeleteProgress(0);
    }
  };

  // Checkbox handler
  const toggleFileSelect = (fileId: string) => {
    setSelectedFiles(sel => sel.includes(fileId) ? sel.filter(id => id !== fileId) : [...sel, fileId]);
  };

  const allSelected = files.length > 0 && selectedFiles.length === files.length;
  const toggleSelectAll = () => {
    setSelectedFiles(allSelected ? [] : files.map(f => f.id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-2" />
        <div className="w-full max-w-2xl mt-8">
          <Progress value={60} className="h-2" />
        </div>
        <div className="mt-4 text-gray-500">Loading upload history and analyses...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Upload History
          </CardTitle>
          <CardDescription>
            View and manage your previous file uploads and generated charts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No uploads yet</p>
              <p className="text-sm text-gray-500">
                Your uploaded files and generated charts will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <FileSpreadsheet className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">{totalUploads}</p>
                    <p className="text-sm text-blue-600">Total Uploads</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-800">{totalCharts}</p>
                    <p className="text-sm text-purple-600">Charts Created</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="h-8 w-8 text-green-600 mx-auto mb-2 flex items-center justify-center text-lg font-bold">
                      Σ
                    </div>
                    <p className="text-2xl font-bold text-green-800">{totalRows.toLocaleString()}</p>
                    <p className="text-sm text-green-600">Total Rows</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="h-8 w-8 text-orange-600 mx-auto mb-2 flex items-center justify-center text-lg font-bold">
                      %
                    </div>
                    <p className="text-2xl font-bold text-orange-800">{successRate}%</p>
                    <p className="text-sm text-orange-600">Success Rate</p>
                  </CardContent>
                </Card>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      {userRole === 'admin' && <TableHead className="w-8"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></TableHead>}
                      <TableHead>File</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Rows/Cols</TableHead>
                      <TableHead>Analyses</TableHead>
                      <TableHead>Status</TableHead>
                      {userRole === 'admin' && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id} className="hover:bg-gray-50">
                        {userRole === 'admin' && (
                          <TableCell className="w-8">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => toggleFileSelect(file.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            {file.fileName}
                          </div>
                        </TableCell>
                        <TableCell>{file.uploadDate}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{file.rows.toLocaleString()} rows</div>
                            <div className="text-gray-500">{file.columns} columns</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <BarChart3 className="h-3 w-3" />
                            {file.analyses.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(file.status)}>
                            {file.status}
                          </Badge>
                        </TableCell>
                        {userRole === 'admin' && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Trash className="h-5 w-5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(file.id, file.fileName)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {file.analyses.map((analysis) => (
                              <Button
                                key={analysis.id}
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadCharts(analysis.id)}
                                disabled={analysis.status !== 'completed'}
                                title={`Download charts for analysis: ${analysis.name}`}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Bulk Delete Button for Admins */}
              {userRole === 'admin' && selectedFiles.length > 0 && (
                <div className="flex justify-end my-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash className="h-4 w-4" /> Delete Selected
                  </Button>
                </div>
              )}
              {/* Confirmation Dialog */}
              <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogDescription>
                      {Array.isArray(confirmTarget) && confirmTarget.length > 1
                        ? `Are you sure you want to delete these ${confirmTarget.length} files? This action cannot be undone.`
                        : 'Are you sure you want to delete this file? This action cannot be undone.'}
                    </DialogDescription>
                  </DialogHeader>
                  {bulkDeleting && (
                    <div className="w-full my-4">
                      <Progress value={bulkDeleteProgress} className="h-2" />
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        Deleting files... {bulkDeleteProgress}%
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={bulkDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDelete} disabled={bulkDeleting}>Delete</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
          {/* Preview Modal */}
          {previewFileId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-all">
              <div
                id="preview-modal"
                className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-0 relative animate-fadeIn"
                style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-2xl bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-gray-900 truncate max-w-xs sm:max-w-md" title={previewFileName}>
                      {previewFileName}
                    </span>
                    <span className="text-xs text-gray-500">File Preview</span>
                  </div>
                  <button
                    className="text-gray-400 hover:text-red-600 text-2xl font-bold px-2 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={handleClosePreview}
                    aria-label="Close preview"
                    tabIndex={0}
                  >
                    ×
                  </button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto rounded-b-2xl">
                  {previewLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading preview...</div>
                  ) : previewError ? (
                    <div className="text-center py-12 text-red-500">{previewError}</div>
                  ) : previewData ? (
                    <DataPreview data={previewData} fileName={previewFileName} />
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
