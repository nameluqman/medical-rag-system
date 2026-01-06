#Preview

https://medical-rag-system.vercel.app/
# Medical RAG System

A responsive web application for Retrieval-Augmented Generation (RAG) of medical information. This frontend-only implementation provides a clean, accessible interface for asking medical questions and receiving AI-generated answers backed by reliable medical sources.

## 🏥 Features

- **Mobile-First Responsive Design**: Optimized for all devices with accessibility-friendly medical UI
- **Evidence-Based Answers**: AI-generated responses based on retrieved medical documents
- **Source Transparency**: Displays retrieved sources with relevance scores and metadata
- **Clean Medical Interface**: Professional healthcare design with safe colors and accessibility features
- **Loading States & Error Handling**: Robust user experience with proper feedback
- **Educational Disclaimer**: Clear medical disclaimer for educational use only

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation

1. **Clone or download the project files**
   ```bash
   # If using git
   git clone <repository-url>
   cd medical-rag-system
   ```

2. **Open the application**
   - Simply open `index.html` in your web browser
   - For development, use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve .
     
     # Using PHP
     php -S localhost:8000
     ```

3. **Access the application**
   - Navigate to `http://localhost:8000` (if using a server)
   - Or directly open `index.html` in your browser

## 📁 Project Structure

```
medical-rag-system/
├── index.html          # Main HTML file with all pages
├── styles.css          # Mobile-first responsive CSS with medical theme
├── app.js             # Modular JavaScript application
├── README.md          # This file
└── assets/            # Static assets (if any)
```

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#0066cc` - Professional medical blue
- **Medical Green**: `#00a86b` - Health and wellness
- **Alert Orange**: `#ff6b35` - Warnings and disclaimers
- **Neutral Grays**: Various shades for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts) with system fallbacks
- **Sizes**: Responsive scaling from mobile to desktop
- **Accessibility**: WCAG AA compliant contrast ratios

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔧 Configuration

### Frontend Configuration

The application can be configured by modifying the `CONFIG` object in `app.js`:

```javascript
const CONFIG = {
  API_ENDPOINT: 'https://api.medical-rag.com/v1/query',  // Your backend API
  MOCK_MODE: true,                                        // Enable/disable mock responses
  REQUEST_TIMEOUT: 30000,                                 // API request timeout (ms)
  SEARCH_DEBOUNCE_DELAY: 300,                            // Input debounce delay (ms)
  MAX_RETRIES: 2,                                         // Maximum retry attempts
  ANIMATION_DURATION: 300                                 // UI animation duration (ms)
};
```

### Mock Mode

The application includes a fully functional mock mode for development and testing:

- **Enabled by default**: `MOCK_MODE: true`
- **Simulates API responses**: Realistic delays and varied answers
- **No backend required**: Perfect for frontend development
- **Easy to disable**: Set `MOCK_MODE: false` when connecting to real backend

## 🔌 Backend Integration

### API Endpoint

The frontend expects a REST API endpoint with the following specifications:

#### Request
```http
POST /v1/query
Content-Type: application/json

{
  "question": "What are the symptoms of diabetes?",
  "context": "medical",
  "max_sources": 5,
  "temperature": 0.3
}
```

#### Response
```json
{
  "answer": "Diabetes mellitus is a chronic metabolic disorder...",
  "sources": [
    {
      "title": "Current Medical Diagnosis & Treatment",
      "snippet": "A comprehensive guide to evidence-based medical practice...",
      "url": "https://example.com/source1",
      "relevance_score": 0.95,
      "publication_date": "2024",
      "authors": ["McPhee SJ", "Papadakis MA"]
    }
  ]
}
```

### RAG Backend Architecture

To connect this frontend to a real RAG backend, you'll need:

#### 1. Vector Database
- **Purpose**: Store and retrieve medical document embeddings
- **Options**: Pinecone, Weaviate, Chroma, FAISS
- **Data**: Medical literature, guidelines, research papers

#### 2. Embedding Model
- **Purpose**: Convert text to vector representations
- **Options**: OpenAI embeddings, Sentence Transformers, Medical BERT
- **Considerations**: Medical domain specificity

#### 3. LLM Service
- **Purpose**: Generate answers based on retrieved context
- **Options**: OpenAI GPT-4, Anthropic Claude, Llama 2, Medical-specific models
- **Configuration**: Lower temperature for medical accuracy

#### 4. Backend Framework
- **Python**: FastAPI, Flask, Django
- **Node.js**: Express, NestJS
- **Other**: Go, Java Spring Boot

### Example Backend Implementation (Python/FastAPI)

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
from sentence_transformers import SentenceTransformer
import pinecone

app = FastAPI()

class QueryRequest(BaseModel):
    question: str
    context: str = "medical"
    max_sources: int = 5
    temperature: float = 0.3

class QueryResponse(BaseModel):
    answer: str
    sources: list

@app.post("/v1/query", response_model=QueryResponse)
async def query_medical(request: QueryRequest):
    try:
        # 1. Generate embedding for question
        embedding_model = SentenceTransformer('medical-bert')
        question_embedding = embedding_model.encode(request.question)
        
        # 2. Retrieve relevant documents from vector DB
        relevant_docs = retrieve_documents(question_embedding, request.max_sources)
        
        # 3. Generate answer using LLM
        context = "\n".join([doc['content'] for doc in relevant_docs])
        answer = generate_answer(request.question, context, request.temperature)
        
        # 4. Format response
        sources = format_sources(relevant_docs)
        
        return QueryResponse(answer=answer, sources=sources)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def retrieve_documents(embedding, max_sources):
    # Query vector database
    # Implementation depends on your vector DB choice
    pass

def generate_answer(question, context, temperature):
    # Use LLM to generate answer
    # Implementation depends on your LLM choice
    pass

def format_sources(documents):
    # Format documents for frontend
    pass
```

## 🧪 Testing

### Frontend Testing

1. **Manual Testing**
   - Open `index.html` in different browsers
   - Test responsive design at different screen sizes
   - Verify accessibility features

2. **Mock Mode Testing**
   - Ensure `MOCK_MODE: true` in `app.js`
   - Test various medical questions
   - Verify loading states and error handling

3. **Backend Integration Testing**
   - Set `MOCK_MODE: false`
   - Configure `API_ENDPOINT`
   - Test with real backend

### Automated Testing (Optional)

```bash
# Install testing dependencies
npm install --save-dev jest jsdom @testing-library/dom

# Run tests
npm test
```

## 🔒 Security Considerations

### Frontend Security
- **XSS Prevention**: HTML escaping for user-generated content
- **CSRF Protection**: Implement if using cookies for authentication
- **Input Validation**: Client-side validation for all inputs

### Backend Security (When Implemented)
- **API Authentication**: JWT tokens, API keys
- **Rate Limiting**: Prevent abuse
- **Input Sanitization**: Validate all incoming data
- **HTTPS**: Encrypt all communications

## 📱 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Features Used**: ES6+, CSS Grid, Flexbox, Fetch API

## 🚀 Deployment

### Static Hosting (Frontend Only)

Deploy the frontend to any static hosting service:

1. **Netlify**
   ```bash
   # Deploy to Netlify
   netlify deploy --prod --dir .
   ```

2. **Vercel**
   ```bash
   # Deploy to Vercel
   vercel --prod
   ```

3. **GitHub Pages**
   - Push to GitHub repository
   - Enable GitHub Pages in repository settings

### Full-Stack Deployment

For a complete RAG system:

1. **Frontend**: Deploy to static hosting (Netlify, Vercel, etc.)
2. **Backend**: Deploy to cloud platform (AWS, Google Cloud, Azure)
3. **Vector DB**: Use managed service (Pinecone, Weaviate Cloud)
4. **LLM API**: Use OpenAI, Anthropic, or self-hosted models

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Medical Disclaimer

**IMPORTANT**: This system is for educational purposes only and not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers for medical concerns.

## 🙋‍♂️ Support

For questions or support:

1. **Frontend Issues**: Check this README and code comments
2. **Backend Integration**: See "Backend Integration" section
3. **General Questions**: Open an issue in the repository

## 🔮 Future Enhancements

- **Real Backend Integration**: Connect to actual medical RAG system
- **User Authentication**: Personalized medical history
- **Advanced Filtering**: Filter by medical specialty, date range
- **Citation Management**: Proper medical citation formatting
- **Multilingual Support**: Multiple language support
- **Voice Input**: Speech-to-text for medical questions
- **Offline Mode**: PWA capabilities for offline use

---

**Built with ❤️ for better medical information access**
