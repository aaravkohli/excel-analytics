import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button as StyledButton } from './ui/button';
import { Badge as StyledBadge } from './ui/badge';
import { Progress as StyledProgress } from './ui/progress';
import { Loader2, Brain, TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { generateAIInsights, generateNaturalLanguageSummary, AIInsight } from '../utils/aiInsights';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px);}
  to { opacity: 1; transform: none;}
`;

const InsightsList = styled.ul`
  margin-top: 1.5rem;
  list-style: none;
  padding: 0;
  animation: ${fadeIn} 0.5s;
`;

const InsightItem = styled.li`
  background: #f6f8fa;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 2px 8px rgba(80,80,200,0.08);
  }
`;

const Badge = styled.span<{ color: string }>`
  display: inline-block;
  padding: 0.2em 0.7em;
  border-radius: 0.5em;
  font-size: 0.85em;
  font-weight: 600;
  background: ${({ color }) => color};
  color: #fff;
  margin-right: 0.5em;
`;

const Button = styled.button`
  background: linear-gradient(90deg, #6366f1, #ec4899);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s, transform 0.2s;
  &:hover { background: linear-gradient(90deg, #4f46e5, #db2777); transform: scale(1.03);}
  &:disabled { opacity: 0.6; cursor: not-allowed;}
`;

const ErrorMsg = styled.div`
  color: #dc2626;
  background: #fef2f2;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`;

const Loading = styled.div`
  margin-top: 1rem;
  color: #6366f1;
  font-weight: 500;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5em;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  font-size: 0.95em;
  th, td {
    padding: 0.3em 0.7em;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
    word-break: break-word;
    vertical-align: top;
  }
  th {
    background: #e0e7ef;
    font-weight: 600;
  }
  tr:last-child td {
    border-bottom: none;
  }
`;

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
      return 'bg-blue-100 text-blue-800';
    case 'correlation':
      return 'bg-purple-100 text-purple-800';
    case 'anomaly':
      return 'bg-red-100 text-red-800';
    case 'recommendation':
      return 'bg-green-100 text-green-800';
    case 'quality':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

function renderSupportingData(data: any) {
  if (!data) return null;
  // Array of objects
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const columns = Array.from(
      new Set(data.flatMap((row: any) => Object.keys(row)))
    );
    return (
      <DataTable>
        <thead>
          <tr>
            {columns.map(col => <th key={col}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col}>
                  {typeof row[col] === 'object'
                    ? JSON.stringify(row[col])
                    : String(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </DataTable>
    );
  }
  // Array of primitives
  if (Array.isArray(data)) {
    return <div>{data.join(', ')}</div>;
  }
  // Object
  if (typeof data === 'object') {
    return (
      <DataTable>
        <tbody>
          {Object.entries(data).map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>
                {Array.isArray(v)
                  ? v.length > 0 && typeof v[0] === 'object'
                    ? renderSupportingData(v)
                    : v.join(', ')
                  : typeof v === 'object'
                  ? JSON.stringify(v)
                  : String(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    );
  }
  // Fallback
  return <pre style={{ fontSize: '0.95em' }}>{String(data)}</pre>;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  data,
  analysisResults,
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only generate on button click
  const handleGenerate = async () => {
    setError('');
    setInsights([]);
    setSummary('');
    setLoading(true);
    try {
      const [
        aiInsights,
        naturalSummary
      ] = await Promise.all([
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
          <CardDescription>Generating intelligent insights from your data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <StyledButton onClick={handleGenerate} variant="outline">
              Try Again
            </StyledButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 lg:p-10 mt-0">
      <h2 className="text-xl font-bold mb-2">AI-Powered Insights</h2>
      <p className="mb-4">Generate AI-powered insights from your data visualization to help you understand patterns and trends.</p>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating Insights...' : 'Generate Insights'}
      </Button>
      {loading && <Loading>Analyzing your data...</Loading>}
      {error && <ErrorMsg>{error}</ErrorMsg>}
      {summary && (
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600, color: '#6366f1', marginBottom: 8 }}>AI Summary</h3>
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
      {insights.length > 0 && (
        <InsightsList>
          {insights.map((insight, idx) => (
            <InsightItem key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <Badge color={getInsightColor(insight.type)}>{insight.type}</Badge>
                <strong style={{ fontSize: '1.1em' }}>{insight.title}</strong>
              </div>
              <ReactMarkdown>{insight.description}</ReactMarkdown>
              {insight.businessImpact && (
                <div style={{ marginTop: 8, color: '#2563eb', fontWeight: 500 }}>
                  <span style={{ fontWeight: 700 }}>Business Impact: </span>
                  {insight.businessImpact}
                </div>
              )}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-1">
                <div
                  className="h-2.5 rounded-full transition-all duration-500 bg-green-500"
                  style={{ width: `${Math.round(insight.confidence * 100)}%` }}
                ></div>
              </div>
              <div style={{ fontSize: '0.9em', color: '#6b7280', marginTop: 2 }}>
                Confidence: {Math.round(insight.confidence * 100)}%
              </div>
              {insight.data && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer', color: '#6366f1' }}>Supporting Data</summary>
                  {renderSupportingData(insight.data)}
                </details>
              )}
            </InsightItem>
          ))}
        </InsightsList>
      )}
    </div>
  );
}; 