/// <reference types="node" />
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@siapee.local';
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: hash,
        role: Role.ADMIN,
      }
    });
    console.log('Admin user created:', adminEmail, 'password: admin123');
  } else {
    console.log('Admin already exists');
  }

  // Create a sample class and students if not exist
  let klass = await prisma.class.findFirst({ where: { code: '2B-2025' } })
  if (!klass) {
    klass = await prisma.class.create({ data: { name: '2º ano B', code: '2B-2025', year: new Date().getFullYear() } })
    const students = await prisma.$transaction([
      prisma.student.create({ data: { name: 'Brenda Rodrigues Arceno' } }),
      prisma.student.create({ data: { name: 'Aluno 2' } }),
      prisma.student.create({ data: { name: 'Aluno 3' } }),
      prisma.student.create({ data: { name: 'Aluno 4' } }),
    ])
    for (const s of students) {
      await prisma.enrollment.create({ data: { classId: klass.id, studentId: (s as any).id } })
    }
    console.log('Seeded class and students')
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
