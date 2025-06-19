import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Helper to get the Gemini model
const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash' });
};

export interface AnalysisData {
  data: any[];
  statistics?: any;
  correlations?: any;
  trends?: any;
  type?: string;
  chartConfig?: {
    type: string;
    xAxis: { column: string; label: string };
    yAxis: { column: string; label: string };
    zAxis?: { column: string; label: string };
  };
}

export interface AIInsight {
  type: 'pattern' | 'correlation' | 'anomaly' | 'recommendation' | 'quality';
  title: string;
  description: string;
  confidence: number;
  data?: any;
  businessImpact?: string;
}

const generate2DPrompt = (context: any) => `
You are an expert data analyst. Analyze this dataset focusing on how "${context.chartConfig.xAxis.label}" influences "${context.chartConfig.yAxis.label}" using statistical reasoning and business insight.

Dataset Summary:
- Rows: ${context.dataShape.rowCount}
- X-Axis: ${context.chartConfig.xAxis.label}
- Y-Axis: ${context.chartConfig.yAxis.label}
- Chart Type: ${context.chartConfig.type}

Sample (first 10 rows):
${JSON.stringify(context.data.slice(0, 10), null, 2)}

Statistics:
${JSON.stringify(context.statistics, null, 2)}

🔍 Your task:
1. Detect real-world patterns or correlations (e.g., "POST has 2x more 5xx errors than GET").
2. Find significant spikes, drops, or trends.
3. Identify outliers or abnormal combinations (e.g., one method causing all failures).
4. Explain business implications clearly (e.g., "Error spikes during peak traffic hours suggest scaling issues").
5. Back every point with data (counts, % changes, etc.).

Return a JSON array with this schema:
[
  {
    "type": "pattern" | "correlation" | "anomaly" | "recommendation" | "quality",
    "title": "Short but specific",
    "description": "Use real data values to explain the finding",
    "confidence": 0.92, // between 0.0 and 1.0
    "businessImpact": "Describe how this affects operations or decisions",
    "data": { ... } // sample numbers or filtered rows
  }
]

The "confidence" field must be a number between 0.0 and 1.0.
Do not include vague advice like "use pivot tables" or "draw a chart". Focus on interpretation.
`;


const generate3DPrompt = (context: any) => `
You are a senior data analyst working on a 3D visualization comparing "${context.chartConfig.xAxis.label}", "${context.chartConfig.yAxis.label}", and "${context.chartConfig.zAxis.label}".

Dataset Summary:
- Rows: ${context.dataShape.rowCount}
- Chart Type: ${context.chartConfig.type}
- Axes: ${context.chartConfig.xAxis.label} vs ${context.chartConfig.yAxis.label} vs ${context.chartConfig.zAxis.label}

Sample Data:
${JSON.stringify(context.data.slice(0, 10), null, 2)}

Statistics:
${JSON.stringify(context.statistics, null, 2)}

Your mission:
1. Detect clusters or groupings in 3D space.
2. Spot multi-dimensional anomalies (e.g., high latency + status 500 only in POST at night).
3. Highlight surface-level patterns (in heatmaps, surfaces, scatter3D).
4. Use comparative metrics (e.g., "% of 5xx errors occurring when X is high").
5. Suggest improvements, decisions, or anomalies based on interactions between 3 variables.

Format your answer as a structured JSON array:
[
  {
    "type": "pattern" | "correlation" | "anomaly" | "recommendation" | "quality",
    "title": "What was found?",
    "description": "What does it mean and what numbers back it?",
    "confidence": 0.92, // between 0.0 and 1.0
    "businessImpact": "How it affects operations",
    "data": { ... }
  }
]

The "confidence" field must be a number between 0.0 and 1.0.
Avoid generic responses or tool suggestions. Focus on data interpretation.
`;


/**
 * Generates AI insights from data analysis results
 */
export const generateAIInsights = async (data: any[], analysisResults: AnalysisData): Promise<AIInsight[]> => {
  try {
    const model = getGeminiModel();

    const context = {
      data: data,
      dataShape: {
        rowCount: data.length,
        columns: Object.keys(data[0] || {})
      },
      statistics: analysisResults.statistics || {},
      correlations: analysisResults.correlations || {},
      trends: analysisResults.trends || {},
      chartConfig: analysisResults.chartConfig
    };

    // Choose prompt based on chart type
    const is3D = context.chartConfig?.type?.includes('3d');
    const prompt = is3D ? generate3DPrompt(context) : generate2DPrompt(context);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const insights = JSON.parse(jsonMatch[0]);
        // Filter out any insights that mention _id
        return insights.filter((insight: AIInsight) => 
          !insight.description.toLowerCase().includes('_id') &&
          !insight.title.toLowerCase().includes('_id') &&
          (!insight.businessImpact || !insight.businessImpact.toLowerCase().includes('_id'))
        );
      } catch (e) {
        console.error('Error parsing insights JSON:', e);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return [];
  }
};

/**
 * Generates natural language summary of analysis results
 */
export const generateNaturalLanguageSummary = async (analysisResults: AnalysisData): Promise<string> => {
  try {
    const model = getGeminiModel();

    const prompt = `As an expert data analyst, provide a clear, actionable summary of these analysis results:
    ${JSON.stringify(analysisResults, null, 2)}
    
    Focus on:
    1. Key findings with specific numbers
    2. Business implications and recommendations
    3. Notable patterns and correlations
    4. Data quality observations
    5. Potential areas for deeper analysis

    Keep it concise but include specific data points and business value.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Unable to generate summary at this time.';
  }
};

/**
 * Suggests potential analyses based on data characteristics
 */
export const suggestAnalyses = async (fileMetadata: any): Promise<string[]> => {
  try {
    const model = getGeminiModel();

    const prompt = `As an expert data analyst, suggest valuable analyses based on this Excel file metadata:
    ${JSON.stringify(fileMetadata, null, 2)}
    
    Consider:
    1. Column data types and relationships
    2. Business metrics and KPIs
    3. Time-based analyses if applicable
    4. Multi-dimensional relationships
    5. Advanced statistical methods
    
    For each suggestion:
    - Explain why it would be valuable
    - What business questions it would answer
    - What insights it might reveal
    
    Return as a list of clear, actionable suggestions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text()
      .split('\n')
      .filter(line => line.trim().length > 0);
  } catch (error) {
    console.error('Error suggesting analyses:', error);
    return ['Unable to suggest analyses at this time.'];
  }
};

/**
 * Compares multiple analyses and provides insights
 */
export const compareAnalyses = async (analyses: any[]): Promise<AIInsight[]> => {
  try {
    const model = getGeminiModel();

    const prompt = `As an expert data analyst, compare these analyses and provide detailed insights:
    ${JSON.stringify(analyses, null, 2)}
    
    Focus on:
    1. Key differences and similarities
    2. Business implications
    3. Recommendations for next steps
    
    Return a JSON array of insights as described previously.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const insights = JSON.parse(jsonMatch[0]);
        return insights;
      } catch (e) {
        console.error('Error parsing comparison insights JSON:', e);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error comparing analyses:', error);
    return [];
  }
}; 