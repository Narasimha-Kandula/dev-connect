import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const SKILLS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'NestJS', 'Python', 'Django',
  'Go', 'Rust', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Docker', 'Kubernetes',
  'AWS', 'AI/ML', 'TensorFlow', 'React Native', 'Flutter', 'Solidity',
];

async function main() {
  console.log('Seeding skills...');
  for (const name of SKILLS) {
    await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
  }

  const adminEmail = 'admin@devconnect.dev';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    console.log('Creating default administrator...');
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        profile: { create: { displayName: 'Platform Admin', headline: 'Managing the DevConnect network' } },
      },
    });
    console.log(`\n  ┌──────────────────────────────────────────────┐`);
    console.log(`  │  ADMIN ACCOUNT CREATED                       │`);
    console.log(`  │  Email:    ${adminEmail.padEnd(36)}│`);
    console.log(`  │  Password: ${adminPassword.padEnd(36)}│`);
    console.log(`  │  CHANGE THIS PASSWORD IMMEDIATELY AFTER LOGIN│`);
    console.log(`  └──────────────────────────────────────────────┘\n`);
  }

  const sampleUsers = [
    { email: 'alice@example.com', name: 'Alice Chen', headline: 'Full-stack engineer passionate about EdTech' },
    { email: 'bob@example.com', name: 'Bob Martinez', headline: 'Backend & infrastructure specialist' },
  ];

  for (const u of sampleUsers) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      const passwordHash = await bcrypt.hash('Password123!', 12);
      const user = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash,
          emailVerified: true,
          profile: {
            create: {
              displayName: u.name,
              headline: u.headline,
              bio: `${u.name} is an experienced developer building on DevConnect.`,
            },
          },
        },
        include: { profile: true },
      });

      const react = await prisma.skill.findUnique({ where: { name: 'React' } });
      const node = await prisma.skill.findUnique({ where: { name: 'Node.js' } });
      const pg = await prisma.skill.findUnique({ where: { name: 'PostgreSQL' } });
      const skills = [react, node, pg].filter(Boolean);

      for (const skill of skills) {
        await prisma.profileSkill.create({
          data: { profileId: user.profile!.id, skillId: skill!.id, proficiency: 4 },
        });
      }

      console.log(`  Created sample user: ${u.email}`);
    }
  }

  console.log('Setup complete — ready to connect developers.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
