import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Box } from "lucide-react";
import { toast } from "sonner";
import { Chart2D } from "@/components/Chart2D";
import { Chart3D } from "@/components/Chart3D";
import { ChartControls, ChartConfig } from "@/components/chart/ChartControls";
import { ChartSidebar } from "@/components/chart/ChartSidebar";
import { AIInsights } from './AIInsights';
import { createAnalysis, exportAnalysis } from "@/utils/api";

interface ChartGeneratorProps {
  data: any[];
  fileId?: string | null;
}

export const ChartGenerator = ({ data, fileId }: ChartGeneratorProps) => {
  const [config, setConfig] = useState<ChartConfig>({
    xAxis: "",
    yAxis: "",
    zAxis: "",
    chartType: 'bar',
    chartDimension: '2d'
  });
  const chartRef = useRef<HTMLDivElement>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-blue-50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-6 bg-white rounded-full shadow-lg mb-6">
            <BarChart3 className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500 text-center max-w-md">
            Upload an Excel file first to start creating amazing visualizations with our advanced charting tools.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSaveChart = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || undefined;
      if (!fileId) {
        toast.error("No fileId available. Please upload a file first.");
        setSaving(false);
        return;
      }
      const body = {
        name: `Chart: ${config.chartType} (${config.xAxis} vs ${config.yAxis}${config.zAxis ? ' vs ' + config.zAxis : ''})`,
        type: 'visualization',
        chartConfig: {
          type: config.chartDimension === '3d' ? '3d-bar' : config.chartType,
          xAxis: { column: config.xAxis, label: config.xAxis },
          yAxis: { column: config.yAxis, label: config.yAxis },
          ...(config.chartDimension === '3d' && config.zAxis ? { zAxis: { column: config.zAxis, label: config.zAxis } } : {})
        },
        data: data,
        file: fileId,
      };
      const res = await createAnalysis(body, token);
      setAnalysisId(res.data.analysis._id);
      toast.success("Chart saved to backend!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save chart to backend.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadChart = async () => {
    if (!analysisId) {
      toast.error("Please save the chart first.");
      return;
    }
    setDownloading(true);
    try {
      const token = localStorage.getItem('token') || undefined;
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/analysis/${analysisId}/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to export chart from backend.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-${analysisId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Chart exported from backend!");
    } catch (e: any) {
      toast.error(e.message || "Failed to export chart from backend.");
    } finally {
      setDownloading(false);
    }
  };

  const handleConfigChange = (newConfig: ChartConfig) => {
    setConfig(newConfig);
  };

  const is3D = config.chartDimension === '3d';

  // Helper to calculate basic stats for selected axes
  const calculateBasicStats = (data: any[], columns: string[]) => {
    const stats: any = {};
    columns.forEach(col => {
      const values = data.map(row => row[col]).filter(val => !isNaN(val));
      if (values.length > 0) {
        stats[col] = {
          min: Math.min(...values),
          max: Math.max(...values),
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length
        };
      }
    });
    return stats;
  };

  const analysisResults = {
    data: data,
    chartConfig: {
      type: is3D ? '3d-bar' : config.chartType,
      xAxis: { column: config.xAxis, label: config.xAxis },
      yAxis: { column: config.yAxis, label: config.yAxis },
      ...(is3D && config.zAxis ? { zAxis: { column: config.zAxis, label: config.zAxis } } : {})
    },
    statistics: calculateBasicStats(data, [config.xAxis, config.yAxis, is3D ? config.zAxis : undefined].filter(Boolean) as string[])
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Advanced Chart Generator
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm lg:text-base">
          Create stunning 2D and 3D visualizations with our powerful chart engine. 
          Explore your data from every angle.
        </p>
      </div>

      {/* Chart Controls */}
      <ChartControls data={data} onConfigChange={handleConfigChange} />
      <div className="flex gap-2 mb-4">
        <Button onClick={handleSaveChart} disabled={saving}>
          {saving ? "Saving..." : "Save Chart"}
        </Button>
        <Button onClick={handleDownloadChart} disabled={downloading} variant="outline">
          {downloading ? "Downloading..." : "Download/Export"}
        </Button>
      </div>

      {/* Chart Display */}
      {config.xAxis && config.yAxis && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
          <div className="xl:col-span-3">
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-900 to-blue-900 text-white p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-3 capitalize text-lg">
                    {is3D ? <Box className="h-6 w-6" /> : <BarChart3 className="h-6 w-6" />}
                    {config.chartType.replace('-', ' ')} Chart
                  </CardTitle>
                  <Button
                    onClick={handleDownloadChart}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div ref={chartRef}>
                  {is3D ? (
                    <Chart3D
                      data={data}
                      xAxis={config.xAxis}
                      yAxis={config.yAxis}
                      zAxis={config.zAxis}
                      chartType={config.chartType as any}
                    />
                  ) : (
                    <div className="p-4 lg:p-6">
                      <Chart2D
                        data={data}
                        xAxis={config.xAxis}
                        yAxis={config.yAxis}
                        chartType={config.chartType as any}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights Panel */}
          <div className="xl:col-span-1">
            <AIInsights
              data={data}
              analysisResults={analysisResults}
            />
          </div>
        </div>
      )}
    </div>
  );
};
