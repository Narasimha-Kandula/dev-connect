import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
    console.log('Creating default admin user (admin@devconnect.dev / ChangeMe123!)...');
    const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        profile: { create: { displayName: 'Platform Admin' } },
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
