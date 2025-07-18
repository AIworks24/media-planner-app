import React, { useState, useCallback } from 'react';
import { Upload, BarChart3, Target, TrendingUp, FileText, Download, Zap, Eye, MousePointer, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import claudeApi from '../services/claudeApi';
import { processCSVFile, validateMediaData, calculateBasicMetrics } from '../utils/dataProcessing';

const MediaPlannerApp = () => {
  const [uploadedData, setUploadedData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [error, setError] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  // Handle file upload and parsing
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setValidationResult(null);

    try {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        throw new Error('Please upload a CSV file containing your media campaign data.');
      }

      const processedData = await processCSVFile(file);
      const validation = validateMediaData(processedData);
      
      setUploadedData(processedData);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        setError(validation.suggestions);
      }
    } catch (error) {
      setError(error.message || 'Error processing file. Please try again.');
      console.error('File upload error:', error);
    }
  }, []);

  // AI Analysis using Claude
  const analyzeMediaData = async () => {
    if (!uploadedData) return;
    
    setIsAnalyzing(true);
    setActiveTab('analysis');
    setError(null);

    try {
      const analysisData = await claudeApi.analyzeMediaData(uploadedData);
      setAnalysisResults(analysisData);
      
      // Generate recommendations
      const recommendationsData = await claudeApi.generateRecommendations(analysisData);
      setRecommendations(recommendationsData);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Analysis failed: ${error.message}. Please check your data format and try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export results as JSON
  const exportResults = () => {
    const exportData = {
      uploadedData: uploadedData,
      analysisResults: analysisResults,
      recommendations: recommendations,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `media-analysis-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Sample data for visualization when no data is uploaded
  const sampleChannelData = [
    { channel: 'Facebook', ctr: 2.3, cpm: 15.50, reach: 45000 },
    { channel: 'Google Ads', ctr: 3.1, cpm: 12.30, reach: 38000 },
    { channel: 'TV', ctr: 1.8, cpm: 25.00, reach: 120000 },
    { channel: 'Radio', ctr: 1.2, cpm: 8.50, reach: 85000 },
    { channel: 'Billboard', ctr: 0.8, cpm: 5.20, reach: 200000 }
  ];

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Media Planner</h1>
                <p className="text-sm text-gray-600">Campaign Analysis & Optimization Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {(analysisResults || recommendations) && (
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Results</span>
                </button>
              )}
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-green-800 text-sm font-medium">✨ AI Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          {[
            { id: 'upload', label: 'Upload Data', icon: Upload },
            { id: 'analysis', label: 'Analysis', icon: BarChart3 },
            { id: 'recommendations', label: 'Recommendations', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Campaign Data</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your media campaign data</h3>
                <p className="text-gray-600 mb-6">
                  Upload CSV files containing metrics like CPM, CTR, reach, frequency, demographic data, etc.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer inline-flex items-center space-x-2 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choose CSV File</span>
                </label>
              </div>

              {validationResult && !validationResult.isValid && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Data Validation Warning</h4>
                      <p className="text-sm text-yellow-700 mt-1">{validationResult.suggestions}</p>
                      <p className="text-sm text-yellow-700 mt-2">
                        You can still proceed with analysis, but results may be limited.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {uploadedData && (
                <div className="mt-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">File uploaded successfully!</p>
                        <p className="text-sm text-green-700">
                          {uploadedData.filename} - {uploadedData.rows.length} rows of data
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Data Preview</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            {uploadedData.headers.slice(0, 6).map((header, idx) => (
                              <th key={idx} className="px-3 py-2 text-left font-medium text-gray-700">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uploadedData.rows.slice(0, 3).map((row, idx) => (
                            <tr key={idx} className="border-t">
                              {row.slice(0, 6).map((cell, cellIdx) => (
                                <td key={cellIdx} className="px-3 py-2 text-gray-600">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button
                    onClick={analyzeMediaData}
                    disabled={isAnalyzing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 inline-flex items-center space-x-2 transition-all transform hover:scale-105 disabled:transform-none"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Analyze with AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Sample Data Visualization */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sample Dashboard Preview</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Channel Performance (CTR %)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sampleChannelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="channel" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="ctr" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Reach Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sampleChannelData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="reach"
                        nameKey="channel"
                      >
                        {sampleChannelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {analysisResults ? (
              <>
                {/* Performance Overview */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Performance Overview</h2>
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <p className="text-gray-800">{analysisResults.overallPerformance.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(analysisResults.overallPerformance.keyMetrics).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channel Analysis */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Performance Analysis</h3>
                  <div className="space-y-4">
                    {analysisResults.channelAnalysis.map((channel, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{channel.channel}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            channel.performance === 'excellent' ? 'bg-green-100 text-green-800' :
                            channel.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {channel.performance}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{channel.insights}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {Object.entries(channel.metrics).map(([metric, value]) => (
                            <div key={metric} className="text-center">
                              <div className="font-medium text-gray-900">{value}</div>
                              <div className="text-gray-500 capitalize">{metric}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Demographics & Opportunities */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Demographic Insights</h3>
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                      <div className="font-medium text-green-900 mb-2">
                        Best Performing: {analysisResults.demographicInsights.bestPerformingDemo}
                      </div>
                      <p className="text-green-800 text-sm">
                        {analysisResults.demographicInsights.insights}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Optimization Opportunities</h3>
                    <div className="space-y-3">
                      {analysisResults.optimizationOpportunities.map((opportunity, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{opportunity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
                <p className="text-gray-600">Upload your campaign data and run analysis to see detailed insights here.</p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {recommendations ? (
              <>
                {/* Budget Reallocation */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Budget Reallocation Recommendations</h2>
                  <div className="space-y-4">
                    {recommendations.budgetReallocation.recommendations.map((rec, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{rec.channel}</h4>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                              ${rec.currentBudget.toLocaleString()} → ${rec.recommendedBudget.toLocaleString()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.recommendedBudget > rec.currentBudget ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {rec.recommendedBudget > rec.currentBudget ? '+' : ''}
                              {Math.round(((rec.recommendedBudget - rec.currentBudget) / rec.currentBudget) * 100)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{rec.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channel Recommendations */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Strategy Recommendations</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {recommendations.channelRecommendations.map((rec, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{rec.channel}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            rec.action === 'increase' ? 'bg-green-100 text-green-800' :
                            rec.action === 'decrease' ? 'bg-red-100 text-red-800' :
                            rec.action === 'test' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {rec.action}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{rec.reasoning}</p>
                        <div className="text-xs text-blue-600 font-medium">
                          Expected: {rec.expectedImprovement}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Targeting & Creative */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Targeting Recommendations</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Demographics</h4>
                        <div className="flex flex-wrap gap-2">
                          {recommendations.targetingRecommendations.demographics.map((demo, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {demo}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Geography</h4>
                        <div className="flex flex-wrap gap-2">
                          {recommendations.targetingRecommendations.geography.map((geo, idx) => (
                            <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              {geo}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{recommendations.targetingRecommendations.reasoning}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Creative Testing</h3>
                    <div className="space-y-3">
                      {recommendations.creativeTesting.map((test, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <Eye className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{test}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps & Action Items</h3>
                  <div className="space-y-3">
                    {recommendations.nextSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          step.priority === 'high' ? 'bg-red-500' :
                          step.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{step.action}</p>
                          <p className="text-sm text-gray-600">Timeline: {step.timeline}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          step.priority === 'high' ? 'bg-red-100 text-red-800' :
                          step.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {step.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h3>
                <p className="text-gray-600">Complete the analysis step to receive AI-powered campaign recommendations.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPlannerApp;