
import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onFileUpload: (data: any[], file: File) => void;
}

export const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processExcelFile = async (file: File) => {
    console.log('Processing file:', file.name, 'Size:', file.size);
    
    // Clear any previous errors
    setUploadError(null);
    
    // File size check (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      const error = "File size too large. Please upload files smaller than 10MB.";
      setUploadError(error);
      toast.error(error);
      return;
    }

    // File type validation
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    
    const isValidType = validTypes.includes(file.type) || file.name.match(/\.(xlsx?|csv)$/i);
    
    if (!isValidType) {
      const error = "Please upload an Excel file (.xlsx, .xls) or CSV file";
      setUploadError(error);
      toast.error(error);
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Reading file as array buffer...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('Array buffer size:', arrayBuffer.byteLength);
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      console.log('Workbook sheets:', workbook.SheetNames);
      
      if (workbook.SheetNames.length === 0) {
        throw new Error("No sheets found in the Excel file");
      }
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with header row as keys
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '', // Default value for empty cells
        raw: false // This helps with date parsing
      });
      
      console.log('Raw JSON data rows:', jsonData.length);
      
      if (jsonData.length === 0) {
        throw new Error("The Excel file appears to be empty");
      }
      
      if (jsonData.length < 2) {
        throw new Error("The Excel file must contain at least a header row and one data row");
      }
      
      // First row contains headers
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      console.log('Headers:', headers);
      console.log('Data rows:', rows.length);
      
      // Convert to array of objects
      const processedData = rows
        .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== '')) // Filter out completely empty rows
        .map((row, index) => {
          const rowData: any = { _id: index + 1 };
          headers.forEach((header, colIndex) => {
            let value = row[colIndex];
            
            // Handle null/undefined values
            if (value === null || value === undefined) {
              value = '';
            }
            
            // Try to parse numbers (but keep original if it's already a number)
            if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                value = numValue;
              }
            }
            
            // Handle dates better
            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{1,2}-\d{1,2}-\d{4}$/)) {
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                value = dateValue.toISOString().split('T')[0];
              }
            }
            
            rowData[header || `Column_${colIndex + 1}`] = value;
          });
          return rowData;
        });
      
      if (processedData.length === 0) {
        throw new Error("No valid data found in the Excel file");
      }
      
      console.log(`Successfully processed ${processedData.length} rows with ${headers.length} columns`);
      console.log('Sample data:', processedData.slice(0, 3));
      
      onFileUpload(processedData, file);
      setSelectedFile(file);
      setUploadError(null);
      toast.success(`Successfully parsed ${processedData.length} rows from Excel file!`);
      
    } catch (error) {
      console.error('Error processing Excel file:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to parse Excel file. Please check the file format.";
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', files.length);
    if (files.length > 0) {
      processExcelFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('Files selected:', files?.length);
    if (files && files.length > 0) {
      processExcelFile(files[0]);
    }
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadError(null);
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-all duration-300 ${
          isDragOver
            ? "border-blue-500 bg-blue-50 scale-105"
            : uploadError
            ? "border-red-300 bg-red-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 text-center">
          {isProcessing ? (
            <div className="space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-4 border-blue-200 border-t-blue-600"></div>
                <FileSpreadsheet className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">Processing your Excel file...</p>
                <p className="text-sm text-gray-600">Parsing data and detecting column types...</p>
                <div className="w-48 sm:w-64 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-full">
                <FileSpreadsheet className="h-12 sm:h-16 w-12 sm:w-16 text-green-600 mx-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900 break-words">{selectedFile.name}</p>
                <p className="text-sm text-green-600 font-medium">
                  ✓ File uploaded and parsed successfully!
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFile}
                  className="mt-3 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove File
                </Button>
              </div>
            </div>
          ) : uploadError ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-full">
                <AlertCircle className="h-12 sm:h-16 w-12 sm:w-16 text-red-500 mx-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-red-700">Upload Error</p>
                <p className="text-sm text-red-600 break-words">{uploadError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadError(null)}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="relative">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full">
                  <Upload className="h-12 sm:h-16 w-12 sm:w-16 text-blue-600 mx-auto" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 sm:w-6 h-5 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+</span>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Drop your Excel file here
                </h3>
                <p className="text-gray-600 text-sm sm:text-base">
                  or click to browse and select a file
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">.xlsx</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">.xls</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">.csv</span>
                </div>
                <p className="text-xs text-gray-500">
                  Maximum file size: 10MB
                </p>
              </div>
              <div className="pt-2">
                <Button 
                  size="lg"
                  onClick={handleChooseFileClick}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Help section */}
      <Card className="border-0 bg-gradient-to-r from-gray-50 to-blue-50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileSpreadsheet className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Supported formats</p>
              <p className="text-xs text-gray-600">Excel files (.xlsx, .xls) and CSV files with headers in the first row</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
