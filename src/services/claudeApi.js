class ClaudeApiService {
  constructor() {
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-sonnet-4-20250514';
  }

  async makeRequest(prompt, maxTokens = 2000) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      
      // Clean up any markdown formatting
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      return responseText;
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  }

  async analyzeMediaData(uploadedData) {
    const prompt = `
    As an expert media planner and data analyst, analyze this advertising campaign data and provide comprehensive insights.

    Campaign Data Headers: ${JSON.stringify(uploadedData.headers)}
    Sample Data Rows (first 10): ${JSON.stringify(uploadedData.rows.slice(0, 10))}
    Total Rows: ${uploadedData.rows.length}

    Please analyze this data and respond with a JSON object containing:
    {
      "overallPerformance": {
        "summary": "brief performance summary",
        "topChannels": ["channel1", "channel2", "channel3"],
        "keyMetrics": {
          "avgCTR": number,
          "avgCPM": number,
          "totalReach": number,
          "avgFrequency": number
        }
      },
      "channelAnalysis": [
        {
          "channel": "channel name",
          "performance": "excellent/good/poor",
          "metrics": {"ctr": number, "cpm": number, "reach": number},
          "insights": "key insights about this channel"
        }
      ],
      "demographicInsights": {
        "bestPerformingDemo": "demographic segment",
        "insights": "demographic analysis"
      },
      "optimizationOpportunities": [
        "opportunity 1",
        "opportunity 2",
        "opportunity 3"
      ]
    }

    Respond ONLY with valid JSON. Do not include any text outside the JSON structure.
    `;

    const response = await this.makeRequest(prompt);
    return JSON.parse(response);
  }

  async generateRecommendations(analysisData) {
    const prompt = `
    Based on this media campaign analysis, provide strategic recommendations for future campaigns.

    Analysis Results: ${JSON.stringify(analysisData)}

    Please respond with a JSON object containing:
    {
      "budgetReallocation": {
        "recommendations": [
          {"channel": "channel name", "currentBudget": number, "recommendedBudget": number, "reasoning": "explanation"}
        ]
      },
      "channelRecommendations": [
        {
          "channel": "channel name",
          "action": "increase/decrease/maintain/test",
          "reasoning": "detailed reasoning",
          "expectedImprovement": "percentage or metric improvement"
        }
      ],
      "targetingRecommendations": {
        "demographics": ["demo1", "demo2"],
        "geography": ["geo1", "geo2"],
        "reasoning": "targeting strategy explanation"
      },
      "creativeTesting": [
        "creative test suggestion 1",
        "creative test suggestion 2"
      ],
      "nextSteps": [
        {"action": "action item", "priority": "high/medium/low", "timeline": "timeframe"}
      ]
    }

    Respond ONLY with valid JSON.
    `;

    const response = await this.makeRequest(prompt);
    return JSON.parse(response);
  }
}

export default new ClaudeApiService();