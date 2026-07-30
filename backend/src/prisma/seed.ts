import { PrismaClient, SwipeAction, MatchStatus, AvailabilityStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

const SKILLS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'NestJS', 'Python', 'Django',
  'Go', 'Rust', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Docker', 'Kubernetes',
  'AWS', 'AI/ML', 'TensorFlow', 'React Native', 'Flutter', 'Solidity',
];

type UserSkill = { name: string; proficiency: number };

const USERS: Array<{
  email: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  experienceLevel: string;
  availability: AvailabilityStatus;
  skills: UserSkill[];
}> = [
  {
    email: 'alice@example.com',
    name: 'Alice Chen',
    headline: 'Full-stack engineer passionate about EdTech',
    bio: 'Full-stack engineer with 5 years of experience building scalable web applications. Love working with React, Node.js, and PostgreSQL. Currently exploring AI/ML to enhance educational platforms.',
    location: 'San Francisco, CA',
    experienceLevel: 'senior',
    availability: 'OPEN_TO_COLLAB',
    skills: [
      { name: 'React', proficiency: 5 },
      { name: 'Next.js', proficiency: 4 },
      { name: 'TypeScript', proficiency: 5 },
      { name: 'Node.js', proficiency: 4 },
      { name: 'PostgreSQL', proficiency: 4 },
      { name: 'GraphQL', proficiency: 3 },
    ],
  },
  {
    email: 'bob@example.com',
    name: 'Bob Martinez',
    headline: 'Backend & infrastructure specialist',
    bio: 'Backend engineer specializing in distributed systems, cloud infrastructure, and DevOps. Experienced with Go, Rust, Kubernetes, and AWS. Building robust APIs at scale.',
    location: 'New York, NY',
    experienceLevel: 'senior',
    availability: 'OPEN_TO_WORK',
    skills: [
      { name: 'Go', proficiency: 5 },
      { name: 'Rust', proficiency: 4 },
      { name: 'Node.js', proficiency: 3 },
      { name: 'Docker', proficiency: 5 },
      { name: 'Kubernetes', proficiency: 4 },
      { name: 'AWS', proficiency: 5 },
      { name: 'PostgreSQL', proficiency: 4 },
    ],
  },
  {
    email: 'carol@example.com',
    name: 'Carol Singh',
    headline: 'AI/ML engineer & Pythonista',
    bio: 'Machine learning engineer with a passion for NLP and computer vision. Experienced with TensorFlow, PyTorch, and deploying models to production. Open to research collaborations.',
    location: 'Austin, TX',
    experienceLevel: 'mid',
    availability: 'OPEN_TO_COLLAB',
    skills: [
      { name: 'Python', proficiency: 5 },
      { name: 'AI/ML', proficiency: 5 },
      { name: 'TensorFlow', proficiency: 4 },
      { name: 'Django', proficiency: 3 },
      { name: 'MongoDB', proficiency: 3 },
      { name: 'Docker', proficiency: 3 },
    ],
  },
  {
    email: 'dave@example.com',
    name: 'Dave Kim',
    headline: 'Mobile developer (React Native & Flutter)',
    bio: 'Mobile app developer with 4 years of experience. Built and shipped 10+ apps on iOS and Android. Love cross-platform development with React Native and Flutter.',
    location: 'Seattle, WA',
    experienceLevel: 'mid',
    availability: 'OPEN_TO_COLLAB',
    skills: [
      { name: 'React Native', proficiency: 5 },
      { name: 'Flutter', proficiency: 4 },
      { name: 'TypeScript', proficiency: 4 },
      { name: 'React', proficiency: 3 },
      { name: 'Node.js', proficiency: 3 },
      { name: 'GraphQL', proficiency: 3 },
    ],
  },
  {
    email: 'eve@example.com',
    name: 'Eve Johnson',
    headline: 'Solidity & Web3 engineer',
    bio: 'Blockchain developer focused on Ethereum smart contracts and dApps. Experienced with Solidity, Hardhat, and Web3.js. Looking for DeFi and NFT project collaborations.',
    location: 'Remote',
    experienceLevel: 'mid',
    availability: 'OPEN_TO_COLLAB',
    skills: [
      { name: 'Solidity', proficiency: 5 },
      { name: 'React', proficiency: 4 },
      { name: 'TypeScript', proficiency: 4 },
      { name: 'Node.js', proficiency: 3 },
      { name: 'Next.js', proficiency: 3 },
      { name: 'MongoDB', proficiency: 3 },
    ],
  },
  {
    email: 'frank@example.com',
    name: 'Frank Mueller',
    headline: 'DevOps & SRE engineer',
    bio: 'Site reliability engineer with deep expertise in CI/CD, monitoring, and infrastructure as code. Kubernetes and AWS certified. Passionate about automating everything.',
    location: 'Berlin, Germany',
    experienceLevel: 'senior',
    availability: 'OPEN_TO_WORK',
    skills: [
      { name: 'Docker', proficiency: 5 },
      { name: 'Kubernetes', proficiency: 5 },
      { name: 'AWS', proficiency: 5 },
      { name: 'Python', proficiency: 4 },
      { name: 'Go', proficiency: 3 },
      { name: 'PostgreSQL', proficiency: 3 },
    ],
  },
  {
    email: 'grace@example.com',
    name: 'Grace Liu',
    headline: 'Full-stack developer & UI/UX enthusiast',
    bio: 'Creative full-stack developer who loves building beautiful, accessible UIs. Strong background in design systems and component architecture. Active open-source contributor.',
    location: 'London, UK',
    experienceLevel: 'mid',
    availability: 'OPEN_TO_COLLAB',
    skills: [
      { name: 'React', proficiency: 5 },
      { name: 'Next.js', proficiency: 4 },
      { name: 'TypeScript', proficiency: 5 },
      { name: 'Node.js', proficiency: 3 },
      { name: 'NestJS', proficiency: 3 },
      { name: 'Docker', proficiency: 3 },
    ],
  },
  {
    email: 'henry@example.com',
    name: 'Henry Patel',
    headline: 'Data engineer & Python backend specialist',
    bio: 'Data engineer building pipelines and ETL systems at scale. Experienced with Python, PostgreSQL, and cloud data warehouses. Open to side projects in data visualization.',
    location: 'Bangalore, India',
    experienceLevel: 'junior',
    availability: 'OPEN_TO_COLLAB',
    skills: [
      { name: 'Python', proficiency: 4 },
      { name: 'PostgreSQL', proficiency: 4 },
      { name: 'MongoDB', proficiency: 3 },
      { name: 'Django', proficiency: 3 },
      { name: 'Docker', proficiency: 2 },
      { name: 'AI/ML', proficiency: 2 },
    ],
  },
];

async function getSkillMap(): Promise<Map<string, string>> {
  const skills = await prisma.skill.findMany();
  const map = new Map<string, string>();
  for (const s of skills) map.set(s.name, s.id);
  return map;
}

async function seedSkills() {
  for (const name of SKILLS) {
    await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
  }
}

async function createUser(
  u: typeof USERS[number],
  passwordHash: string,
  skillMap: Map<string, string>,
) {
  const existing = await prisma.user.findUnique({ where: { email: u.email } });
  if (existing) {
    console.log(`  Skipped existing user: ${u.email}`);
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      email: u.email,
      passwordHash,
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - Math.random() * 3_600_000),
      profile: {
        create: {
          displayName: u.name,
          headline: u.headline,
          bio: u.bio,
          location: u.location,
          experienceLevel: u.experienceLevel,
          availability: u.availability,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff&size=200`,
          isPublic: true,
        },
      },
    },
    include: { profile: true },
  });

  const profileId = user.profile!.id;
  for (const s of u.skills) {
    const skillId = skillMap.get(s.name);
    if (skillId) {
      await prisma.profileSkill.upsert({
        where: { profileId_skillId: { profileId, skillId } },
        update: { proficiency: s.proficiency },
        create: { profileId, skillId, proficiency: s.proficiency },
      });
    }
  }

  const skillCount = u.skills.length;
  await prisma.profile.update({
    where: { id: profileId },
    data: {
      profileCompleteness: Math.min(30 + skillCount * 10, 100),
      reputationScore: skillCount * 10 + Math.floor(Math.random() * 30),
    },
  });

  console.log(`  Created user: ${u.email} (${u.name})`);
  return user;
}

async function createSwipe(
  sourceId: string,
  targetId: string,
  action: SwipeAction,
) {
  await prisma.swipe.upsert({
    where: { sourceId_targetId: { sourceId, targetId } },
    update: { action },
    create: { sourceId, targetId, action },
  });
}

async function createMatch(
  userOneId: string,
  userTwoId: string,
  matchScore: number,
  messages?: { senderIdx: 0 | 1; content: string }[],
) {
  const [u1, u2] = [userOneId, userTwoId].sort();

  const match = await prisma.match.upsert({
    where: { userOneId_userTwoId: { userOneId: u1, userTwoId: u2 } },
    update: { status: 'ACTIVE', matchScore },
    create: { userOneId: u1, userTwoId: u2, matchScore },
  });

  const existingConv = await prisma.conversation.findUnique({ where: { matchId: match.id } });
  if (existingConv) return match;

  const conv = await prisma.conversation.create({
    data: {
      matchId: match.id,
      members: { create: [{ userId: u1 }, { userId: u2 }] },
    },
  });

  if (messages && messages.length > 0) {
    const userIds = [u1, u2];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: userIds[m.senderIdx],
          content: m.content,
          status: 'DELIVERED',
          deliveredAt: new Date(Date.now() - (messages.length - i) * 60_000),
        },
      });
    }
  }

  return match;
}

async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  DevConnect — Full Seed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await seedSkills();
  const skillMap = await getSkillMap();
  console.log(`  Skills seeded: ${SKILLS.length}\n`);

  const adminEmail = 'admin@devconnect.dev';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        lastLoginAt: new Date(),
        profile: {
          create: {
            displayName: 'Platform Admin',
            headline: 'Managing the DevConnect network',
            isPublic: false,
          },
        },
      },
    });
    console.log(`  ┌──────────────────────────────────────────────────┐`);
    console.log(`  │  ADMIN ACCOUNT (change password after login)      │`);
    console.log(`  │  Email:    ${adminEmail.padEnd(46)}│`);
    console.log(`  │  Password: ${adminPassword.padEnd(46)}│`);
    console.log(`  └──────────────────────────────────────────────────┘\n`);
  } else {
    console.log(`  Admin account exists: ${adminEmail}\n`);
  }

  const passwordHash = await bcrypt.hash('Password123!', 12);
  const createdUsers: Array<{ id: string; email: string; name: string }> = [];

  for (const u of USERS) {
    const user = await createUser(u, passwordHash, skillMap);
    createdUsers.push({ id: user.id, email: user.email, name: u.name });
  }

  console.log(`\n  All users use password: Password123!`);

  // ─── Swipes & Matches ─────────────────────────────
  console.log(`\n  Creating swipes and matches...`);

  const [alice, bob, carol, dave, eve, frank, grace, henry] = createdUsers;

  // Match 1: Alice ↔ Bob (mutual like, full stack + backend)
  await createSwipe(alice.id, bob.id, 'LIKE');
  await createSwipe(bob.id, alice.id, 'LIKE');
  await createMatch(alice.id, bob.id, 78, [
    { senderIdx: 0, content: 'Hey Bob! Love your work on distributed systems.' },
    { senderIdx: 1, content: 'Thanks Alice! Your full-stack skills are impressive. Want to collaborate on something?' },
    { senderIdx: 0, content: 'Absolutely! I\'ve been thinking about building an open-source devtools platform. Would you be interested?' },
    { senderIdx: 1, content: 'That sounds great! I can handle the infrastructure and API layer.' },
  ]);
  console.log(`  ✅ Match: Alice ↔ Bob (78%) with 4 messages`);

  // Match 2: Carol ↔ Dave (mutual like, AI + mobile)
  await createSwipe(carol.id, dave.id, 'SUPER_LIKE');
  await createSwipe(dave.id, carol.id, 'LIKE');
  await createMatch(carol.id, dave.id, 65, [
    { senderIdx: 0, content: 'Hi Dave! I have an idea for an AI-powered mobile app. Interested?' },
    { senderIdx: 1, content: 'That sounds right up my alley! What kind of app?' },
  ]);
  console.log(`  ✅ Match: Carol ↔ Dave (65%) with 2 messages`);

  // Match 3: Eve ↔ Frank (mutual like, Web3 + DevOps)
  await createSwipe(eve.id, frank.id, 'LIKE');
  await createSwipe(frank.id, eve.id, 'LIKE');
  await createMatch(eve.id, frank.id, 55, [
    { senderIdx: 0, content: 'Hey Frank, need a DevOps guru for my DeFi project. Interested?' },
    { senderIdx: 1, content: 'Definitely! I\'ve been wanting to work on something in Web3.' },
  ]);
  console.log(`  ✅ Match: Eve ↔ Frank (55%) with 2 messages`);

  // Match 4: Grace ↔ Henry (mutual like, full stack + data)
  await createSwipe(grace.id, henry.id, 'LIKE');
  await createSwipe(henry.id, grace.id, 'LIKE');
  await createMatch(grace.id, henry.id, 62);
  console.log(`  ✅ Match: Grace ↔ Henry (62%) — no messages yet`);

  // Pending invitations (single-direction likes):
  async function createInvitation(senderId: string, receiverId: string, message: string) {
    const existing = await prisma.invitation.findFirst({
      where: { senderId, receiverId },
    });
    if (!existing) {
      await prisma.invitation.create({
        data: { senderId, receiverId, message, status: 'PENDING' },
      });
    }
  }

  // Alice likes Carol (Carol hasn't responded)
  await createSwipe(alice.id, carol.id, 'LIKE');
  await createInvitation(alice.id, carol.id, 'Love your ML work! Would love to collaborate.');
  console.log(`  🔔 Invitation: Alice → Carol (pending)`);

  // Bob likes Grace (Grace hasn't responded)
  await createSwipe(bob.id, grace.id, 'LIKE');
  await createInvitation(bob.id, grace.id, 'Hey Grace, love your UI work! Need a backend partner?');
  console.log(`  🔔 Invitation: Bob → Grace (pending)`);

  // Passes (rejected):
  await createSwipe(dave.id, frank.id, 'PASS');
  await createSwipe(carol.id, frank.id, 'PASS');
  console.log(`  ❌ Pass: Dave → Frank, Carol → Frank`);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('  Seed Complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n  Users:`);
  for (const u of createdUsers) {
    const matchCount = await prisma.match.count({
      where: { OR: [{ userOneId: u.id }, { userTwoId: u.id }], status: 'ACTIVE' },
    });
    console.log(`    ${u.email.padEnd(28)} → ${u.name.padEnd(18)} ${matchCount} match${matchCount !== 1 ? 'es' : ''}`);
  }
  console.log(`\n  Login with email + password: Password123!\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
