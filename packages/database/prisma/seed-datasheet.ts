import 'dotenv/config';
import { PrismaClient, SystemRole, EmploymentStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = 'ems_demo_static_salt_for_seeding_123';
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$100000$${salt}$${hash}`;
}

export const departmentsData = [
  {
    code: 'D01',
    name: 'Executive Leadership & Board',
    tier: 'Tier 1 - Governance',
    head: 'Stephanie White (CEO)',
    description: 'Sets overall company strategy, governs the business on behalf of ownership, oversees the Executive team, and manages relationships with external partners (accountants, law firm, IT).',
  },
  {
    code: 'D02',
    name: 'Operations (COO)',
    tier: 'Tier 2 - Senior Management',
    head: 'Natalie White (COO)',
    description: 'Owns organisational structure, strategic growth, innovation and change, people management and external consultant relationships across the business.',
  },
  {
    code: 'D03',
    name: 'Finance & Accounts',
    tier: 'Tier 2 - Senior Management',
    head: 'Frankie White (CFO)',
    description: 'Manages company accounts, payroll, financial reporting, VAT/HMRC compliance, accounts payable/receivable, and financial oversight of jobs and subcontractors.',
  },
  {
    code: 'D04',
    name: 'Scheduling & Client Services',
    tier: 'Tier 3 - Functional Management',
    head: 'Jay Boyd-Carpenter',
    description: 'Coordinates job scheduling, customer communication, enquiry handling and liaison between the office, field teams and subcontractors.',
  },
  {
    code: 'D05',
    name: 'Health & Safety (H&S)',
    tier: 'Tier 3 - Functional Management (Elevated)',
    head: 'Charlie Kingham',
    description: 'Manages H&S paperwork, crew training, equipment/PPE inspection, site inspections, first aid, fire safety and compliance testing across all jobs.',
  },
  {
    code: 'D06',
    name: 'Field Operations',
    tier: 'Tier 3 - Functional Management',
    head: 'Deke Rivers',
    description: 'Manages large jobs and subcontractors on site, equipment and fabrication ordering, yard operations, project management, drawings and field visits.',
  },
  {
    code: 'D07',
    name: 'Reception & Front Office',
    tier: 'Tier 4 - Administrative Support',
    head: 'Aimee Daffin',
    description: 'First point of contact for enquiries, sales lead sorting, HR file administration, ad-hoc accounts support and vehicle tracking.',
  },
  {
    code: 'D08',
    name: 'Yard & Materials Management',
    tier: 'Tier 4 - Operational Support',
    head: 'Tony Lloyd',
    description: 'Manages the yard, materials, stock, fixings, sealants and the company vehicle fleet, supporting field operations.',
  },
  {
    code: 'D09',
    name: 'Roofing Team (In-House)',
    tier: 'Tier 5 - Field Delivery',
    head: 'Ethan Wood (Foreman) / Line Mgr: Natalie S.',
    description: 'Delivers on-site roofing work under field supervision; includes site foremen and roofers who execute scheduled jobs.',
  },
  {
    code: 'D10',
    name: 'Subcontractor Network',
    tier: 'External / Extended Workforce',
    head: 'Contracts Manager (vacant) / CEO oversight',
    description: 'External roofing and trade subcontractors engaged for job delivery, managed via the Contracts Manager and CEO-level relationship oversight.',
  },
];

export interface EmployeeData {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  deptCode: string;
  reportsToCode?: string;
  status: EmploymentStatus;
  role: SystemRole;
  phone: string;
  coreResponsibilities: string;
}

export const employeesData: EmployeeData[] = [
  {
    employeeNumber: 'E01',
    firstName: 'Richard',
    lastName: 'White',
    email: 'richard.white@ems.local',
    title: 'Director',
    deptCode: 'D01',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.SUPER_ADMIN,
    phone: '+44 117 900 0001',
    coreResponsibilities: 'Accountable for Service & People KPIs; annual and weekly jobs management; scheduling management; people management.',
  },
  {
    employeeNumber: 'E02',
    firstName: 'Debbie',
    lastName: 'White',
    email: 'debbie.white@ems.local',
    title: 'Director',
    deptCode: 'D01',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.SUPER_ADMIN,
    phone: '+44 117 900 0002',
    coreResponsibilities: 'Board-level strategic oversight; shares Director-level responsibilities with Richard White.',
  },
  {
    employeeNumber: 'E03',
    firstName: 'Stephanie',
    lastName: 'White',
    email: 'stephanie.white@ems.local',
    title: 'Chief Executive Officer (CEO)',
    deptCode: 'D01',
    reportsToCode: 'E01',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.SUPER_ADMIN,
    phone: '+44 117 900 0003',
    coreResponsibilities: 'Accountable for Sales & Service KPIs; responsible for all KPIs and the organisation as a whole; people management of COO, CFO, H&S and Contracts Manager.',
  },
  {
    employeeNumber: 'E04',
    firstName: 'Rasel',
    lastName: 'Mahmud',
    email: 'rasel.mahmud@ems.local',
    title: 'Non-Executive',
    deptCode: 'D01',
    reportsToCode: 'E03',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0004',
    coreResponsibilities: 'Non-executive oversight function; direct line manager to Field Manager (Deke Rivers).',
  },
  {
    employeeNumber: 'E05',
    firstName: 'Natalie',
    lastName: 'White',
    email: 'natalie.white@ems.local',
    title: 'Chief Operating Officer (COO)',
    deptCode: 'D02',
    reportsToCode: 'E03',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.HR_ADMIN,
    phone: '+44 117 900 0005',
    coreResponsibilities: 'Accountable for organisational structure; strategy & growth; innovation and change management; people and KPI management; external consultant relationships.',
  },
  {
    employeeNumber: 'E06',
    firstName: 'Frankie',
    lastName: 'White',
    email: 'frankie.white@ems.local',
    title: 'Chief Financial Officer (CFO)',
    deptCode: 'D03',
    reportsToCode: 'E03',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.MANAGER,
    phone: '+44 117 900 0006',
    coreResponsibilities: 'Accountable for Cost/Sales/Processes/Asset/People KPIs; Financial Controller for procurements; accounts, payroll and reporting; direct management of Reception and Accounts Manager.',
  },
  {
    employeeNumber: 'E07',
    firstName: 'Pantea',
    lastName: 'Rezvani',
    email: 'pantea.rezvani@ems.local',
    title: 'Assistant Accounts Manager',
    deptCode: 'D03',
    reportsToCode: 'E06',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0007',
    coreResponsibilities: 'Accounts payable/receivable; payroll processing; VAT returns; HMRC filing; job & cost tracking; financial reporting; audits; end-of-year accounts.',
  },
  {
    employeeNumber: 'E08',
    firstName: 'Jay',
    lastName: 'Boyd-Carpenter',
    email: 'jay.boyd@ems.local',
    title: 'Scheduling & Client Services',
    deptCode: 'D04',
    reportsToCode: 'E05',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.MANAGER,
    phone: '+44 117 900 0008',
    coreResponsibilities: 'Jobs management; scheduling; customer/field/subcontractor communication; liaison with field manager; enquiry management; project management.',
  },
  {
    employeeNumber: 'E09',
    firstName: 'Charlie',
    lastName: 'Kingham',
    email: 'charlie.kingham@ems.local',
    title: 'H&S Supervisor',
    deptCode: 'D05',
    reportsToCode: 'E03',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.MANAGER,
    phone: '+44 117 900 0009',
    coreResponsibilities: 'H&S paperwork for all jobs; crew training and training matrix; tools/PPE inspection; site inspections; first aid; fire safety; compliance.',
  },
  {
    employeeNumber: 'E10',
    firstName: 'Deke',
    lastName: 'Rivers',
    email: 'deke.rivers@ems.local',
    title: 'Field Manager',
    deptCode: 'D06',
    reportsToCode: 'E04',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.MANAGER,
    phone: '+44 117 900 0010',
    coreResponsibilities: 'Large job management; subcontractor management; measurement; ordering equipment/fabrication; yard management; field visits; project management; drawings.',
  },
  {
    employeeNumber: 'E11',
    firstName: 'Aimee',
    lastName: 'Daffin',
    email: 'aimee.daffin@ems.local',
    title: 'Reception & Front Office Administrator',
    deptCode: 'D07',
    reportsToCode: 'E06',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0011',
    coreResponsibilities: 'Enquiry management; sorting sales leads; annual jobs management; gatekeeper of HR files; ad-hoc accounts support; vehicle tracking.',
  },
  {
    employeeNumber: 'E12',
    firstName: 'Tony',
    lastName: 'Lloyd',
    email: 'tony.lloyd@ems.local',
    title: 'Yard Manager',
    deptCode: 'D08',
    reportsToCode: 'E10',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0012',
    coreResponsibilities: 'Yard management; materials and stock level management; fixings/sealants management; fleet management; vehicle servicing; aiding Field Manager on projects.',
  },
  {
    employeeNumber: 'E13',
    firstName: 'Ethan',
    lastName: 'Wood',
    email: 'ethan.wood@ems.local',
    title: 'Foreman',
    deptCode: 'D09',
    reportsToCode: 'E05',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.MANAGER,
    phone: '+44 117 900 0013',
    coreResponsibilities: 'Leads on-site roofing crew; foreman-level site responsibility and quality control; first point of on-site escalation.',
  },
  {
    employeeNumber: 'E14',
    firstName: 'Lee',
    lastName: 'Merrett',
    email: 'lee.merrett@ems.local',
    title: 'Roofer (lone-work certified)',
    deptCode: 'D09',
    reportsToCode: 'E13',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0014',
    coreResponsibilities: 'On-site roofing installation and repair; approved to work alone on site under H&S protocol.',
  },
  {
    employeeNumber: 'E15',
    firstName: 'Lewis',
    lastName: 'Bowle',
    email: 'lewis.bowle@ems.local',
    title: 'Roofer',
    deptCode: 'D09',
    reportsToCode: 'E13',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0015',
    coreResponsibilities: 'On-site roofing installation and repair.',
  },
  {
    employeeNumber: 'E16',
    firstName: 'Lewis',
    lastName: 'Evans',
    email: 'lewis.evans@ems.local',
    title: 'Roofer',
    deptCode: 'D09',
    reportsToCode: 'E13',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0016',
    coreResponsibilities: 'On-site roofing installation and repair.',
  },
  {
    employeeNumber: 'E17',
    firstName: 'Jay',
    lastName: 'Tomms',
    email: 'jay.tomms@ems.local',
    title: 'Roofer',
    deptCode: 'D09',
    reportsToCode: 'E13',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0017',
    coreResponsibilities: 'On-site roofing installation and repair.',
  },
  {
    employeeNumber: 'E18',
    firstName: 'Will',
    lastName: 'Hodgkins',
    email: 'will.hodgkins@ems.local',
    title: 'Roofer',
    deptCode: 'D09',
    reportsToCode: 'E13',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0018',
    coreResponsibilities: 'On-site roofing installation and repair.',
  },
  {
    employeeNumber: 'E19',
    firstName: 'Matt',
    lastName: 'Galpin',
    email: 'matt.galpin@ems.local',
    title: 'Roofer',
    deptCode: 'D09',
    reportsToCode: 'E13',
    status: EmploymentStatus.FULL_TIME,
    role: SystemRole.EMPLOYEE,
    phone: '+44 117 900 0019',
    coreResponsibilities: 'On-site roofing installation and repair.',
  },
];

export async function seedPracticalRoofingDataset() {
  console.log('🏛️ Importing Practical Roofing EMS Dataset into database...');
  const passwordHash = hashPassword('Password123!');

  // Fetch or create roles
  const rolesMap: Record<string, any> = {};
  for (const roleName of [SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.MANAGER, SystemRole.EMPLOYEE, SystemRole.AUDITOR]) {
    rolesMap[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, isSystem: true },
    });
  }

  // 1. Seed Departments
  const deptMap = new Map<string, any>();
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: {
        name: d.name,
        description: `[${d.tier}] ${d.description}`,
      },
      create: {
        code: d.code,
        name: d.name,
        description: `[${d.tier}] ${d.description}`,
      },
    });
    deptMap.set(d.code, dept);
  }
  console.log(`✅ Seeded ${deptMap.size} Practical Roofing departments.`);

  // 2. Seed Designations
  const desigMap = new Map<string, any>();
  for (const emp of employeesData) {
    const code = 'DES-' + emp.title.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);
    const dept = deptMap.get(emp.deptCode);
    const desig = await prisma.designation.upsert({
      where: { code },
      update: {
        title: emp.title,
        departmentId: dept?.id,
      },
      create: {
        code,
        title: emp.title,
        departmentId: dept?.id,
      },
    });
    desigMap.set(emp.title, desig);
  }
  console.log(`✅ Seeded ${desigMap.size} designations.`);

  // 3. Seed Users and Employees (Pass 1: Create without manager)
  const empMap = new Map<string, any>();
  for (const empData of employeesData) {
    const user = await prisma.user.upsert({
      where: { email: empData.email },
      update: { passwordHash },
      create: {
        email: empData.email,
        passwordHash,
        roles: {
          create: {
            roleId: rolesMap[empData.role]?.id || rolesMap[SystemRole.EMPLOYEE].id,
          },
        },
      },
    });

    const dept = deptMap.get(empData.deptCode);
    const desig = desigMap.get(empData.title);

    const employee = await prisma.employee.upsert({
      where: { email: empData.email },
      update: {
        employeeNumber: empData.employeeNumber,
        firstName: empData.firstName,
        lastName: empData.lastName,
        phone: empData.phone,
        departmentId: dept?.id,
        designationId: desig?.id,
        status: empData.status,
        profileSummary: empData.coreResponsibilities,
      },
      create: {
        employeeNumber: empData.employeeNumber,
        userId: user.id,
        firstName: empData.firstName,
        lastName: empData.lastName,
        email: empData.email,
        phone: empData.phone,
        departmentId: dept?.id,
        designationId: desig?.id,
        status: empData.status,
        joiningDate: new Date('2024-01-15'),
        profileSummary: empData.coreResponsibilities,
      },
    });

    empMap.set(empData.employeeNumber, employee);
  }

  // 4. Pass 2: Link reporting managers
  for (const empData of employeesData) {
    if (empData.reportsToCode && empMap.has(empData.reportsToCode)) {
      const manager = empMap.get(empData.reportsToCode);
      await prisma.employee.update({
        where: { employeeNumber: empData.employeeNumber },
        data: { managerId: manager.id },
      });
    }
  }

  // 5. Update Department Head References
  const headMappings: Record<string, string> = {
    D01: 'E03', // Stephanie White (CEO)
    D02: 'E05', // Natalie White (COO)
    D03: 'E06', // Frankie White (CFO)
    D04: 'E08', // Jay Boyd-Carpenter
    D05: 'E09', // Charlie Kingham
    D06: 'E10', // Deke Rivers
    D07: 'E11', // Aimee Daffin
    D08: 'E12', // Tony Lloyd
    D09: 'E13', // Ethan Wood (Foreman)
  };

  for (const [deptCode, empNum] of Object.entries(headMappings)) {
    const dept = deptMap.get(deptCode);
    const headEmp = empMap.get(empNum);
    if (dept && headEmp) {
      await prisma.department.update({
        where: { id: dept.id },
        data: { headEmployeeId: headEmp.id },
      });
    }
  }

  console.log(`🎉 Successfully imported all ${employeesData.length} employees and ${departmentsData.length} departments!`);
}

if (require.main === module) {
  seedPracticalRoofingDataset()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
