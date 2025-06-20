import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Loader2, Brain, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, Sparkles, ChevronDown, Database, Zap } from 'lucide-react';
import { generateAIInsights, generateNaturalLanguageSummary, AIInsight } from '../utils/aiInsights';

export interface AIInsightsProps {
  data: any[];
  analysisResults: any;
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'pattern':
      return <TrendingUp className="h-4 w-4" />;
    case 'correlation':
      return <Brain className="h-4 w-4" />;
    case 'anomaly':
      return <AlertTriangle className="h-4 w-4" />;
    case 'recommendation':
      return <Lightbulb className="h-4 w-4" />;
    case 'quality':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Brain className="h-4 w-4" />;
  }
};

const getInsightColor = (type: string) => {
  switch (type) {
    case 'pattern':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'correlation':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'anomaly':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'recommendation':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'quality':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
};

function renderSupportingData(data: any) {
  if (!data) return null;
  
  // Handle arrays of objects
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const columns = Array.from(new Set(data.flatMap((row: any) => Object.keys(row))));
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse bg-gray-50 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              {columns.map(col => (
                <th key={col} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 5).map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 border-b border-gray-200">
                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
            {data.length > 5 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-2 text-center text-gray-500 italic">
                  ... and {data.length - 5} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
  
  // Handle arrays of primitives
  if (Array.isArray(data)) {
    return (
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex flex-wrap gap-2">
          {data.slice(0, 10).map((item, i) => (
            <span key={i} className="px-2 py-1 bg-white rounded text-sm border">
              {String(item)}
            </span>
          ))}
          {data.length > 10 && (
            <span className="px-2 py-1 text-gray-500 text-sm">
              +{data.length - 10} more
            </span>
          )}
        </div>
      </div>
    );
  }
  
  // Handle objects
  if (typeof data === 'object') {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex justify-between py-1 border-b border-gray-200 last:border-b-0">
            <span className="font-medium text-gray-700">{k}:</span>
            <span className="text-gray-600">
              {Array.isArray(v) 
                ? `[${v.length} items]`
                : typeof v === 'object' 
                  ? JSON.stringify(v)
                  : String(v)
              }
            </span>
          </div>
        ))}
      </div>
    );
  }
  
  // Fallback for primitives
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <code className="text-sm text-gray-700">{String(data)}</code>
    </div>
  );
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  data,
  analysisResults,
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setInsights([]);
    setSummary('');
    setLoading(true);
    
    try {
      const [aiInsights, naturalSummary] = await Promise.all([
        generateAIInsights(data, analysisResults),
        generateNaturalLanguageSummary(analysisResults)
      ]);
      
      setInsights(aiInsights);
      setSummary(naturalSummary);
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription className="text-purple-100">
            Generating intelligent insights from your data...
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-purple-200 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-700">Analyzing your data...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
            <div className="w-full max-w-xs">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
            <Button onClick={handleGenerate} variant="outline" className="hover:bg-red-50">
              <Zap className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Insights
        </CardTitle>
        <CardDescription className="text-purple-100">
          Generate AI-powered insights from your data visualization
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Generate Button */}
        <div className="text-center">
          <Button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            size="lg"
            disabled={loading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? "Generating Insights..." : "Generate AI Insights"}
          </Button>
          {!summary && !insights.length && (
            <p className="text-sm text-gray-500 mt-2">
              Click to analyze patterns, trends, and correlations in your data
            </p>
          )}
        </div>

        {/* AI Summary */}
        {summary && (
          <div className="animate-fade-in">
            <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Brain className="h-5 w-5" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="text-gray-700 leading-relaxed">
                    <ReactMarkdown>
                      {summary}
                    </ReactMarkdown>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insights List */}
        {insights.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Detailed Insights ({insights.length})
              </h3>
              <Badge variant="outline" className="bg-white">
                AI Powered
              </Badge>
            </div>
            
            <Accordion type="single" collapsible className="space-y-3">
              {insights.map((insight, idx) => (
                <AccordionItem 
                  key={idx} 
                  value={`insight-${idx}`}
                  className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center gap-3 text-left">
                      <div className={`p-2 rounded-lg ${getInsightColor(insight.type)} border`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={getInsightColor(insight.type)}>
                            {insight.type}
                          </Badge>
                          <span className="text-sm font-medium text-gray-800">
                            {insight.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${getConfidenceColor(insight.confidence)}`}
                              style={{ width: `${Math.round(insight.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Description */}
                      <div className="prose prose-sm max-w-none">
                        <div className="text-gray-700 leading-relaxed">
                          <ReactMarkdown>
                            {insight.description}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Business Impact */}
                      {insight.businessImpact && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <span className="font-medium text-green-800">Business Impact:</span>
                              <p className="text-green-700 mt-1">{insight.businessImpact}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Supporting Data */}
                      {insight.data && (
                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                            <Database className="h-4 w-4" />
                            Supporting Data
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3">
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                              {renderSupportingData(insight.data)}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
};