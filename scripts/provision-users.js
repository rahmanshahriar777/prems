const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

// User credentials and role definitions
const employeeAccounts = [
  {
    employeeNumber: 'E01',
    firstName: 'Richard',
    lastName: 'White',
    email: 'richard.white@ems.local',
    role: 'SUPER_ADMIN',
    password: 'Password123!',
    title: 'Director',
    dept: 'Executive Leadership & Board'
  },
  {
    employeeNumber: 'E02',
    firstName: 'Debbie',
    lastName: 'White',
    email: 'debbie.white@ems.local',
    role: 'SUPER_ADMIN',
    password: 'Password123!',
    title: 'Director',
    dept: 'Executive Leadership & Board'
  },
  {
    employeeNumber: 'E03',
    firstName: 'Stephanie',
    lastName: 'White',
    email: 'stephanie.white@ems.local',
    role: 'SUPER_ADMIN',
    password: 'Password123!',
    title: 'Chief Executive Officer (CEO)',
    dept: 'Executive Leadership & Board'
  },
  {
    employeeNumber: 'EMP-2026-0004',
    firstName: 'Rasel',
    lastName: 'Mahmud',
    email: 'rasel.mahmud@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Non-Executive',
    dept: 'Executive Leadership & Board'
  },
  {
    employeeNumber: 'E05',
    firstName: 'Natalie',
    lastName: 'White',
    email: 'natalie.white@ems.local',
    role: 'HR_ADMIN',
    password: 'Password123!',
    title: 'Chief Operating Officer (COO)',
    dept: 'Operations (COO)'
  },
  {
    employeeNumber: 'E06',
    firstName: 'Frankie',
    lastName: 'White',
    email: 'frankie.white@ems.local',
    role: 'MANAGER',
    password: 'Password123!',
    title: 'Chief Financial Officer (CFO)',
    dept: 'Finance & Accounts'
  },
  {
    employeeNumber: 'E07',
    firstName: 'Pantea',
    lastName: 'Rezvani',
    email: 'pantea.rezvani@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Assistant Accounts Manager',
    dept: 'Finance & Accounts'
  },
  {
    employeeNumber: 'E08',
    firstName: 'Jay',
    lastName: 'Boyd-Carpenter',
    email: 'jay.boyd@ems.local',
    role: 'MANAGER',
    password: 'Password123!',
    title: 'Scheduling & Client Services',
    dept: 'Scheduling & Client Services'
  },
  {
    employeeNumber: 'E09',
    firstName: 'Charlie',
    lastName: 'Kingham',
    email: 'charlie.kingham@ems.local',
    role: 'MANAGER',
    password: 'Password123!',
    title: 'H&S Supervisor',
    dept: 'Health & Safety (H&S)'
  },
  {
    employeeNumber: 'E10',
    firstName: 'Deke',
    lastName: 'Rivers',
    email: 'deke.rivers@ems.local',
    role: 'MANAGER',
    password: 'Password123!',
    title: 'Field Manager',
    dept: 'Field Operations'
  },
  {
    employeeNumber: 'E11',
    firstName: 'Aimee',
    lastName: 'Daffin',
    email: 'aimee.daffin@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Reception & Front Office Administrator',
    dept: 'Reception & Front Office'
  },
  {
    employeeNumber: 'E12',
    firstName: 'Tony',
    lastName: 'Lloyd',
    email: 'tony.lloyd@ems.local',
    role: 'MANAGER',
    password: 'Password123!',
    title: 'Yard Manager',
    dept: 'Yard & Materials Management'
  },
  {
    employeeNumber: 'E13',
    firstName: 'Ethan',
    lastName: 'Wood',
    email: 'ethan.wood@ems.local',
    role: 'MANAGER',
    password: 'Password123!',
    title: 'Foreman',
    dept: 'Roofing Team (In-House)'
  },
  {
    employeeNumber: 'E14',
    firstName: 'Lee',
    lastName: 'Merrett',
    email: 'lee.merrett@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Roofer (lone-work certified)',
    dept: 'Roofing Team (In-House)'
  },
  {
    employeeNumber: 'E15',
    firstName: 'Lewis',
    lastName: 'Bowle',
    email: 'lewis.bowle@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Roofer',
    dept: 'Roofing Team (In-House)'
  },
  {
    employeeNumber: 'E16',
    firstName: 'Lewis',
    lastName: 'Evans',
    email: 'lewis.evans@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Roofer',
    dept: 'Roofing Team (In-House)'
  },
  {
    employeeNumber: 'E17',
    firstName: 'Jay',
    lastName: 'Tomms',
    email: 'jay.tomms@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Roofer',
    dept: 'Roofing Team (In-House)'
  },
  {
    employeeNumber: 'E18',
    firstName: 'Will',
    lastName: 'Hodgkins',
    email: 'will.hodgkins@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Roofer',
    dept: 'Roofing Team (In-House)'
  },
  {
    employeeNumber: 'E19',
    firstName: 'Matt',
    lastName: 'Galpin',
    email: 'matt.galpin@ems.local',
    role: 'EMPLOYEE',
    password: 'Password123!',
    title: 'Roofer',
    dept: 'Roofing Team (In-House)'
  },
  {
    employeeNumber: 'EMP-2026-0001',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'superadmin@ems.local',
    role: 'SUPER_ADMIN',
    password: 'Password123!',
    title: 'Principal Architect & Super Admin',
    dept: 'Engineering'
  },
  {
    employeeNumber: 'OPS-ADMIN',
    firstName: 'Operations',
    lastName: 'Admin',
    email: 'operations@ems.local',
    role: 'HR_ADMIN',
    password: 'Password123!',
    title: 'Operations & HR Administrator',
    dept: 'Operations (COO)'
  }
];

async function main() {
  console.log('Provisioning login accounts and roles for all employees...');

  // Fetch all system roles
  const roles = await prisma.role.findMany();
  const roleMap = new Map();
  roles.forEach(r => roleMap.set(r.name, r.id));

  console.log('Available roles:', Array.from(roleMap.keys()));

  for (const acc of employeeAccounts) {
    const roleId = roleMap.get(acc.role) || roleMap.get('EMPLOYEE');
    const pwdHash = hashPassword(acc.password);

    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        passwordHash: pwdHash,
        isActive: true,
        deletedAt: null
      },
      create: {
        email: acc.email,
        passwordHash: pwdHash,
        isActive: true
      }
    });

    // 2. Ensure UserRole mapping
    await prisma.userRole.deleteMany({
      where: { userId: user.id }
    });
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: roleId
      }
    });

    // 3. Link Employee to User
    const emp = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: acc.email },
          { employeeNumber: acc.employeeNumber }
        ]
      }
    });

    if (emp) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          userId: user.id,
          email: acc.email,
          deletedAt: null
        }
      });
      console.log(`✅ [${acc.employeeNumber}] ${acc.firstName} ${acc.lastName} -> User ${acc.email} (Role: ${acc.role})`);
    } else {
      console.log(`ℹ️ [${acc.employeeNumber}] User account ${acc.email} created (System Admin/Ops)`);
    }
  }

  console.log('\nAll employee login accounts provisioned successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
