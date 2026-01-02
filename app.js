/**
 * Medical RAG System - ChatGPT Style Interface
 * 
 * This is a frontend-only implementation of a medical RAG (Retrieval-Augmented Generation) system.
 * It provides a ChatGPT-like interface with continuous conversation flow.
 * 
 * Architecture:
 * - Modular JavaScript with separate concerns
 * - API integration layer for backend communication
 * - State management for chat conversations
 * - Error handling and loading states
 * 
 * Backend Integration Points:
 * 1. API_ENDPOINT: Where to send medical queries
 * 2. Vector Database: For document retrieval (backend)
 * 3. LLM Service: For answer generation (backend)
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // API endpoint for RAG backend
  // Using mock responses only - no external API
  API_ENDPOINT: 'https://api.medical-rag.com/v1/query', // Mock endpoint
  
  // Mock mode for development (set to true to use mock responses)
  MOCK_MODE: true, // Always use mock responses
  
  // Request timeout in milliseconds
  REQUEST_TIMEOUT: 30000,
  
  // Debounce delay for search input (milliseconds)
  SEARCH_DEBOUNCE_DELAY: 300,
  
  // Maximum number of retry attempts
  MAX_RETRIES: 2,
  
  // Animation durations
  ANIMATION_DURATION: 300
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

class AppState {
  constructor() {
    this.currentPage = 'chat';
    this.conversation = [];
    this.isLoading = false;
    this.error = null;
    this.retryCount = 0;
  }

  setPage(page) {
    this.currentPage = page;
    this.notifyStateChange();
  }

  addMessage(role, content, sources = null) {
    const message = {
      role,
      content,
      sources,
      timestamp: new Date().toISOString()
    };
    
    this.conversation.push(message);
    this.notifyStateChange();
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.notifyStateChange();
  }

  setError(error) {
    this.error = error;
    this.notifyStateChange();
  }

  clearError() {
    this.error = null;
    this.notifyStateChange();
  }

  notifyStateChange() {
    window.dispatchEvent(new CustomEvent('stateChange', { 
      detail: { 
        page: this.currentPage,
        conversation: this.conversation,
        loading: this.isLoading,
        error: this.error
      } 
    }));
  }
}

// =============================================================================
// API SERVICE
// =============================================================================

class ApiService {
  constructor() {
    this.endpoint = CONFIG.API_ENDPOINT;
  }

  /**
   * Send medical query to RAG backend
   * @param {string} question - Medical question to answer
   * @returns {Promise<Object>} Response with answer and sources
   */
  async queryMedical(question) {
    if (CONFIG.MOCK_MODE) {
      return this.getMockResponse(question);
    }

    // Backend API Implementation
    const requestBody = {
      question: question,
      context: 'medical',
      max_sources: 5,
      temperature: 0.3  // Lower temperature for medical accuracy
    };

    try {
      console.log('Making API request to:', CONFIG.API_ENDPOINT);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Validate and return response
      return this.validateResponse(data);
    } catch (error) {
      console.error('API Request Error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Validate API response structure
   * @param {Object} data - API response data
   * @returns {Object} Validated response
   */
  validateResponse(data) {
    if (!data.answer || !Array.isArray(data.sources)) {
      throw new Error('Invalid response format from server');
    }

    return {
      answer: data.answer,
      sources: data.sources.map(source => ({
        title: source.title || 'Untitled Source',
        snippet: source.snippet || source.content || '',
        url: source.url || '#',
        relevance_score: source.relevance_score || 0,
        publication_date: source.publication_date || null,
        authors: source.authors || []
      }))
    };
  }

  /**
   * Mock response for development/testing
   * @param {string} question - The medical question
   * @returns {Object} Mock response
   */
  getMockResponse(question) {
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          answer: this.generateMockAnswer(question),
          sources: this.generateMockSources(question)
        });
      }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay
    });
  }

  /**
   * Generate mock answer based on question keywords
   * @param {string} question - Medical question
   * @returns {string} Generated answer
   */
  generateMockAnswer(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('diabetes')) {
      return `Diabetes mellitus is a chronic metabolic disorder characterized by elevated blood glucose levels. The main symptoms include increased thirst (polydipsia), frequent urination (polyuria), unexplained weight loss, fatigue, and blurred vision.

There are several types of diabetes:
- Type 1 diabetes: Autoimmune condition where the body doesn't produce insulin
- Type 2 diabetes: Insulin resistance with relative insulin deficiency
- Gestational diabetes: Develops during pregnancy

Diagnosis typically involves blood tests including fasting plasma glucose, oral glucose tolerance test, and HbA1c levels. Early detection and proper management are crucial for preventing complications such as cardiovascular disease, kidney damage, and nerve problems.

Treatment varies by type but may include lifestyle modifications, oral medications, and insulin therapy. Regular monitoring of blood glucose levels and routine medical check-ups are essential for optimal diabetes management.`;
    } else if (lowerQuestion.includes('hypertension') || lowerQuestion.includes('high blood pressure')) {
      return `Hypertension, or high blood pressure, is a common medical condition where the force of blood against artery walls is consistently too high. It's often called the "silent killer" because it typically has no symptoms in early stages.

Blood pressure is measured as two numbers: systolic (top) and diastolic (bottom). Normal blood pressure is typically below 120/80 mmHg. Hypertension is diagnosed when readings consistently exceed 130/80 mmHg.

Treatment approaches include:
- Lifestyle modifications: reduced sodium intake, regular exercise, weight management, stress reduction
- Medications: diuretics, ACE inhibitors, ARBs, beta-blockers, calcium channel blockers
- Regular monitoring of blood pressure at home

Untreated hypertension can lead to serious complications including heart attack, stroke, kidney disease, and vision problems. Regular medical follow-up is essential for effective management.`;
    } else if (lowerQuestion.includes('migraine')) {
      return `Migraines are a neurological condition characterized by intense, debilitating headaches often accompanied by other symptoms. They typically affect one side of the head and can last from hours to days.

Common symptoms include:
- Throbbing or pulsing pain
- Sensitivity to light, sound, and sometimes smells
- Nausea and vomiting
- Visual disturbances (aura) in some cases
- Fatigue before and after attacks

Triggers vary by individual but may include stress, hormonal changes, certain foods, lack of sleep, and environmental factors. Treatment options include:
- Acute medications: triptans, NSAIDs, anti-nausea medications
- Preventive medications: beta-blockers, antidepressants, anti-seizure drugs
- Lifestyle modifications: regular sleep schedule, stress management, trigger avoidance

Keeping a headache diary can help identify patterns and triggers, enabling more effective management strategies.`;
    } else {
      return `Based on current medical literature and clinical guidelines, this medical question requires careful consideration of multiple factors. The answer would typically involve:

1. **Pathophysiology**: Understanding the underlying biological mechanisms and processes involved in the condition.

2. **Clinical Presentation**: Common signs and symptoms that healthcare providers observe, including variations among different patient populations.

3. **Diagnostic Criteria**: Standardized methods and tests used to identify and confirm the condition, including differential diagnosis considerations.

4. **Treatment Options**: Evidence-based approaches ranging from lifestyle modifications to pharmacological interventions, with consideration of benefits, risks, and contraindications.

5. **Prevention Strategies**: Measures that can reduce risk or prevent complications, including patient education and regular monitoring.

6. **Prognosis**: Expected outcomes and potential complications if left untreated or poorly managed.`;
    }
  }

  /**
   * Generate mock sources for the answer
   * @param {string} question - Medical question
   * @returns {Array} Array of mock sources
   */
  generateMockSources(question) {
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

    // Return 3-5 relevant sources based on question keywords
    return medicalSources.slice(0, 3 + Math.floor(Math.random() * 3));
  }
}

// =============================================================================
// UI CONTROLLER
// =============================================================================

class UIController {
  constructor() {
    this.elements = this.initializeElements();
    this.bindEvents();
  }

  /**
   * Initialize DOM element references
   * @returns {Object} Element references
   */
  initializeElements() {
    return {
      // Pages
      pages: {
        chat: document.getElementById('chat-interface'),
        about: document.getElementById('about-page')
      },
      
      // Navigation
      navLinks: document.querySelectorAll('.nav-link'),
      
      // Chat elements
      welcomeMessage: document.getElementById('welcome-message'),
      conversationContainer: document.getElementById('conversation-container'),
      
      // Chat input elements
      chatForm: document.getElementById('search-form'),
      chatInput: document.getElementById('search-input'),
      sendButton: document.getElementById('send-button'),
      voiceButton: document.getElementById('voice-button'),
      
      // API configuration display
      apiConfig: document.getElementById('api-config')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Navigation
    this.elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const page = e.target.dataset.page;
        if (page) {
          window.app.navigateToPage(page);
        }
      });
    });

    // Chat form submission
    this.elements.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleChatSubmit();
    });

    // Input focus/blur effects
    this.elements.chatInput.addEventListener('focus', () => {
      this.elements.welcomeMessage.classList.add('hidden');
      const container = this.elements.chatInput.closest('.chat-input-container');
      if (container) {
        container.classList.add('focus-within');
      }
    });

    this.elements.chatInput.addEventListener('blur', () => {
      const container = this.elements.chatInput.closest('.chat-input-container');
      if (container) {
        container.classList.remove('focus-within');
      }
    });

    // Auto-resize textarea
    this.elements.chatInput.addEventListener('input', () => {
      this.autoResizeInput();
    });

    // Voice button (future feature)
    this.elements.voiceButton.addEventListener('click', () => {
      this.showNotification('Voice input coming soon! This feature will allow you to speak your medical questions directly.');
    });

    // State change listener
    window.addEventListener('stateChange', (e) => {
      this.handleStateChange(e.detail);
    });
  }

  /**
   * Handle chat form submission
   */
  handleChatSubmit() {
    const question = this.elements.chatInput.value.trim();
    
    if (!question) {
      return;
    }

    window.app.askMedicalQuestion(question);
    this.elements.chatInput.value = '';
    this.autoResizeInput();
  }

  /**
   * Auto-resize input based on content
   */
  autoResizeInput() {
    try {
      const input = this.elements.chatInput;
      if (input) {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      }
    } catch (error) {
      console.error('Auto-resize error:', error);
    }
  }

  /**
   * Handle state changes
   * @param {Object} state - Current app state
   */
  handleStateChange(state) {
    this.updatePageVisibility(state.page);
    this.updateConversation(state.conversation);
    this.updateLoadingState(state.loading);
    this.updateNavigation(state.page);
  }

  /**
   * Update page visibility
   * @param {string} activePage - Currently active page
   */
  updatePageVisibility(activePage) {
    Object.keys(this.elements.pages).forEach(page => {
      this.elements.pages[page].classList.toggle('active', page === activePage);
    });
  }

  /**
   * Update navigation active state
   * @param {string} activePage - Currently active page
   */
  updateNavigation(activePage) {
    this.elements.navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === activePage);
    });
  }

  /**
   * Update conversation display
   * @param {Array} conversation - Array of messages
   */
  updateConversation(conversation) {
    // Clear existing messages
    this.elements.conversationContainer.innerHTML = '';

    // Hide welcome message after first user message
    const hasUserMessage = conversation.some(msg => msg.role === 'user');
    this.elements.welcomeMessage.classList.toggle('hidden', hasUserMessage);

    // Add all messages
    conversation.forEach(message => {
      if (message.role === 'loading') {
        this.addLoadingMessage();
      } else {
        this.addMessageToUI(message);
      }
    });

    // Scroll to top to show answers from the beginning
    this.scrollToTop();
  }

  /**
   * Show notification message
   * @param {string} message - Message to display
   */
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: var(--primary-color);
      color: white;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 10001;
      font-size: var(--font-size-base);
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }, 100);
  }

  /**
   * Update chat history display
   * @param {Array} chatHistory - Array of chat history items
   * @param {string} currentChatId - Current active chat ID
   */
  updateChatHistory(chatHistory, currentChatId) {
    this.elements.chatHistory.innerHTML = '';
    
    if (chatHistory.length === 0) {
      this.elements.chatHistory.innerHTML = `
        <div class="chat-history-empty">
          <p style="color: var(--text-muted); font-size: var(--font-size-sm); text-align: center; padding: var(--spacing-md);">
            No previous conversations
          </p>
        </div>
      `;
      return;
    }
    
    chatHistory.forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.className = 'chat-history-item';
      chatItem.classList.toggle('active', chat.id === currentChatId);
      
      const date = new Date(chat.timestamp);
      const timeString = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      chatItem.innerHTML = `
        <div class="chat-history-item-title">${this.escapeHtml(chat.title)}</div>
        <div class="chat-history-item-preview">${this.escapeHtml(chat.preview)}</div>
        <div class="chat-history-item-time">${timeString} • ${chat.messageCount} messages</div>
      `;
      
      chatItem.addEventListener('click', () => {
        window.app.state.loadChat(chat.id);
      });
      
      this.elements.chatHistory.appendChild(chatItem);
    });
  }  

  /**
   * Format message HTML
   * @param {Object} message - Message object
   * @returns {string} Formatted HTML
   */
  formatMessage(message) {
    const avatar = message.role === 'user' ? 'You' : 'AI';
    const time = new Date(message.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let contentHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-text">${this.escapeHtml(message.content)}</div>
        <div class="message-time">${time}</div>
    `;

    // Add sources if available
    if (message.sources && message.sources.length > 0) {
      contentHTML += this.formatSources(message.sources);
    }

    contentHTML += '</div>';
    return contentHTML;
  }

  /**
   * Format sources for message
   * @param {Array} sources - Array of source objects
   * @returns {string} Formatted HTML
   */
  formatSources(sources) {
    const sourcesHTML = sources.map(source => `
      <div class="message-source-item">
        <div class="message-source-title">
          <a href="${source.url || '#'}" target="_blank" rel="noopener noreferrer" class="source-link">
            ${this.escapeHtml(source.title)}
          </a>
        </div>
        <div class="message-source-snippet">${this.escapeHtml(source.snippet)}</div>
        <div class="message-source-meta">
          <span class="source-meta-item">
            Relevance: ${Math.round(source.relevance_score * 100)}%
          </span>
          ${source.publication_date ? `
            <span class="source-meta-item">
              Published: ${source.publication_date}
            </span>
          ` : ''}
          ${source.authors.length > 0 ? `
            <span class="source-meta-item">
              Authors: ${source.authors.join(', ')}
            </span>
          ` : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="message-sources">
        <div class="message-sources-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Sources
        </div>
        <div class="message-sources-list">
          ${sourcesHTML}
        </div>
      </div>
    `;
  }

  /**
   * Scroll conversation to top
   */
  scrollToTop() {
    this.elements.conversationContainer.scrollTop = 0;
  }

  /**
   * Scroll conversation to bottom
   */
  scrollToBottom() {
    this.elements.conversationContainer.scrollTop = this.elements.conversationContainer.scrollHeight;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Add a message to conversation UI
   * @param {Object} message - Message object
   */
  addMessageToUI(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role}`;
    messageElement.innerHTML = this.formatMessage(message);
    
    this.elements.conversationContainer.appendChild(messageElement);
  }

  /**
   * Add loading message
   */
  addLoadingMessage() {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'message loading';
    loadingElement.innerHTML = `
      <div class="message-avatar">AI</div>
      <div class="message-content">
        <div class="loading-dots">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
      </div>
    `;
    
    this.elements.conversationContainer.appendChild(loadingElement);
  }
}

// =============================================================================
// MAIN APPLICATION
// =============================================================================

class MedicalRAGApp {
  constructor() {
    this.state = new AppState();
    this.apiService = new ApiService();
    this.uiController = new UIController();
    this.debounceTimer = null;
  }

  /**
   * Navigate to a specific page
   * @param {string} page - Page name
   */
  navigateToPage(page) {
    this.state.setPage(page);
  }

  /**
   * Ask a medical question (chat interface)
   * @param {string} question - Medical question
   */
  async askMedicalQuestion(question) {
    console.log('Starting medical question request:', question);
    
    // Add user message
    this.state.addMessage('user', question);
    
    // Add loading message
    this.state.addMessage('loading', '');
    this.state.setLoading(true);
    this.state.clearError();

    try {
      console.log('Calling API service...');
      const result = await this.apiService.queryMedical(question);
      console.log('API result received:', result);
      
      // Remove loading message
      const loadingIndex = this.state.conversation.findIndex(msg => msg.role === 'loading');
      if (loadingIndex !== -1) {
        this.state.conversation.splice(loadingIndex, 1);
      }
      
      // Add assistant response
      this.state.addMessage('assistant', result.answer, result.sources);
      
      // Scroll to top to show the new answer from the beginning
      setTimeout(() => {
        this.uiController.scrollToTop();
      }, 100);
      
    } catch (error) {
      console.error('Search error:', error);
      
      // Remove loading message
      const loadingIndex = this.state.conversation.findIndex(msg => msg.role === 'loading');
      if (loadingIndex !== -1) {
        this.state.conversation.splice(loadingIndex, 1);
      }
      
      // Add error message
      this.state.addMessage('assistant', `Error: ${error.message || 'An unexpected error occurred. Please try again.'}`);
      this.state.setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      this.state.setLoading(false);
      
      // Keep focus on input for next question
      setTimeout(() => {
        this.uiController.elements.chatInput.focus();
      }, 200);
    }
  }

  /**
   * Initialize application
   */
  init() {
    console.log('Medical RAG System initialized');
    console.log('Mock mode:', CONFIG.MOCK_MODE ? 'ENABLED' : 'DISABLED');
    
    // Set initial page
    this.navigateToPage('chat');
    
    // Focus on input
    setTimeout(() => {
      this.uiController.elements.chatInput.focus();
    }, 500);
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MedicalRAGApp();
  app.init();
  
  // Make app globally accessible for debugging
  window.app = app;
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
function isMobile() {
  return window.innerWidth <= 768;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.error('Error message:', event.error?.message);
  console.error('Error stack:', event.error?.stack);
  console.error('Error filename:', event.filename);
  console.error('Error line:', event.lineno);
  // Only show user notification for critical errors
  if (event.error && event.error.message && !event.error.message.includes('ResizeObserver')) {
    // Could send to error tracking service here
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.error('Promise rejection reason:', event.reason?.message);
  console.error('Promise rejection stack:', event.reason?.stack);
  // Only show user notification for critical errors
  if (event.reason && event.reason.message && !event.reason.message.includes('ResizeObserver')) {
    // Could send to error tracking service here
  }
});
