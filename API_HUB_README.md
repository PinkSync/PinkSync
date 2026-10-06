# PinkSync API Hub

> **A comprehensive Deaf-First API marketplace and developer portal**

## 🎯 Overview

The PinkSync API Hub is a dedicated developer portal that showcases and provides access to PinkSync's suite of accessibility-focused APIs. It serves as the central hub for developers to discover, test, and integrate Deaf-first APIs into their applications.

## 🌐 Access

**Live URL:** `/api-hub` (e.g., `https://pinkycollie.github.io/PinkSync/api-hub`)

The API Hub is accessible from the main PinkSync homepage via:
- Navigation button in the header
- "API Hub" button in the hero section
- Footer link

## 🎨 Features

### 1. **Hero Section**
- Real-time API status badge showing operational status and average latency
- Call-to-action buttons for getting API keys and trying the playground
- Key statistics: 47+ API endpoints, 15,000+ users served, <100ms latency, 12 global regions

### 2. **Real-Time API Status Dashboard**
Monitors and displays the operational status of all APIs:
- ✅ **Operational** - API is fully functional
- ⚠️ **Degraded** - API is experiencing issues but still functional
- ❌ **Down** - API is currently unavailable

Each API shows:
- Current status indicator
- Average latency (in milliseconds)
- Real-time updates every 30 seconds

### 3. **API Collection Grid**

The hub showcases 9 core Deaf-first APIs:

#### 🤟 ASL Recognition API
**Purpose:** Real-time American Sign Language gesture recognition and interpretation
- `POST /asl/detect` - Detect ASL gestures from video stream
- `POST /asl/interpret` - Interpret continuous signing
- `GET /asl/dictionary` - Get ASL sign vocabulary

#### 📹 Video Relay Service API
**Purpose:** Connect Deaf users with interpreters for real-time video communication
- `POST /vrs/connect` - Initiate video relay call
- `GET /vrs/interpreters` - Get available interpreters
- `POST /vrs/schedule` - Schedule interpreter session

#### 💬 Real-Time Captioning API
**Purpose:** AI-powered live captions and transcript generation
- `POST /captions/stream` - Stream real-time captions (WebSocket)
- `GET /captions/transcript` - Get full transcript
- `POST /captions/translate` - Translate captions to sign language

#### 🔐 DeafAUTH Identity API
**Purpose:** Biometric authentication designed for Deaf users with video verification
- `POST /auth/verify-video` - Verify identity via video selfie
- `POST /auth/biometric` - Biometric authentication
- `GET /auth/session` - Get current session info

#### ⚡ Haptic Notification API
**Purpose:** Vibration patterns and haptic alerts as audio alternatives
- `POST /haptic/send` - Send haptic notification
- `GET /haptic/patterns` - Get predefined vibration patterns
- `POST /haptic/custom` - Create custom haptic pattern

#### 👁️ Visual Alert System API
**Purpose:** Flash notifications, color-coded urgency, and visual communication
- `POST /alerts/visual` - Send visual alert
- `GET /alerts/templates` - Get alert templates
- `POST /alerts/schedule` - Schedule visual notification

#### 👥 Deaf Community Graph API
**Purpose:** Social connections, trust scores, and Fibonrose reputation system
- `GET /community/users` - Search Deaf community members
- `POST /community/trust` - Submit trust rating
- `GET /community/reputation` - Get Fibonrose reputation score

#### 🌐 Sign Language Translation API
**Purpose:** Translate between ASL, BSL, LSF and other sign languages
- `POST /translate/sign-to-sign` - Translate between sign languages
- `POST /translate/sign-to-text` - Convert signing to text
- `GET /translate/languages` - Get supported sign languages

#### 📚 Accessibility Validator API
**Purpose:** Scan and validate deaf accessibility compliance for websites and apps
- `POST /validate/url` - Validate URL for deaf accessibility
- `GET /validate/report` - Get detailed accessibility report
- `POST /validate/fix-suggestions` - Get AI-powered fix suggestions

### 4. **Interactive API Playground**

The playground allows developers to test APIs without writing code:

**Features:**
- **API Key Input:** Enter your API key or use demo key
- **Endpoint Selection:** Choose from all available API endpoints via dropdown
- **Request Body:** JSON editor for request payload
- **Send Request:** Execute API calls with simulated responses
- **Response Panel:** View formatted JSON responses
- **Example Code:** Pre-populated code examples for each API

**Example Workflow:**
1. Select an API endpoint (e.g., `POST /asl/detect`)
2. Code example is automatically loaded
3. Modify request body as needed
4. Click "Send Request"
5. View the mock response with realistic data

### 5. **Developer Resources**

Three key resource cards:

**📝 Example Code**
- Code snippets in JavaScript, Python, Go, Ruby, and more
- Copy-paste-ready examples
- Best practices and patterns

**📖 Full Documentation**
- Comprehensive API reference
- Integration guides
- Authentication documentation
- Rate limiting and quotas

**📦 SDK Downloads**
- Official SDKs for popular languages
- Installation via npm, pip, gem, etc.
- Type definitions included

## 🏗️ Architecture Integration

The API Hub is built to work seamlessly with PinkSync's microservices architecture:

### Backend Services Mapping

| API Hub Feature | Backend Service | Description |
|----------------|----------------|-------------|
| ASL Recognition | `/services/asl-glosser` + `/services/sign-speak` | Sign language detection and interpretation |
| Video Relay | `/services/vcode` + `/services/interpreters` | Video communication and interpreter booking |
| Real-Time Captions | `/services/vcode` (AI service) | Speech-to-text transcription |
| DeafAUTH | `/services/deafauth` | Authentication and identity management |
| Haptic/Visual Alerts | `/services/event-orchestrator` + `/services/pinkflow` | Event routing and transformation |
| Community Graph | `/services/api-broker` | Provider connections and reputation |
| Sign Translation | `/services/sign-speak` | Multi-language sign translation |
| Accessibility Validator | `/services/pinkflow` + `/services/rag-engine` | Content analysis and recommendations |

### API Status Integration

The status dashboard can be connected to real backend monitoring:

```typescript
// In production, replace with actual API call
const checkAPIStatus = async () => {
  const response = await fetch('https://api.pinksync.ai/v1/status');
  const status = await response.json();
  setApiStatus(status);
};
```

Expected status response format:
```json
{
  "asl-recognition": {
    "status": "operational",
    "latency": 87,
    "uptime": 99.9
  },
  "video-relay": {
    "status": "operational",
    "latency": 124,
    "uptime": 99.8
  }
  // ... other APIs
}
```

## 🎨 Design System

### Color Palette

Each API has a unique gradient color scheme:
- **ASL Recognition:** Pink to Rose (`from-pink-500 to-rose-500`)
- **Video Relay:** Purple to Indigo (`from-purple-500 to-indigo-500`)
- **Captions:** Blue to Cyan (`from-blue-500 to-cyan-500`)
- **DeafAUTH:** Green to Emerald (`from-green-500 to-emerald-500`)
- **Haptic:** Orange to Red (`from-orange-500 to-red-500`)
- **Visual Alerts:** Yellow to Amber (`from-yellow-500 to-amber-500`)
- **Community:** Teal to Cyan (`from-teal-500 to-cyan-500`)
- **Translation:** Indigo to Purple (`from-indigo-500 to-purple-500`)
- **Validator:** Rose to Pink (`from-rose-500 to-pink-500`)

### Typography
- **Headings:** Bold, gradient text effects
- **Body:** Gray-400 for secondary text
- **Code:** Monospace font for code examples

### Components
- **Cards:** Gradient backgrounds with border hover effects
- **Buttons:** Gradient CTAs with shadow effects on hover
- **Status Badges:** Color-coded with icons
- **Code Blocks:** Dark background with syntax highlighting

## 🔧 Configuration

### API Base URL

Update the API base URL to point to your backend:

```typescript
const API_BASE_URL = 'https://sync.mbtq.dev/api/v1';
```

For development:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
```

### Authentication

The API Hub is designed to work with:
- **API Keys:** Bearer token authentication
- **OAuth:** For user-specific operations
- **Demo Mode:** Simulated responses for testing

## 📊 Metrics & Analytics

The API Hub tracks:
- **Page Views:** How many developers visit the hub
- **API Selections:** Which APIs are most popular
- **Playground Usage:** API testing activity
- **Documentation Views:** Which docs are accessed most
- **Conversion:** From visitor to API key generation

## 🚀 Deployment

The API Hub is deployed as part of the main PinkSync application:

```bash
# Build
npm run build

# The API Hub is available at /api-hub route
# Static export includes the hub automatically
```

For branch-specific deployments:
```bash
# Deploy to GitHub Pages
npm run deploy:branch

# Access at: https://pinkycollie.github.io/PinkSync/api-hub/
```

## 🔐 Security

### API Key Management
- Keys should be stored securely (never in client-side code)
- Use environment variables for sensitive keys
- Implement key rotation policies

### Rate Limiting
Each API endpoint has rate limits:
- **Free Tier:** 1,000 requests/day
- **Developer:** 10,000 requests/day
- **Enterprise:** Custom limits

### CORS Configuration
APIs support cross-origin requests with proper headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
```

## 🧪 Testing

To test the API Hub locally:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Navigate to http://localhost:3000/api-hub
```

## 🤝 Contributing

To add a new API to the hub:

1. **Add API Definition** in `deafAPIs` array:
```typescript
{
  id: 'new-api',
  name: 'New API Name',
  icon: IconComponent,
  description: 'API description',
  color: 'from-color-500 to-color-500',
  endpoints: [
    { method: 'GET', path: '/endpoint', desc: 'Description' }
  ],
  exampleCode: `// Code example`
}
```

2. **Add Status Monitoring** in `checkAPIStatus()`:
```typescript
'new-api': { status: 'operational', latency: 95 }
```

3. **Update Documentation** in this README

4. **Test** the new API card and playground integration

## 📚 Related Documentation

- [Main README](../README.md) - PinkSync platform overview
- [MICROSERVICES_CATALOG.md](../MICROSERVICES_CATALOG.md) - Complete service catalog
- [Architecture Guide](../docs/architecture-complete.md) - System architecture
- [API Documentation](../docs/api.md) - Detailed API specs

## 🎯 Roadmap

### Q1 2025
- [ ] Connect to real backend APIs
- [ ] Implement actual API key generation
- [ ] Add usage dashboard for developers
- [ ] Create SDK documentation pages

### Q2 2025
- [ ] Add code generation tool
- [ ] Create webhook management UI
- [ ] Implement API versioning display
- [ ] Add interactive tutorials

### Q3 2025
- [ ] Launch developer community forum
- [ ] Add AI-powered API recommendations
- [ ] Create API marketplace
- [ ] Implement billing and subscription management

## 💡 Use Cases

### For Developers
- **Discover APIs:** Browse all available Deaf-first APIs
- **Test APIs:** Use playground to test without coding
- **Integrate:** Get code examples and SDKs
- **Monitor:** Track API status and performance

### For Product Managers
- **Evaluate:** Assess PinkSync capabilities
- **Plan:** Understand API offerings for product roadmap
- **Demo:** Show stakeholders what's possible

### For Designers
- **Learn:** Understand accessibility requirements
- **Design:** Create accessible user experiences
- **Validate:** Use validator API for accessibility checks

## 🌟 Best Practices

1. **API Key Security:** Never expose API keys in client-side code
2. **Error Handling:** Always implement proper error handling
3. **Rate Limiting:** Respect rate limits and implement exponential backoff
4. **Caching:** Cache responses where appropriate to reduce API calls
5. **Monitoring:** Track API usage and performance metrics
6. **Feedback:** Report issues and suggest improvements

## 📧 Support

For API Hub questions or issues:
- **GitHub Issues:** https://github.com/pinkycollie/PinkSync/issues
- **Documentation:** See [API Documentation](../docs/api.md)
- **Community:** Join our Discord server
- **Email:** api-support@pinksync.ai

---

**Built with ❤️ for the Deaf community by PinkSync**
