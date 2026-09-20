async function validateAllLogins() {
  const employees = [
    { code: 'E01', name: 'Richard White', email: 'richard.white@ems.local', expectedRole: 'SUPER_ADMIN' },
    { code: 'E02', name: 'Debbie White', email: 'debbie.white@ems.local', expectedRole: 'SUPER_ADMIN' },
    { code: 'E03', name: 'Stephanie White', email: 'stephanie.white@ems.local', expectedRole: 'SUPER_ADMIN' },
    { code: 'EMP-2026-0004', name: 'Rasel Mahmud', email: 'rasel.mahmud@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'E05', name: 'Natalie White', email: 'natalie.white@ems.local', expectedRole: 'HR_ADMIN' },
    { code: 'E06', name: 'Frankie White', email: 'frankie.white@ems.local', expectedRole: 'MANAGER' },
    { code: 'E07', name: 'Pantea Rezvani', email: 'pantea.rezvani@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'E08', name: 'Jay Boyd-Carpenter', email: 'jay.boyd@ems.local', expectedRole: 'MANAGER' },
    { code: 'E09', name: 'Charlie Kingham', email: 'charlie.kingham@ems.local', expectedRole: 'MANAGER' },
    { code: 'E10', name: 'Deke Rivers', email: 'deke.rivers@ems.local', expectedRole: 'MANAGER' },
    { code: 'E11', name: 'Aimee Daffin', email: 'aimee.daffin@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'E12', name: 'Tony Lloyd', email: 'tony.lloyd@ems.local', expectedRole: 'MANAGER' },
    { code: 'E13', name: 'Ethan Wood', email: 'ethan.wood@ems.local', expectedRole: 'MANAGER' },
    { code: 'E14', name: 'Lee Merrett', email: 'lee.merrett@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'E15', name: 'Lewis Bowle', email: 'lewis.bowle@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'E16', name: 'Lewis Evans', email: 'lewis.evans@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'E17', name: 'Jay Tomms', email: 'jay.tomms@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'E18', name: 'Will Hodgkins', email: 'will.hodgkins@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'E19', name: 'Matt Galpin', email: 'matt.galpin@ems.local', expectedRole: 'EMPLOYEE' },
    { code: 'EMP-2026-0001', name: 'System Administrator', email: 'superadmin@ems.local', expectedRole: 'SUPER_ADMIN' },
    { code: 'OPS-ADMIN', name: 'Operations Admin', email: 'operations@ems.local', expectedRole: 'HR_ADMIN' },
  ];

  const password = 'Password123!';
  console.log(`\nValidating live logins on https://34.46.124.175.sslip.io for ${employees.length} accounts...\n`);

  let successCount = 0;
  for (const emp of employees) {
    try {
      const res = await fetch('https://34.46.124.175.sslip.io/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emp.email, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const roles = data.data.user.roles.join(', ');
        const employeeId = data.data.user.employeeId ? 'Linked' : 'AdminOnly';
        console.log(`✅ [SUCCESS] ${emp.code.padEnd(14)} | ${emp.name.padEnd(22)} | ${emp.email.padEnd(28)} | Role: [${roles}] | Status: ${employeeId}`);
        successCount++;
      } else {
        console.error(`❌ [FAILED] ${emp.code.padEnd(14)} | ${emp.name.padEnd(22)} | ${emp.email.padEnd(28)} | Error: ${JSON.stringify(data.error || data)}`);
      }
    } catch (err: any) {
      console.error(`❌ [ERROR] ${emp.code.padEnd(14)} | ${emp.name.padEnd(22)} | Error: ${err.message}`);
    }
  }

  console.log(`\nSummary: ${successCount} / ${employees.length} accounts successfully logged in and validated.`);
}

validateAllLogins().catch(console.error);
