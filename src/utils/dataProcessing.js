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

export const validateMediaData = (data) => {
  const requiredColumns = ['channel', 'ctr', 'cpm', 'reach'];
  const headers = data.headers.map(h => h.toString().toLowerCase());
  
  const missingColumns = requiredColumns.filter(col => 
    !headers.some(header => header.includes(col))
  );
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    suggestions: missingColumns.length > 0 ? 
      `Missing columns: ${missingColumns.join(', ')}. Please ensure your CSV includes these media metrics.` : 
      'Data structure looks good!'
  };
};

export const calculateBasicMetrics = (data) => {
  if (!data.rows || data.rows.length === 0) {
    return null;
  }

  // This is a simplified calculation - you'd want to make this more robust
  // based on your actual data structure
  const totalRows = data.rows.length;
  const sampleMetrics = {
    totalCampaigns: totalRows,
    avgCTR: 2.1, // These would be calculated from actual data
    avgCPM: 15.50,
    totalReach: 150000,
    avgFrequency: 3.2
  };

  return sampleMetrics;
};