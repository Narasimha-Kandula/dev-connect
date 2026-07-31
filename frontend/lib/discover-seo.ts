export interface SkillInfo {
  slug: string;
  name: string;
  title: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  heading: string;
  subheading: string;
  about: string;
  relatedSkills: string[];
}

export const SKILLS: Record<string, SkillInfo> = {
  react: {
    slug: 'react',
    name: 'React',
    title: 'React Developers — Find React JS Collaborators',
    description: 'Find and connect with React developers for collaboration. Browse top React.js developers, match by skills, and build projects together on DevConnect.',
    metaDescription: 'Find React developers for your next project. Connect with top React.js talent, match by skills and experience, and build something great together.',
    keywords: ['react developers', 'find react developer', 'react js collaboration', 'react project partner', 'react developer matching'],
    heading: 'React Developers',
    subheading: 'Connect with top React.js developers for collaboration',
    about: 'React is one of the most popular frontend frameworks, powering everything from startups to enterprise applications. Our community of React developers includes experts in React 18/19, Next.js, Remix, and the broader React ecosystem.',
    relatedSkills: ['nextjs', 'typescript', 'javascript', 'vue', 'angular'],
  },
  nextjs: {
    slug: 'nextjs',
    name: 'Next.js',
    title: 'Next.js Developers — Find Full-Stack React Experts',
    description: 'Find Next.js developers for full-stack React projects. Connect with Next.js experts specializing in SSR, SSG, API routes, and the App Router.',
    metaDescription: 'Browse top Next.js developers ready to collaborate. Find full-stack React experts specializing in SSR, App Router, and modern web development.',
    keywords: ['nextjs developers', 'find next.js developer', 'next.js collaboration', 'react full stack developer', 'next.js project partner'],
    heading: 'Next.js Developers',
    subheading: 'Full-stack React developers building with Next.js',
    about: 'Next.js is the leading React framework for production-grade applications, offering SSR, SSG, ISR, and the cutting-edge App Router. Our Next.js developers range from frontend specialists to full-stack engineers.',
    relatedSkills: ['react', 'typescript', 'nodejs', 'javascript'],
  },
  python: {
    slug: 'python',
    name: 'Python',
    title: 'Python Developers — Find Python Collaborators',
    description: 'Discover Python developers for collaboration on AI, data science, backend, and automation projects. Match with Python experts on DevConnect.',
    metaDescription: 'Find Python developers for your next project. Connect with Python experts in AI, data science, backend development, and automation.',
    keywords: ['python developers', 'find python developer', 'python collaboration', 'python developer matching', 'python project partner'],
    heading: 'Python Developers',
    subheading: 'Discover Python developers for AI, data science, and backend projects',
    about: 'Python is the language of choice for AI, machine learning, data science, and backend development. Our community includes Python developers working with Django, FastAPI, Flask, PyTorch, TensorFlow, and more.',
    relatedSkills: ['machine-learning', 'ai', 'golang', 'rust', 'nodejs'],
  },
  nodejs: {
    slug: 'nodejs',
    name: 'Node.js',
    title: 'Node.js Developers — Find Backend JavaScript Experts',
    description: 'Find Node.js developers for backend and full-stack JavaScript projects. Connect with Node.js experts on DevConnect.',
    metaDescription: 'Browse top Node.js developers ready to collaborate. Find backend JavaScript experts specializing in Express, NestJS, and serverless.',
    keywords: ['node js developers', 'find node.js developer', 'backend developer collaboration', 'node js project partner', 'javascript backend developer'],
    heading: 'Node.js Developers',
    subheading: 'Backend JavaScript developers building with Node.js',
    about: 'Node.js powers millions of backend services, APIs, and serverless functions. Our Node.js developers work with Express, NestJS, Fastify, and the broader JavaScript ecosystem.',
    relatedSkills: ['typescript', 'javascript', 'react', 'golang'],
  },
  typescript: {
    slug: 'typescript',
    name: 'TypeScript',
    title: 'TypeScript Developers — Find Type-Safe JavaScript Experts',
    description: 'Find TypeScript developers for type-safe, scalable projects. Connect with TypeScript experts specializing in frontend, backend, and full-stack development.',
    metaDescription: 'Browse TypeScript developers ready to collaborate on your next project. Find type-safe JavaScript experts for frontend, backend, or full-stack roles.',
    keywords: ['typescript developers', 'find typescript developer', 'typescript collaboration', 'typescript developer matching', 'type safe javascript developer'],
    heading: 'TypeScript Developers',
    subheading: 'Type-safe JavaScript developers building scalable applications',
    about: 'TypeScript has become the standard for large-scale JavaScript applications, offering type safety, better tooling, and improved developer experience. Our TypeScript developers work across the full stack with React, Node.js, Next.js, and more.',
    relatedSkills: ['react', 'nodejs', 'nextjs', 'javascript', 'angular'],
  },
  javascript: {
    slug: 'javascript',
    name: 'JavaScript',
    title: 'JavaScript Developers — Find Full-Stack JS Experts',
    description: 'Discover JavaScript developers for web, mobile, and backend projects. Connect with JavaScript experts on DevConnect.',
    metaDescription: 'Find JavaScript developers for your next project. Connect with full-stack JS experts for web, mobile, and server-side development.',
    keywords: ['javascript developers', 'find javascript developer', 'javascript collaboration', 'full stack javascript developer', 'js project partner'],
    heading: 'JavaScript Developers',
    subheading: 'Full-stack JavaScript developers building the modern web',
    about: 'JavaScript is the most widely-used programming language, powering the web from frontend to backend. Our JavaScript developers work with React, Vue, Node.js, and the ever-growing JS ecosystem.',
    relatedSkills: ['typescript', 'react', 'nodejs', 'vue', 'angular'],
  },
  golang: {
    slug: 'golang',
    name: 'Go',
    title: 'Go Developers — Find Golang Backend Experts',
    description: 'Find Go (Golang) developers for high-performance backend, cloud, and DevOps projects. Connect with Go experts on DevConnect.',
    metaDescription: 'Browse Go (Golang) developers ready to collaborate on backend, cloud infrastructure, and DevOps projects.',
    keywords: ['golang developers', 'go developers', 'find go developer', 'golang collaboration', 'golang backend developer'],
    heading: 'Go (Golang) Developers',
    subheading: 'High-performance backend developers building with Go',
    about: 'Go is the language of choice for cloud-native applications, microservices, and high-performance backend systems. Our Go developers work on Kubernetes, Docker, distributed systems, and more.',
    relatedSkills: ['rust', 'nodejs', 'python', 'kubernetes', 'docker'],
  },
  rust: {
    slug: 'rust',
    name: 'Rust',
    title: 'Rust Developers — Find Systems Programming Experts',
    description: 'Find Rust developers for systems programming, WebAssembly, and high-performance applications. Connect with Rust experts on DevConnect.',
    metaDescription: 'Browse Rust developers ready to collaborate on systems programming, WebAssembly, and performance-critical applications.',
    keywords: ['rust developers', 'find rust developer', 'rust collaboration', 'systems programming developer', 'rust developer matching'],
    heading: 'Rust Developers',
    subheading: 'Systems programmers building safe, fast software with Rust',
    about: 'Rust offers memory safety without garbage collection, making it ideal for systems programming, WebAssembly, and performance-critical applications. Our Rust developers work on compilers, databases, game engines, and more.',
    relatedSkills: ['golang', 'python', 'blockchain', 'solidity'],
  },
  'machine-learning': {
    slug: 'machine-learning',
    name: 'Machine Learning',
    title: 'Machine Learning Engineers — Find AI/ML Experts',
    description: 'Find machine learning engineers and AI researchers for collaboration. Connect with ML experts using PyTorch, TensorFlow, and more.',
    metaDescription: 'Browse machine learning engineers ready to collaborate on AI projects. Find ML experts specializing in deep learning, NLP, computer vision, and more.',
    keywords: ['machine learning engineers', 'find ml engineer', 'ai collaboration', 'machine learning project partner', 'deep learning developer'],
    heading: 'Machine Learning Engineers',
    subheading: 'AI and ML experts building intelligent systems',
    about: 'Machine learning is transforming every industry. Our ML community includes engineers and researchers working with PyTorch, TensorFlow, JAX, NLP, computer vision, and reinforcement learning.',
    relatedSkills: ['python', 'ai', 'data-science'],
  },
  devops: {
    slug: 'devops',
    name: 'DevOps',
    title: 'DevOps Engineers — Find Cloud & Infrastructure Experts',
    description: 'Find DevOps engineers for cloud infrastructure, CI/CD, and platform engineering. Connect with DevOps experts on DevConnect.',
    metaDescription: 'Browse DevOps engineers ready to collaborate on cloud infrastructure, Kubernetes, CI/CD pipelines, and platform engineering projects.',
    keywords: ['devops engineers', 'find devops engineer', 'cloud infrastructure collaboration', 'kubernetes developer', 'devops project partner'],
    heading: 'DevOps Engineers',
    subheading: 'Cloud and infrastructure experts building reliable systems',
    about: 'DevOps engineers bridge the gap between development and operations, enabling faster, more reliable deployments. Our DevOps community specializes in Kubernetes, Docker, Terraform, CI/CD, and cloud platforms.',
    relatedSkills: ['aws', 'docker', 'kubernetes', 'golang'],
  },
};

export const SKILL_SLUGS = Object.keys(SKILLS);

export function getSkillInfo(slug: string): SkillInfo | undefined {
  return SKILLS[slug];
}

export function getSkillTitle(slug: string): string {
  return SKILLS[slug]?.title ?? `${slug.charAt(0).toUpperCase() + slug.slice(1)} Developers — Find Collaborators`;
}

export function getSkillDescription(slug: string): string {
  return SKILLS[slug]?.description ?? `Find ${slug} developers for collaboration on DevConnect. Browse profiles, match by skills, and start building together.`;
}
