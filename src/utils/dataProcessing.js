import Papa from 'papaparse';

export const processCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const processedData = {
            filename: file.name,
            data: results.data,
            headers: results.data[0] || [],
            rows: results.data.slice(1) || [],
            errors: results.errors
          };
          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
      header: false,
      skipEmptyLines: true,
      dynamicTyping: true
    });
  });
};

// Enhanced column mapping for flexible data handling
const COLUMN_MAPPINGS = {
  // Channel/Platform identifiers
  channel: [
    'channel', 'platform', 'media', 'source', 'campaign_type', 'ad_platform',
    'advertising_channel', 'media_channel', 'placement', 'vendor'
  ],
  
  // Click-through rate variations
  ctr: [
    'ctr', 'click_through_rate', 'click-through-rate', 'clickthrough_rate',
    'click_rate', 'clicks_per_impression', 'click_percentage', 'ctr_%', 'ctr%',
    'click_thru_rate', 'engagement_rate'
  ],
  
  // Cost per mille/thousand variations
  cpm: [
    'cpm', 'cost_per_mille', 'cost_per_thousand', 'cost_per_1000',
    'cost_per_1k', 'cpt', 'cost_per_impression', 'impression_cost',
    'cost_per_m', 'cost_per_thousand_impressions', 'cpm_cost'
  ],
  
  // Reach variations
  reach: [
    'reach', 'total_reach', 'unique_reach', 'audience_reach', 'people_reached',
    'unique_users', 'total_audience', 'impressions_reach', 'unduplicated_reach',
    'net_reach', 'coverage'
  ],
  
  // Frequency variations
  frequency: [
    'frequency', 'avg_frequency', 'average_frequency', 'freq', 'impression_frequency',
    'contact_frequency', 'exposure_frequency', 'frequency_avg', 'times_seen'
  ],
  
  // Impressions variations
  impressions: [
    'impressions', 'total_impressions', 'impression', 'views', 'total_views',
    'ad_impressions', 'served_impressions', 'delivered_impressions'
  ],
  
  // Clicks variations
  clicks: [
    'clicks', 'total_clicks', 'click', 'link_clicks', 'ad_clicks',
    'click_count', 'clickthroughs'
  ],
  
  // Cost variations
  cost: [
    'cost', 'total_cost', 'spend', 'budget', 'investment', 'media_cost',
    'advertising_cost', 'campaign_cost', 'total_spend', 'amount_spent'
  ],
  
  // Budget variations
  budget: [
    'budget', 'planned_budget', 'allocated_budget', 'budget_allocation',
    'investment', 'spend_target', 'budget_amount'
  ],
  
  // Demographic variations
  demographic: [
    'demographic', 'demo', 'age_group', 'target_demo', 'audience',
    'age_range', 'demo_group', 'target_audience', 'segment'
  ],
  
  // Geography variations
  geography: [
    'geography', 'geo', 'location', 'region', 'market', 'area',
    'territory', 'geographic_area', 'locale', 'city', 'state', 'country'
  ],
  
  // Date/Time variations
  date: [
    'date', 'time', 'period', 'week', 'month', 'quarter', 'campaign_date',
    'flight_date', 'run_date', 'start_date', 'end_date'
  ]
};

// Function to normalize column names and find matches
const findColumnMatch = (headers, targetColumn) => {
  const normalizedHeaders = headers.map(h => h.toString().toLowerCase().trim().replace(/\s+/g, '_'));
  const possibleNames = COLUMN_MAPPINGS[targetColumn] || [];
  
  for (let possibleName of possibleNames) {
    const normalizedPossible = possibleName.toLowerCase().trim();
    const matchIndex = normalizedHeaders.findIndex(header => 
      header === normalizedPossible || 
      header.includes(normalizedPossible) ||
      normalizedPossible.includes(header) ||
      // Handle percentage symbols
      header.replace(/%/g, '').includes(normalizedPossible) ||
      // Handle underscores and dashes
      header.replace(/[-_]/g, '').includes(normalizedPossible.replace(/[-_]/g, ''))
    );
    
    if (matchIndex !== -1) {
      return {
        found: true,
        originalName: headers[matchIndex],
        index: matchIndex,
        mappedTo: targetColumn
      };
    }
  }
  
  return { found: false, originalName: null, index: -1, mappedTo: targetColumn };
};

// Enhanced validation that's much more flexible
export const validateMediaData = (data) => {
  if (!data.headers || data.headers.length === 0) {
    return {
      isValid: false,
      missingColumns: [],
      suggestions: 'No headers found in the CSV file. Please ensure the first row contains column headers.',
      columnMappings: {},
      recommendedColumns: []
    };
  }

  // Core columns we ideally want (but don't require all)
  const idealColumns = ['channel', 'ctr', 'cpm', 'reach', 'frequency', 'impressions', 'clicks', 'cost'];
  const foundMappings = {};
  const missingColumns = [];
  const foundColumns = [];

  // Try to map each ideal column
  idealColumns.forEach(column => {
    const match = findColumnMatch(data.headers, column);
    if (match.found) {
      foundMappings[column] = match;
      foundColumns.push(column);
    } else {
      missingColumns.push(column);
    }
  });

  // We're flexible - if we have at least 2 columns that could be useful, we're good
  const hasMinimumData = foundColumns.length >= 2;
  
  // Special case: if we have any channel/platform identifier, that's great
  const hasChannelData = foundMappings.channel || 
    data.headers.some(h => h.toString().toLowerCase().includes('platform') || 
                          h.toString().toLowerCase().includes('source'));

  return {
    isValid: hasMinimumData,
    missingColumns: missingColumns,
    foundColumns: foundColumns,
    columnMappings: foundMappings,
    suggestions: hasMinimumData ? 
      `Great! Found ${foundColumns.length} relevant columns. The AI can analyze this data.` :
      `Found ${foundColumns.length} relevant columns. For best results, include columns for channel, metrics like CTR/CPM, and performance data.`,
    hasChannelData: hasChannelData,
    recommendedColumns: foundColumns,
    dataQuality: hasMinimumData ? (foundColumns.length >= 4 ? 'excellent' : 'good') : 'limited'
  };
};

// Enhanced basic metrics calculation using flexible column mapping
export const calculateBasicMetrics = (data) => {
  if (!data.rows || data.rows.length === 0) {
    return null;
  }

  const validation = validateMediaData(data);
  const mappings = validation.columnMappings;
  
  try {
    let totalRows = data.rows.length;
    let metrics = {
      totalCampaigns: totalRows,
      totalRows: totalRows,
      columnsFound: validation.foundColumns,
      dataQuality: validation.dataQuality
    };

    // Calculate metrics based on what columns we actually found
    if (mappings.ctr) {
      const ctrValues = data.rows
        .map(row => parseFloat(row[mappings.ctr.index]))
        .filter(val => !isNaN(val) && val > 0);
      
      if (ctrValues.length > 0) {
        metrics.avgCTR = (ctrValues.reduce((sum, val) => sum + val, 0) / ctrValues.length).toFixed(2);
        metrics.maxCTR = Math.max(...ctrValues).toFixed(2);
        metrics.minCTR = Math.min(...ctrValues).toFixed(2);
      }
    }

    if (mappings.cpm) {
      const cpmValues = data.rows
        .map(row => parseFloat(row[mappings.cpm.index]))
        .filter(val => !isNaN(val) && val > 0);
      
      if (cpmValues.length > 0) {
        metrics.avgCPM = (cpmValues.reduce((sum, val) => sum + val, 0) / cpmValues.length).toFixed(2);
        metrics.maxCPM = Math.max(...cpmValues).toFixed(2);
        metrics.minCPM = Math.min(...cpmValues).toFixed(2);
      }
    }

    if (mappings.reach) {
      const reachValues = data.rows
        .map(row => parseInt(row[mappings.reach.index]))
        .filter(val => !isNaN(val) && val > 0);
      
      if (reachValues.length > 0) {
        metrics.totalReach = reachValues.reduce((sum, val) => sum + val, 0);
        metrics.avgReach = Math.round(metrics.totalReach / reachValues.length);
      }
    }

    if (mappings.frequency) {
      const freqValues = data.rows
        .map(row => parseFloat(row[mappings.frequency.index]))
        .filter(val => !isNaN(val) && val > 0);
      
      if (freqValues.length > 0) {
        metrics.avgFrequency = (freqValues.reduce((sum, val) => sum + val, 0) / freqValues.length).toFixed(1);
      }
    }

    if (mappings.cost) {
      const costValues = data.rows
        .map(row => parseFloat(row[mappings.cost.index]))
        .filter(val => !isNaN(val) && val > 0);
      
      if (costValues.length > 0) {
        metrics.totalCost = costValues.reduce((sum, val) => sum + val, 0);
        metrics.avgCost = (metrics.totalCost / costValues.length).toFixed(2);
      }
    }

    return metrics;

  } catch (error) {
    console.error('Error calculating metrics:', error);
    return {
      totalCampaigns: totalRows,
      error: 'Could not calculate metrics, but data can still be analyzed'
    };
  }
};

// Function to get a user-friendly summary of what was found in the data
export const getDataSummary = (data) => {
  const validation = validateMediaData(data);
  const metrics = calculateBasicMetrics(data);
  
  return {
    isReady: validation.isValid,
    quality: validation.dataQuality,
    summary: `Found ${validation.foundColumns.length} relevant columns in ${data.rows.length} rows of data.`,
    details: {
      foundColumns: validation.foundColumns,
      mappings: validation.columnMappings,
      metrics: metrics,
      suggestions: validation.suggestions
    }
  };
};

// Helper function to format data for AI analysis with flexible column mapping
export const prepareDataForAI = (data) => {
  const validation = validateMediaData(data);
  
  return {
    originalHeaders: data.headers,
    mappedColumns: validation.columnMappings,
    foundColumns: validation.foundColumns,
    dataQuality: validation.dataQuality,
    sampleRows: data.rows.slice(0, 10), // Send first 10 rows as sample
    totalRows: data.rows.length,
    basicMetrics: calculateBasicMetrics(data),
    hasChannelData: validation.hasChannelData
  };
};
