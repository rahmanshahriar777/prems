import { departmentsData, employeesData } from '../packages/database/prisma/seed-datasheet';

async function run() {
  console.log(`Preparing to import ${departmentsData.length} departments and ${employeesData.length} employees to live deployment...`);

  // 1. Authenticate to live API
  console.log('\nLogging into live deployment (https://34.46.124.175.sslip.io)...');
  const loginRes = await fetch('https://34.46.124.175.sslip.io/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@ems.local', password: 'Password123!' })
  });

  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data?.tokens?.accessToken) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.data.tokens.accessToken;
  console.log('✅ Authenticated successfully as:', loginData.data.user.email);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Bulk Import Departments
  console.log(`\nImporting ${departmentsData.length} departments via /api/v1/departments/bulk-import...`);
  const depPayload = departmentsData.map(d => ({
    code: d.code,
    name: d.name,
    description: `[${d.tier}] Lead: ${d.head}. ${d.description}`
  }));

  const depRes = await fetch('https://34.46.124.175.sslip.io/api/v1/departments/bulk-import', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(depPayload)
  });
  const depResult = await depRes.json();
  console.log('Departments Import Response:', JSON.stringify(depResult, null, 2));

  // 3. Bulk Import Employees
  console.log(`\nImporting ${employeesData.length} employees via /api/v1/employees/bulk-import...`);
  const empPayload = employeesData.map(e => ({
    employeeNumber: e.employeeNumber,
    firstName: e.firstName,
    lastName: e.lastName,
    fullName: `${e.firstName} ${e.lastName}`,
    email: e.email,
    jobTitle: e.title,
    departmentCode: e.deptCode,
    phone: e.phone,
    status: 'FULL_TIME',
    coreResponsibilities: e.coreResponsibilities
  }));

  const empRes = await fetch('https://34.46.124.175.sslip.io/api/v1/employees/bulk-import', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(empPayload)
  });
  const empResult = await empRes.json();
  console.log('Employees Import Response:', JSON.stringify(empResult, null, 2));

  // 4. Verify listing
  const getDeps = await (await fetch('https://34.46.124.175.sslip.io/api/v1/departments', { headers: authHeaders })).json();
  console.log(`\n=== LIVE DEPARTMENTS VERIFICATION (${getDeps.data?.length || 0}) ===`);
  for (const d of getDeps.data || []) {
    console.log(` - [${d.code}] ${d.name} (${d._count?.employees || 0} employees)`);
  }

  const getEmps = await (await fetch('https://34.46.124.175.sslip.io/api/v1/employees?limit=50', { headers: authHeaders })).json();
  console.log(`\n=== LIVE EMPLOYEES VERIFICATION (${getEmps.data?.employees?.length || 0}) ===`);
  for (const e of getEmps.data?.employees || []) {
    console.log(` - [${e.employeeCode}] ${e.user?.firstName} ${e.user?.lastName} | ${e.designation?.title || 'N/A'} | Dept: ${e.department?.name || 'N/A'}`);
  }
}

run().catch(console.error);
