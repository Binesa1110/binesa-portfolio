/*
 * Single source of truth for editable portfolio data.
 *
 * GitHub data below is a verified local snapshot of the public repositories
 * returned by https://api.github.com/users/Binesa1110/repos (all pages).
 * The UI renders this snapshot immediately; the GitHub panel can refresh it
 * from the API without ever requiring a token or exposing one in source.
 */
window.PORTFOLIO = {
  name: "Binesa Sajan Joseph",
  initials: "BSJ",
  email: "",
  linkedin: "https://linkedin.com/in/binesa-sajan-joseph-a5a551339",
  github: "https://github.com/Binesa1110",
  resume: ""
};

window.GITHUB_PROFILE = {
  username: "Binesa1110",
  url: "https://github.com/Binesa1110",
  api: "https://api.github.com/users/Binesa1110/repos",
  snapshot: "2026-11-19"
};

/* Complete public repository snapshot: 7 repositories, including one empty repo. */
window.GITHUB_REPOS = [
  {
    name: "CYBERMIND-NLP",
    url: "https://github.com/Binesa1110/CYBERMIND-NLP",
    description: "AI-based cybersecurity text analyzer using NLP, machine learning, and heuristic threat detection.",
    homepage: "",
    language: "Python",
    topics: [],
    size: 267,
    fork: false,
    archived: false,
    updatedAt: "2026-10-07T20:57:39Z",
    pushedAt: "2026-11-17T11:54:02Z",
    empty: false
  },
  {
    name: "IDS-project",
    url: "https://github.com/Binesa1110/IDS-project",
    description: "This project is a Web-Based Intelligent Intrusion Detection System (IDS). Think of it as a digital security guard for a web server. Its job is to take raw, messy server access logs and turn them into actionable security intelligence.",
    homepage: "",
    language: "Python",
    topics: [],
    size: 6,
    fork: false,
    archived: false,
    updatedAt: "2026-07-10T15:43:15Z",
    pushedAt: "2026-07-10T15:41:43Z",
    empty: false
  },
  {
    name: "mailpilot-ai",
    url: "https://github.com/Binesa1110/mailpilot-ai",
    description: "MailPilot AI is an AI-powered email assistant built with React, FastAPI, and PostgreSQL. It helps users generate and review emails using AI, connect their Gmail accounts, and send emails with user approval. It also supports optional consent-based auto-sending with security controls.",
    homepage: "",
    language: "Python",
    topics: [],
    size: 73,
    fork: false,
    archived: false,
    updatedAt: "2026-10-29T13:21:20Z",
    pushedAt: "2026-10-29T13:21:16Z",
    empty: false
  },
  {
    name: "RideWise-Assist",
    url: "https://github.com/Binesa1110/RideWise-Assist",
    description: "RideWise Assist is a lightweight Streamlit application for ride-sharing operations support. It can answer booking, cancellation, damage, and policy questions while clearly reporting missing policy or LLM configuration.",
    homepage: "",
    language: "Python",
    topics: [],
    size: 41,
    fork: false,
    archived: false,
    updatedAt: "2026-10-18T14:13:21Z",
    pushedAt: "2026-10-10T08:26:38Z",
    empty: false
  },
  {
    name: "SavoryAtlas",
    url: "https://github.com/Binesa1110/SavoryAtlas",
    description: "",
    homepage: "",
    language: null,
    topics: [],
    size: 0,
    fork: false,
    archived: false,
    updatedAt: "2025-03-13T18:11:57Z",
    pushedAt: "2025-03-13T18:11:57Z",
    empty: true
  },
  {
    name: "secure-and-safe",
    url: "https://github.com/Binesa1110/secure-and-safe",
    description: "a web app to keep your important government documents safe",
    homepage: "",
    language: "HTML",
    topics: [],
    size: 140,
    fork: false,
    archived: false,
    updatedAt: "2025-05-09T15:28:35Z",
    pushedAt: "2025-05-09T15:28:32Z",
    empty: false
  },
  {
    name: "sports-buddy",
    url: "https://github.com/Binesa1110/sports-buddy",
    description: " A web app for connecting sports lovers",
    homepage: "",
    language: "JavaScript",
    topics: [],
    size: 180,
    fork: false,
    archived: false,
    updatedAt: "2025-05-09T15:17:12Z",
    pushedAt: "2025-05-09T15:17:08Z",
    empty: false
  }
];

window.SKILLS = [
  {
    id: "programming",
    label: "Programming & Web",
    short: "Code & interfaces",
    skills: [
      { name: "Python", note: "Automation, data processing and AI pipelines." },
      { name: "JavaScript", note: "Interactive, responsive web interfaces." },
      { name: "HTML", note: "Semantic, accessible page structure." },
      { name: "CSS", note: "Responsive layouts and motion systems." },
      { name: "MySQL", note: "Relational data storage and querying." }
    ]
  },
  {
    id: "ai-data",
    label: "AI & Data",
    short: "Intelligence & language",
    skills: [
      { name: "NLP", note: "Text preprocessing and language understanding." },
      { name: "NLTK", note: "Tokenization, stemming and POS tagging." },
      { name: "Scikit-learn", note: "Feature extraction and classification." },
      { name: "Streamlit", note: "Rapid data application interfaces." },
      { name: "Google AI Tools", note: "Applied generative AI workflows." },
      { name: "LLMs", note: "Prompting and local model integration." }
    ]
  },
  {
    id: "security",
    label: "Cybersecurity",
    short: "Defense & analysis",
    skills: [
      { name: "Cybersecurity Fundamentals", note: "Core security principles and practices." },
      { name: "Ethical Hacking", note: "Offensive techniques studied responsibly." },
      { name: "Intrusion Detection", note: "Log analysis and heuristic threat scoring." },
      { name: "OSINT", note: "Open-source intelligence gathering." },
      { name: "Threat Analysis", note: "Pattern recognition in malicious activity." }
    ]
  },
  {
    id: "tools",
    label: "Tools & Systems",
    short: "Platforms & runtime",
    skills: [
      { name: "Firebase", note: "Authentication and realtime data." },
      { name: "Ollama", note: "Local large language model deployment." },
      { name: "Linux", note: "Development and system workflows." },
      { name: "Networking", note: "Protocols and connected systems." },
      { name: "Operating Systems", note: "System-level computing foundations." }
    ]
  }
];

/*
 * The primary showcase contains the six substantive public repositories.
 * Every field is grounded in the repository metadata, README or source files.
 * No homepage/demo URL is published in any repository, so none is invented.
 */
window.PROJECTS = [
  {
    id: "cybermind-nlp",
    repoName: "CYBERMIND-NLP",
    title: "CyberMind NLP",
    category: "Threat Intelligence",
    categories: ["AI / ML", "Cybersecurity", "NLP"],
    accent: "violet",
    summary: "NLP, machine learning and heuristic rules combine to analyze suspicious text, URLs and Gmail activity.",
    tech: ["Python", "FastAPI", "NLP", "Gmail API", "Pub/Sub"],
    repo: "https://github.com/Binesa1110/CYBERMIND-NLP",
    homepage: "",
    overview: "CyberMind NLP is an AI-powered cybersecurity system that identifies potentially malicious content and suspicious URLs. Its README describes text classification, URL inspection, a decision engine and optional read-only Gmail monitoring through Google OAuth 2.0 and Cloud Pub/Sub.",
    problem: "Security-relevant text and inbox activity are noisy and difficult to review manually. The project combines several signals into one structured threat analysis result.",
    features: [
      "NLP and machine-learning threat classification",
      "Suspicious URL pattern inspection",
      "Keyword analysis plus a heuristic decision engine",
      "Optional read-only Gmail monitoring with user consent",
      "Responsive web dashboard for analysis results"
    ],
    implementation: "The repository is modular: a FastAPI backend coordinates an NLP engine, a trained classifier, a URL analyzer and rule-based decision logic. Gmail integration uses OAuth 2.0, encrypted token storage and Pub/Sub updates when monitoring is explicitly enabled.",
    limitations: "Analysis is decision support, not a guarantee of safety. Hosted integrations require credentials and cloud configuration; no hosted demo URL is published in the repository."
  },
  {
    id: "intrusion-detection",
    repoName: "IDS-project",
    title: "Intrusion Detection System",
    category: "Security Monitoring",
    categories: ["Cybersecurity", "AI / ML"],
    accent: "cyan",
    summary: "A Streamlit console that turns raw server access logs into readable, enriched security intelligence.",
    tech: ["Python", "Streamlit", "Regex", "Geolocation"],
    repo: "https://github.com/Binesa1110/IDS-project",
    homepage: "",
    overview: "The GitHub description identifies this as a web-based Intelligent Intrusion Detection System that transforms messy server access logs into actionable security intelligence. The repository source shows a Streamlit console with regex parsing and log enrichment.",
    problem: "Small teams need a lightweight way to inspect access logs and spot suspicious source addresses without deploying a full security stack.",
    features: [
      "Regex-based access-log ingestion",
      "Geolocation enrichment for source addresses",
      "Threat-oriented console views and scoring",
      "Session-oriented in-memory handling"
    ],
    implementation: "Python and Streamlit provide the interface. Log lines are parsed with regular expressions, enriched with geolocation data and presented in a monitoring dashboard configured in `log_parser.py`.",
    limitations: "The repository has no README and no published homepage. The implementation should be treated as a development-oriented monitoring aid rather than a complete production IDS."
  },
  {
    id: "mailpilot-ai",
    repoName: "mailpilot-ai",
    title: "MailPilot AI",
    category: "Applied AI",
    categories: ["AI / ML", "Web Development"],
    accent: "amber",
    summary: "An AI email assistant with explicit human approval, encrypted OAuth credentials and a React + FastAPI stack.",
    tech: ["React", "FastAPI", "PostgreSQL", "OpenAI API", "Gmail API"],
    repo: "https://github.com/Binesa1110/mailpilot-ai",
    homepage: "",
    overview: "MailPilot AI drafts and reviews emails. Its README states that manual approval is required by default and that automatic sending stays off unless the authenticated user separately opts in.",
    problem: "Generative email assistance is useful only when the user can review output and retain control over what is actually sent.",
    features: [
      "AI drafting and review with approval by default",
      "Google sign-in with separate, explicit Gmail connection",
      "Encrypted storage of OAuth credentials",
      "SQLite for local development and PostgreSQL support",
      "Versioned database migrations and a Vite frontend"
    ],
    implementation: "The React frontend talks to a FastAPI backend. The README documents OAuth scopes, Fernet token encryption, Alembic migrations, SQLite/PostgreSQL configuration and a local Vite development server.",
    limitations: "An OpenAI API key and Google OAuth configuration are required. The README describes a hosted demo as configuration only, not a verified live URL, so no demo link is shown."
  },
  {
    id: "ridewise-assist",
    repoName: "RideWise-Assist",
    title: "RideWise Assist",
    category: "AI Operations Support",
    categories: ["AI / ML", "Web Development"],
    accent: "green",
    summary: "A Streamlit support assistant for booking, cancellation, damage and policy questions in ride-sharing operations.",
    tech: ["Python", "Streamlit", "SQLite", "PyMuPDF", "NeoStats LLM"],
    repo: "https://github.com/Binesa1110/RideWise-Assist",
    homepage: "",
    overview: "RideWise Assist answers ride-sharing operations questions from local data and policy documents. Its README is careful to report missing policy files or LLM configuration instead of inventing answers.",
    problem: "Support teams need quick access to booking, payment, damage and policy information without guessing when the underlying data is incomplete.",
    features: [
      "SQLite-backed customer, booking, payment and damage records",
      "Role-oriented support and admin views",
      "Tool-calling agent for authorized lookups and calculations",
      "Policy PDF loading with graceful missing-file handling",
      "User-scoped chat export and pytest coverage"
    ],
    implementation: "A Streamlit interface coordinates a SQLite database, PyMuPDF policy loading and an optional NeoStats tool-calling agent. The README documents explicit limitations around cancellation trends, refunds and development-only role selection.",
    limitations: "Described by the author as development-oriented. The role selector is not production authentication, and analytics omit metrics the current schema cannot support."
  },
  {
    id: "secure-and-safe",
    repoName: "secure-and-safe",
    title: "Secure & Safe",
    category: "Document Security",
    categories: ["Web Development"],
    accent: "blue",
    summary: "A Firebase-backed web app for keeping important government documents safe.",
    tech: ["HTML", "CSS", "JavaScript", "Firebase Auth", "Firestore", "Storage"],
    repo: "https://github.com/Binesa1110/secure-and-safe",
    homepage: "",
    overview: "The GitHub description defines this as a web app for keeping important government documents safe. Repository source shows Firebase authentication, Firestore and Storage services.",
    problem: "Personal document storage needs a simple interface with authenticated access and managed file storage.",
    features: [
      "Web interface for document management",
      "Firebase Authentication integration",
      "Firestore records and Firebase Storage support"
    ],
    implementation: "The frontend is HTML, CSS and JavaScript. The repository's `firebase.js` initializes Firebase Auth, Firestore, Storage and Analytics services.",
    limitations: "The repository has no README or published homepage. Details are limited to the repository description and source configuration; no deployment is claimed."
  },
  {
    id: "sports-buddy",
    repoName: "sports-buddy",
    title: "Sports Buddy",
    category: "Community Web App",
    categories: ["Web Development"],
    accent: "pink",
    summary: "A Firebase-authenticated web app for connecting sports lovers and organizing play.",
    tech: ["HTML", "CSS", "JavaScript", "Firebase Auth"],
    repo: "https://github.com/Binesa1110/sports-buddy",
    homepage: "",
    overview: "Sports Buddy is described on GitHub as a web app for connecting sports lovers. The repository includes a Firebase authentication configuration and a responsive frontend.",
    problem: "Finding people to play with is often fragmented across chats. A dedicated app gives players one place to connect around sports.",
    features: [
      "Sports community web interface",
      "Firebase Authentication",
      "Responsive multi-page frontend"
    ],
    implementation: "HTML, CSS and JavaScript provide the interface; `firebase-config.js` initializes Firebase Authentication for user accounts.",
    limitations: "The repository has no README or published homepage. Feature detail is intentionally limited to verified repository evidence; no live demo is claimed."
  }
];
