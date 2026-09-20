async function test() {
  const loginRes = await fetch('https://34.46.124.175.sslip.io/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@ems.local', password: 'Password123!' })
  });
  const { data } = await loginRes.json();
  const token = data.tokens.accessToken;
  const authHeaders = { Authorization: 'Bearer ' + token };

  const depRes = await (await fetch('https://34.46.124.175.sslip.io/api/v1/departments', { headers: authHeaders })).json();
  const depts = Array.isArray(depRes) ? depRes : depRes.data || [];
  console.log('Departments count:', depts.length);
  depts.forEach((d: any) => console.log('  Dept:', d.code, '|', d.name, `(${d._count?.employees || 0} emps)`));

  const empRes = await (await fetch('https://34.46.124.175.sslip.io/api/v1/employees?limit=50', { headers: authHeaders })).json();
  const vacant = empRes.data?.items?.find((e: any) => e.employeeNumber === 'E20' || e.firstName.includes('(Vacant)'));
  if (vacant) {
    console.log('Cleaning up vacant placeholder E20:', vacant.id);
    await fetch('https://34.46.124.175.sslip.io/api/v1/employees/' + vacant.id, {
      method: 'DELETE',
      headers: authHeaders
    });
  }

  const finalEmpRes = await (await fetch('https://34.46.124.175.sslip.io/api/v1/employees?limit=50', { headers: authHeaders })).json();
  console.log('\nFinal active employees count:', finalEmpRes.data?.items?.length);
  finalEmpRes.data?.items?.forEach((e: any) => {
    console.log(` - [${e.employeeNumber}] ${e.firstName} ${e.lastName} | ${e.designation?.title || 'Staff'} (${e.department?.name || 'Unassigned'})`);
  });
}

test().catch(console.error);
