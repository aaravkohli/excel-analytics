import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, Zap } from "lucide-react";
import { toast } from "sonner";
import { generateAIInsights } from "@/utils/aiInsights";
import { useState } from "react";

interface ChartSidebarProps {
  data: any[];
  xAxis: string;
  yAxis: string;
  zAxis?: string;
  chartDimension: '2d' | '3d';
  onDownload: () => void;
}

export const ChartSidebar = ({ data, xAxis, yAxis, zAxis, chartDimension, onDownload }: ChartSidebarProps) => {
  const [loading, setLoading] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<string | null>(null);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const numericColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'number')
  );

  const handleGenerateInsights = async () => {
    if (!xAxis || !yAxis) {
      toast.error("Please select both X and Y axes first");
      return;
    }

    setLoading(true);
    try {
      const analysisResults = {
        data: data,
        chartConfig: {
          type: chartDimension === '3d' ? '3d-bar' : 'bar',
          xAxis: { column: xAxis, label: xAxis },
          yAxis: { column: yAxis, label: yAxis },
          ...(zAxis && { zAxis: { column: zAxis, label: zAxis } })
        },
        statistics: calculateBasicStats(data, [xAxis, yAxis, zAxis].filter(Boolean) as string[])
      };

      const insights = await generateAIInsights(data, analysisResults);
      if (insights && insights.length > 0) {
        const randomInsight = insights[Math.floor(Math.random() * insights.length)];
        setCurrentInsight(randomInsight.description);
        toast.success("AI insights generated!");
      } else {
        toast.error("No insights could be generated. Please try with different data.");
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error("Failed to generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* AI Insights */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="text-center py-4">
            <Button
              onClick={handleGenerateInsights}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all w-full"
              size="sm"
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Generate Insights"}
            </Button>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentInsight || "Select X and Y axes to generate insights"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Zap className="h-3 w-3" />
              <span>AI-powered analysis</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Data Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Total Records</div>
              <div className="text-lg font-bold text-blue-600">{data.length}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Columns</div>
              <div className="text-lg font-bold text-purple-600">{columns.length}</div>
            </div>
          </div>
          
          {numericColumns.includes(yAxis) && yAxis && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max {yAxis}:</span>
                <span className="font-semibold text-green-600">
                  {Math.max(...data.map(d => d[yAxis]))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Min {yAxis}:</span>
                <span className="font-semibold text-red-600">
                  {Math.min(...data.map(d => d[yAxis]))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average:</span>
                <span className="font-semibold text-blue-600">
                  {(data.reduce((sum, d) => sum + d[yAxis], 0) / data.length).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Features */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Interactive controls</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Real-time updates</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Export capabilities</span>
          </div>
          {chartDimension === '3d' && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>3D rotation & zoom</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Multi-dimensional analysis</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button
        onClick={onDownload}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        size="lg"
      >
        <Download className="h-4 w-4 mr-2" />
        Export Chart
      </Button>
    </div>
  );
};
