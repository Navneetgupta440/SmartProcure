/**
 * Project Leadership, Founder & Lead Developer Profile
 * Details of Navneet Gupta - CEO, Founder, Lead Full Stack Developer & Chief Administrator
 */

export interface ProjectFounderInfo {
  name: string;
  title: string;
  roleDescription: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  education: {
    institution: string;
    location: string;
    degree: string;
    duration: string;
  };
  skills: {
    category: string;
    items: string[];
  }[];
  experience: {
    role: string;
    company: string;
    location: string;
    duration: string;
    highlights: string[];
  }[];
  projects: {
    title: string;
    techStack: string;
    githubRepo: string;
    description: string[];
  }[];
  certifications: {
    title: string;
    issuer: string;
    description: string;
  }[];
  stats: {
    label: string;
    value: string;
    detail: string;
  }[];
}

export const FOUNDER_INFO: ProjectFounderInfo = {
  name: 'Navneet Gupta',
  title: 'CEO & Founder • Lead Full Stack Developer & Chief Administrator',
  roleDescription:
    'Chief Executive Officer, Founder, and Principal Software Architect responsible for the end-to-end design, full-stack development, and enterprise administration of the ProcureFlow Smart Procurement & Purchase Order Management System.',
  email: 'indianavneetgupta33@gmail.com',
  phone: '+91-7317567350',
  location: 'Greater Delhi Area, India',
  linkedinUrl: 'https://linkedin.com/in/navneet-gupta',
  githubUrl: 'https://github.com/navneetgupta440',
  education: {
    institution: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)',
    location: 'Lucknow, Uttar Pradesh, India',
    degree: 'Bachelor of Technology in Computer Science and Engineering',
    duration: 'Sept. 2023 – Sept. 2027',
  },
  skills: [
    {
      category: 'Frontend Engineering',
      items: ['React.js', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'Responsive Design', 'Bootstrap', 'Tailwind CSS'],
    },
    {
      category: 'Backend & APIs',
      items: ['Node.js', 'Express.js', 'RESTful APIs', 'Microservices Architecture', 'JWT Authentication', 'Role-Based Access Control (RBAC)'],
    },
    {
      category: 'Databases & Storage',
      items: ['MongoDB', 'MySQL', 'PostgreSQL', 'Schema Design', 'Query Optimization', 'Indexing Strategies'],
    },
    {
      category: 'Programming Languages',
      items: ['JavaScript', 'Java', 'C++', 'Python'],
    },
    {
      category: 'Developer Tools & Methodologies',
      items: ['Git', 'GitHub', 'Postman', 'npm', 'Agile / Scrum', 'Version Control', 'Vite', 'Docker'],
    },
    {
      category: 'Core Foundations & Architecture',
      items: ['Data Structures & Algorithms', 'Object-Oriented Programming (OOP)', 'System Design', 'ACID Transactions', 'State Machines'],
    },
  ],
  experience: [
    {
      role: 'Full Stack Developer Intern',
      company: 'Student Inc.',
      location: 'Uttar Pradesh, India',
      duration: 'Oct. 2023 – Present',
      highlights: [
        'Engineered full-stack web applications using MERN stack, serving 1,000+ active users with 99.5% uptime reliability.',
        'Architected RESTful APIs with Node.js and Express.js, incorporating JWT authentication and granular role-based access control.',
        'Optimized MongoDB schemas with strategic indexing strategies, accelerating database query response time by 40%.',
        'Crafted responsive React.js interfaces adhering to modern UI/UX principles, achieving 95+ Lighthouse performance scores.',
        'Contributed to Agile development cycles, conducting code reviews and delivering features within tight production deadlines.',
      ],
    },
  ],
  projects: [
    {
      title: 'ProcureFlow Enterprise Smart Procurement & PO System',
      techStack: 'React.js, TypeScript, Node.js, Express.js, Tailwind CSS, REST APIs',
      githubRepo: 'https://github.com/navneetgupta440',
      description: [
        'Flagship enterprise procurement lifecycle management platform with 7 RBAC personas, dynamic 3-tier approval routing, atomic inventory stock locking, and multilingual i18n support.',
        'Built full OpenAPI/Postman collection suite, live GPS logistics tracking simulator, and AI-driven supplier evaluation engine.',
      ],
    },
    {
      title: 'Money Tracker Web Application',
      techStack: 'MERN Stack, JavaScript, Express.js, Node.js, MongoDB, Chart.js',
      githubRepo: 'https://github.com/navneetgupta440/money_TrackerWebApp',
      description: [
        'Architected full-stack expense management platform leveraging MongoDB, Express.js, React.js, and Node.js.',
        'Integrated secure user authentication, transaction CRUD operations, and real-time budget monitoring dashboard.',
        'Incorporated Chart.js visualizations to illustrate spending patterns and deliver actionable financial insights.',
      ],
    },
    {
      title: 'Blog Website Platform',
      techStack: 'JavaScript, Node.js, Express.js, MongoDB, Responsive CSS',
      githubRepo: 'https://github.com/navneetgupta440/Blog_Website',
      description: [
        'Constructed dynamic blogging platform featuring secure authentication, post creation, editing, and commenting capabilities.',
        'Designed RESTful API infrastructure with Express.js enabling seamless front-end and back-end communication.',
        'Developed responsive interface utilizing modern CSS frameworks, ensuring mobile-first approach and cross-browser compatibility.',
      ],
    },
    {
      title: 'Contact Management System',
      techStack: 'Python, Data Structures, CLI Algorithms',
      githubRepo: 'https://github.com/navneetgupta440/Contact-book',
      description: [
        'Established comprehensive contact management application with add, view, search, update, and delete functionality.',
        'Deployed efficient search algorithms and data structures for rapid contact retrieval from extensive datasets.',
        'Fashioned intuitive command-line interface with robust input validation and error handling mechanisms.',
      ],
    },
  ],
  certifications: [
    {
      title: 'Full Stack Development Certification',
      issuer: 'Industry Standard MERN Stack Program',
      description: 'Comprehensive MERN stack training with hands-on enterprise-grade projects.',
    },
    {
      title: 'Java Certified Programmer',
      issuer: 'Advanced Software Certification',
      description: 'Advanced object-oriented programming, design patterns, and algorithmic computation.',
    },
    {
      title: 'Deloitte Australia - Data Analytics Simulation',
      issuer: 'Deloitte Australia / Forage',
      description: 'Real-world data analysis, business telemetry interpretation, and visualization experience.',
    },
  ],
  stats: [
    { label: 'Uptime Reliability', value: '99.5%', detail: 'Production benchmark' },
    { label: 'Active Users Served', value: '1,000+', detail: 'Across deployed web apps' },
    { label: 'Query Latency Boost', value: '40%', detail: 'Optimized schema indexing' },
    { label: 'Lighthouse Score', value: '95+', detail: 'Performance & Accessibility' },
  ],
};
