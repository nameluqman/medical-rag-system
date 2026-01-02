/**
 * Medical RAG Backend Server
 * 
 * This server provides a backend API for the Medical RAG frontend.
 * It integrates with Gemini API to provide medical answers with sources.
 */

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configuration
const GEMINI_API_KEY = 'AIzaSyC_SDJhpFx2tV9CoxPAyT4aeFXmY-lmzH8'; // Your Gemini API key
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Medical sources database (mock - in production, this would come from a vector database)
const medicalSources = [
  {
    title: "National Institutes of Health (NIH) - Medical Encyclopedia",
    snippet: "Comprehensive resource from the U.S. National Library of Medicine, providing evidence-based information on diseases, conditions, and wellness.",
    url: "https://www.nih.gov/health/",
    relevance_score: 0.95,
    publication_date: "2024",
    authors: ["National Institutes of Health"]
  },
  {
    title: "Mayo Clinic - Medical Education and Research",
    snippet: "World-renowned medical practice offering clinical expertise, research, and education on healthcare and medicine.",
    url: "https://www.mayoclinic.org/",
    relevance_score: 0.92,
    publication_date: "2024",
    authors: ["Mayo Clinic Physicians and Scientists"]
  },
  {
    title: "WebMD - Medical Information",
    snippet: "Trusted online resource providing comprehensive health and medical information, symptom checker, and drug information.",
    url: "https://www.webmd.com/",
    relevance_score: 0.88,
    publication_date: "2024",
    authors: ["WebMD Medical Contributors"]
  },
  {
    title: "UpToDate - Clinical Decision Support",
    snippet: "Evidence-based clinical resource providing synthesized medical information to support point-of-care decisions.",
    url: "https://www.uptodate.com/",
    relevance_score: 0.90,
    publication_date: "2024",
    authors: ["UpToDate Contributors"]
  },
  {
    title: "Medscape - Drug Information Database",
    snippet: "Comprehensive database of prescription and over-the-counter medicines with detailed information on uses, side effects, and interactions.",
    url: "https://www.medscape.com/",
    relevance_score: 0.85,
    publication_date: "2024",
    authors: ["Medscape Contributors"]
  }
];

/**
 * Generate medical answer using Gemini API
 */
async function generateMedicalAnswer(question) {
  try {
    const requestBody = {
      contents: [{
        parts: [{
          text: `As a medical AI assistant, please provide a comprehensive and evidence-based answer to the following medical question: "${question}". 

          Please structure your response to include:
          1. A clear direct answer to the question
          2. Relevant medical context and background information
          3. Important considerations or warnings if applicable
          4. When to seek professional medical care

          Format your response in a clear, professional manner suitable for medical inquiries. Include relevant medical terminology but explain complex concepts in accessible language.`
        }]
      }],
      generationConfig: {
        temperature: 0.3, // Lower temperature for medical accuracy
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response to your medical question. Please try rephrasing or consult a healthcare professional.';
    
    return answer;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

/**
 * Select relevant sources based on question keywords
 */
function selectRelevantSources(question) {
  const keywords = question.toLowerCase().split(' ');
  const relevantSources = medicalSources
    .map(source => {
      let score = source.relevance_score;
      
      // Boost score based on keyword matches
      keywords.forEach(keyword => {
        if (source.title.toLowerCase().includes(keyword) || 
            source.snippet.toLowerCase().includes(keyword)) {
          score += 0.1;
        }
      });
      
      return { ...source, relevance_score: Math.min(score, 1.0) };
    })
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5); // Return top 5 sources
  
  return relevantSources;
}

/**
 * Main medical query endpoint
 */
app.post('/api/medical-query', async (req, res) => {
  try {
    console.log('Received medical query:', req.body);
    
    const { question, context, max_sources, temperature } = req.body;
    
    if (!question) {
      return res.status(400).json({ 
        error: 'Question is required' 
      });
    }

    // Generate answer using Gemini API
    const answer = await generateMedicalAnswer(question);
    
    // Select relevant sources
    const sources = selectRelevantSources(question);
    
    const response = {
      answer: answer,
      sources: sources.slice(0, max_sources || 5)
    };

    console.log('Generated response:', { answer: answer.substring(0, 100) + '...', sourcesCount: sources.length });
    
    res.json(response);
  } catch (error) {
    console.error('Error processing medical query:', error);
    res.status(500).json({ 
      error: 'Failed to process medical query',
      details: error.message 
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Medical RAG Backend'
  });
});

/**
 * Serve the frontend
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🏥 Medical RAG Backend Server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/medical-query`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});
