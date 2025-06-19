
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart, PieChart, Box, Hash, Calendar, Type } from "lucide-react";
import { detectColumnType } from "@/utils/excelUtils";

interface ChartControlsProps {
  data: any[];
  onConfigChange: (config: ChartConfig) => void;
}

export interface ChartConfig {
  xAxis: string;
  yAxis: string;
  zAxis: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | '3d-bar' | '3d-scatter' | '3d-surface';
  chartDimension: '2d' | '3d';
}

const getColumnTypeIcon = (type: string) => {
  switch (type) {
    case 'number': return <Hash className="h-3 w-3 text-blue-600" />;
    case 'date': return <Calendar className="h-3 w-3 text-green-600" />;
    default: return <Type className="h-3 w-3 text-gray-600" />;
  }
};

const getColumnTypeBadge = (type: string) => {
  const colors = {
    number: 'bg-blue-100 text-blue-800 border-blue-300',
    date: 'bg-green-100 text-green-800 border-green-300',
    text: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colors[type as keyof typeof colors] || colors.text;
};

export const ChartControls = ({ data, onConfigChange }: ChartControlsProps) => {
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [zAxis, setZAxis] = useState<string>("");
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area' | 'scatter' | '3d-bar' | '3d-scatter' | '3d-surface'>('bar');
  const [chartDimension, setChartDimension] = useState<'2d' | '3d'>('2d');

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  
  // Get column types for all columns
  const columnsWithTypes = columns.map(col => {
    const values = data.map(row => row[col]);
    const type = detectColumnType(values);
    return { name: col, type };
  });

  const handleConfigUpdate = (updates: Partial<ChartConfig>) => {
    const newConfig = {
      xAxis,
      yAxis,
      zAxis,
      chartType,
      chartDimension,
      ...updates
    };
    
    if (updates.xAxis !== undefined) setXAxis(updates.xAxis);
    if (updates.yAxis !== undefined) setYAxis(updates.yAxis);
    if (updates.zAxis !== undefined) setZAxis(updates.zAxis);
    if (updates.chartType !== undefined) setChartType(updates.chartType);
    if (updates.chartDimension !== undefined) {
      setChartDimension(updates.chartDimension);
      // Reset chart type when switching dimensions
      if (updates.chartDimension === '2d') {
        setChartType('bar');
        newConfig.chartType = 'bar';
      } else {
        setChartType('3d-bar');
        newConfig.chartType = '3d-bar';
      }
    }

    onConfigChange(newConfig);
  };

  const is3D = chartDimension === '3d';

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-blue-50">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            {is3D ? <Box className="h-6 w-6" /> : <BarChart3 className="h-6 w-6" />}
          </div>
          Chart Configuration
        </CardTitle>
        <CardDescription className="text-blue-100">
          Configure your chart axes and visualization type - all column types now supported
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Dimension Toggle */}
        <div className="flex justify-center">
          <Tabs 
            value={chartDimension} 
            onValueChange={(value: '2d' | '3d') => handleConfigUpdate({ chartDimension: value })} 
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="2d" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                2D Charts
              </TabsTrigger>
              <TabsTrigger value="3d" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                3D Charts
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Axis Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="x-axis" className="text-sm font-semibold text-gray-700">X-Axis (Any Column)</Label>
            <Select value={xAxis} onValueChange={(value) => handleConfigUpdate({ xAxis: value })}>
              <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500">
                <SelectValue placeholder="Select X-axis column" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {columnsWithTypes.map((column) => (
                  <SelectItem key={column.name} value={column.name}>
                    <div className="flex items-center gap-2 w-full">
                      {getColumnTypeIcon(column.type)}
                      <span className="flex-1">{column.name}</span>
                      <Badge className={`text-xs px-1 py-0 ${getColumnTypeBadge(column.type)}`}>
                        {column.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="y-axis" className="text-sm font-semibold text-gray-700">Y-Axis (Any Column)</Label>
            <Select value={yAxis} onValueChange={(value) => handleConfigUpdate({ yAxis: value })}>
              <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500">
                <SelectValue placeholder="Select Y-axis column" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {columnsWithTypes.map((column) => (
                  <SelectItem key={column.name} value={column.name}>
                    <div className="flex items-center gap-2 w-full">
                      {getColumnTypeIcon(column.type)}
                      <span className="flex-1">{column.name}</span>
                      <Badge className={`text-xs px-1 py-0 ${getColumnTypeBadge(column.type)}`}>
                        {column.type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {is3D && (
            <div className="space-y-2">
              <Label htmlFor="z-axis" className="text-sm font-semibold text-gray-700">Z-Axis (Any Column)</Label>
              <Select value={zAxis} onValueChange={(value) => handleConfigUpdate({ zAxis: value })}>
                <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select Z-axis column" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {columnsWithTypes.map((column) => (
                    <SelectItem key={column.name} value={column.name}>
                      <div className="flex items-center gap-2 w-full">
                        {getColumnTypeIcon(column.type)}
                        <span className="flex-1">{column.name}</span>
                        <Badge className={`text-xs px-1 py-0 ${getColumnTypeBadge(column.type)}`}>
                          {column.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="chart-type" className="text-sm font-semibold text-gray-700">Chart Type</Label>
            <Select 
              value={chartType} 
              onValueChange={(value: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | '3d-bar' | '3d-scatter' | '3d-surface') => 
                handleConfigUpdate({ chartType: value })
              }
            >
              <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {is3D ? (
                  <>
                    <SelectItem value="3d-bar">3D Bar Chart</SelectItem>
                    <SelectItem value="3d-scatter">3D Scatter Plot</SelectItem>
                    <SelectItem value="3d-surface">3D Surface</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="scatter">Scatter Plot</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Configuration Display */}
        {xAxis && yAxis && (
          <div className="flex flex-wrap gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 bg-white border-blue-300">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="font-medium">X: {xAxis}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 bg-white border-purple-300">
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              <span className="font-medium">Y: {yAxis}</span>
            </Badge>
            {is3D && zAxis && (
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 bg-white border-green-300">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="font-medium">Z: {zAxis}</span>
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 bg-white border-orange-300">
              {chartType === 'bar' && <BarChart3 className="w-3 h-3" />}
              {chartType === 'line' && <LineChart className="w-3 h-3" />}
              {chartType === 'pie' && <PieChart className="w-3 h-3" />}
              {is3D && <Box className="w-3 h-3" />}
              <span className="font-medium capitalize">{chartType.replace('-', ' ')}</span>
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
