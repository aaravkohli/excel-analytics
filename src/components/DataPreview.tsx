import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileSpreadsheet, Download, Eye, BarChart, Search, AlertTriangle, Hash, Calendar, Type, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { analyzeExcelData, exportDataToExcel, getDataStatistics } from "@/utils/excelUtils";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface DataPreviewProps {
  data: any[];
  fileName?: string;
}

export const DataPreview = ({ data, fileName }: DataPreviewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColumn, setSelectedColumn] = useState<string>("");

  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No data to preview. Please upload an Excel file first.</p>
        </CardContent>
      </Card>
    );
  }

  const columns = Object.keys(data[0]);
  const totalRows = data.length;
  const analyzedColumns = analyzeExcelData(data);

  // Calculate quick summary stats
  const totalCells = totalRows * columns.length;
  const emptyCells = data.reduce((count, row) => {
    return count + columns.filter(col => 
      row[col] === null || row[col] === undefined || row[col] === ''
    ).length;
  }, 0);
  
  const numericColumns = analyzedColumns.filter(col => col.type === 'number');
  const dateColumns = analyzedColumns.filter(col => col.type === 'date');
  const textColumns = analyzedColumns.filter(col => col.type === 'text');

  // Filter data based on search
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    if (selectedColumn && selectedColumn !== "") {
      return String(row[selectedColumn] || '').toLowerCase().includes(searchTerm.toLowerCase());
    }
    return columns.some(col => 
      String(row[col] || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleExportData = () => {
    const success = exportDataToExcel(filteredData, fileName?.replace(/\.[^/.]+$/, "") || 'excel_data');
    if (success) {
      toast.success("Data exported successfully!");
    } else {
      toast.error("Failed to export data");
    }
  };

  const getColumnTypeColor = (type: string) => {
    switch (type) {
      case 'number': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'date': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getColumnTypeIcon = (type: string) => {
    switch (type) {
      case 'number': return <Hash className="h-4 w-4 text-blue-600" />;
      case 'date': return <Calendar className="h-4 w-4 text-green-600" />;
      default: return <Type className="h-4 w-4 text-gray-600" />;
    }
  };

  const isCellEmpty = (value: any) => {
    return value === null || value === undefined || value === '';
  };

  const isOutlier = (value: any, column: string) => {
    const columnData = analyzedColumns.find(col => col.name === column);
    if (columnData?.type !== 'number') return false;
    
    const stats = getDataStatistics(data, column);
    if (!stats || stats.type !== 'number') return false;
    
    const numValue = Number(value);
    const range = stats.max - stats.min;
    const threshold = range * 0.1; // Consider values outside 10% of range as potential outliers
    
    return Math.abs(numValue - stats.average) > threshold;
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Quick Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BarChart className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Data</p>
                <p className="text-xl font-bold text-blue-900">{totalRows} rows × {columns.length} cols</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">Missing Cells</p>
                <p className="text-xl font-bold text-red-900">{emptyCells} / {totalCells}</p>
                <p className="text-xs text-red-600">{((emptyCells / totalCells) * 100).toFixed(1)}% empty</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Numeric Columns</p>
                <p className="text-xl font-bold text-green-900">{numericColumns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Data Quality</p>
                <p className="text-xl font-bold text-purple-900">
                  {emptyCells < totalCells * 0.05 ? 'Excellent' : 
                   emptyCells < totalCells * 0.15 ? 'Good' : 
                   emptyCells < totalCells * 0.30 ? 'Fair' : 'Poor'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Complete Data Preview
              </CardTitle>
              <CardDescription>
                {fileName && `File: ${fileName} • `}
                Showing {filteredData.length} of {totalRows} rows • {columns.length} columns
              </CardDescription>
            </div>
            <Button
              onClick={handleExportData}
              variant="outline"
              className="flex items-center gap-2 shrink-0"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search across all data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="">All columns</option>
                {columns.map((column) => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>

            {/* Column Analysis */}
            <TooltipProvider>
              <Accordion type="single" collapsible defaultValue="column-analysis">
                <AccordionItem value="column-analysis">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AccordionTrigger className="group text-base font-semibold flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
                        <BarChart className="h-5 w-5 text-blue-600" />
                        <span>Column Analysis ({analyzedColumns.length} columns detected)</span>
                        <span className="ml-auto flex items-center gap-1 text-blue-500 group-hover:underline">
                          <span className="text-xs hidden sm:inline">Show/Hide</span>
                        </span>
                      </AccordionTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      Click to expand or collapse the column analysis section.
                    </TooltipContent>
                  </Tooltip>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {analyzedColumns.map((column) => {
                        const stats = getDataStatistics(data, column.name);
                        return (
                          <Card key={column.name} className="p-3 hover:shadow-md transition-shadow">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  {getColumnTypeIcon(column.type)}
                                  <span className="font-medium text-sm truncate" title={column.name}>
                                    {column.name}
                                  </span>
                                </div>
                                <Badge className={`text-xs flex-shrink-0 ${getColumnTypeColor(column.type)}`}>
                                  {column.type}
                                </Badge>
                              </div>
                              {stats && (
                                <div className="text-xs text-gray-600 space-y-1">
                                  {stats.type === 'number' && (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Count:</span>
                                        <span>{stats.count}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Range:</span>
                                        <span>{stats.min} - {stats.max}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Avg:</span>
                                        <span>{stats.average.toFixed(2)}</span>
                                      </div>
                                    </>
                                  )}
                                  {stats.type !== 'number' && (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Count:</span>
                                        <span>{stats.count}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Unique:</span>
                                        <span>{stats.unique}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TooltipProvider>

            {/* Data Cleaning Suggestions */}
            {emptyCells > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Data Quality Insights
                </h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• {emptyCells} missing values detected ({((emptyCells / totalCells) * 100).toFixed(1)}% of total)</p>
                  <p>• Consider filling missing numeric values with 0 or median</p>
                  <p>• Consider filling missing text values with "N/A" or "Unknown"</p>
                  {emptyCells > totalCells * 0.3 && (
                    <p className="font-medium">• High percentage of missing data - consider data quality review</p>
                  )}
                </div>
              </div>
            )}

            {/* Full Data Table with Enhanced Scrolling */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Complete Dataset ({filteredData.length} rows)
              </h3>
              
              {/* Responsive Table Container */}
              <div className="border rounded-lg bg-white shadow-sm">
                <ScrollArea className="h-[600px] w-full">
                  <div className="min-w-full">
                    <table className="w-full border-collapse">
                      {/* Sticky Header */}
                      <thead className="sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="sticky left-0 z-20 bg-gray-100 border-r-2 border-gray-300 px-4 py-3 text-center font-semibold text-gray-900 min-w-[60px]">
                            #
                          </th>
                          {columns.map((column, colIndex) => {
                            const columnType = analyzedColumns.find(col => col.name === column)?.type;
                            return (
                              <th 
                                key={column} 
                                className="px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-200 min-w-[150px] max-w-[250px]"
                              >
                                <div className="flex items-center gap-2">
                                  {getColumnTypeIcon(columnType || 'text')}
                                  <span className="truncate flex-1" title={column}>
                                    {column}
                                  </span>
                                  <Badge className={`text-xs flex-shrink-0 ${getColumnTypeColor(columnType || 'text')}`}>
                                    {columnType}
                                  </Badge>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      
                      {/* Table Body - All Real Data */}
                      <tbody>
                        {filteredData.map((row, rowIndex) => (
                          <tr 
                            key={rowIndex} 
                            className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                              rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                            }`}
                          >
                            {/* Sticky Row Number */}
                            <td className="sticky left-0 z-10 bg-gray-50 border-r-2 border-gray-300 px-4 py-3 text-center text-sm text-gray-500 font-mono">
                              {rowIndex + 1}
                            </td>
                            
                            {/* Data Cells */}
                            {columns.map((column) => {
                              const value = row[column];
                              const isEmpty = isCellEmpty(value);
                              const isOutlierValue = isOutlier(value, column);
                              
                              return (
                                <td 
                                  key={column} 
                                  className={`px-4 py-3 text-sm border-r border-gray-100 min-w-[150px] max-w-[250px] ${
                                    isEmpty ? 'bg-red-50 text-red-400 italic' : 
                                    isOutlierValue ? 'bg-orange-50 text-orange-700' : 'text-gray-900'
                                  }`}
                                  title={isEmpty ? 'Missing value' : isOutlierValue ? `Potential outlier: ${value}` : String(value || '')}
                                >
                                  <div className="truncate">
                                    {isEmpty ? '(empty)' : String(value)}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Data Summary Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Displaying all {filteredData.length} rows of {totalRows} total records
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Columns: {columns.length}</span>
                <span>•</span>
                <span>Data Quality: {((1 - emptyCells / totalCells) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
