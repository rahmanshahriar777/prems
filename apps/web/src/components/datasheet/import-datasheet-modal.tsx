'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Table,
  Users,
  Building2,
  Eye,
  Check,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../lib/api-client';

interface ImportDatasheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultTab?: 'employees' | 'departments';
}

interface ParsedDept {
  code: string;
  name: string;
  tier?: string;
  head?: string;
  description?: string;
}

interface ParsedEmp {
  employeeNumber: string;
  fullName: string;
  title: string;
  deptCode: string;
  reportsTo?: string;
  status: string;
  coreResponsibilities?: string;
}

export function ImportDatasheetModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'employees',
}: ImportDatasheetModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'template'>(defaultTab === 'departments' ? 'preview' : 'preview');
  const [activeSheetTab, setActiveSheetTab] = useState<'departments' | 'employees'>(defaultTab);

  const [fileName, setFileName] = useState<string | null>(null);
  const [departments, setDepartments] = useState<ParsedDept[]>([]);
  const [employees, setEmployees] = useState<ParsedEmp[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Look for Departments sheet
      const deptSheetName =
        workbook.SheetNames.find((s) => /department/i.test(s)) || workbook.SheetNames[0];
      const empSheetName =
        workbook.SheetNames.find((s) => /employee/i.test(s)) || workbook.SheetNames[1];

      const parsedDepts: ParsedDept[] = [];
      if (deptSheetName && workbook.Sheets[deptSheetName]) {
        const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[deptSheetName], {
          header: 1,
          defval: '',
        });
        if (rawRows.length > 1) {
          // Find header index
          let headerIdx = rawRows.findIndex((r) =>
            r.some((c: any) => /department id|department name|code/i.test(String(c))),
          );
          if (headerIdx === -1) headerIdx = 0;

          const dataRows = rawRows.slice(headerIdx + 1);
          for (const row of dataRows) {
            const code = String(row[0] || '').trim();
            const name = String(row[1] || '').trim();
            const tier = String(row[2] || '').trim();
            const head = String(row[3] || '').trim();
            const desc = String(row[4] || '').trim();
            if (code && name && !/^total|note/i.test(code)) {
              parsedDepts.push({
                code,
                name,
                tier,
                head,
                description: tier ? `[${tier}] ${desc}` : desc,
              });
            }
          }
        }
      }

      const parsedEmps: ParsedEmp[] = [];
      if (empSheetName && workbook.Sheets[empSheetName]) {
        const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[empSheetName], {
          header: 1,
          defval: '',
        });
        if (rawRows.length > 1) {
          let headerIdx = rawRows.findIndex((r) =>
            r.some((c: any) => /employee id|full name|job title/i.test(String(c))),
          );
          if (headerIdx === -1) headerIdx = 0;

          const dataRows = rawRows.slice(headerIdx + 1);
          for (const row of dataRows) {
            const empNum = String(row[0] || '').trim();
            const fullName = String(row[1] || '').trim();
            const title = String(row[2] || '').trim();
            const deptCode = String(row[3] || '').trim();
            const reportsTo = String(row[5] || '').trim();
            const status = String(row[6] || 'Active').trim();
            const resp = String(row[7] || '').trim();

            if (empNum && fullName && !/^note|total/i.test(empNum) && fullName !== '(Vacant)') {
              parsedEmps.push({
                employeeNumber: empNum,
                fullName,
                title,
                deptCode,
                reportsTo,
                status: status || 'Active',
                coreResponsibilities: resp,
              });
            }
          }
        }
      }

      setDepartments(parsedDepts);
      setEmployees(parsedEmps);

      if (parsedDepts.length === 0 && parsedEmps.length === 0) {
        setError('No valid rows could be extracted. Please ensure columns match the template.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to parse Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // 1. Departments Template
    const deptData = [
      ['Department ID', 'Department Name', 'Structural Tier', 'Department Head / Owner', 'Strategic Function Summary'],
      ['D01', 'Executive Leadership & Board', 'Tier 1 - Governance', 'Stephanie White (CEO)', 'Sets overall company strategy and governs operations.'],
      ['D02', 'Operations (COO)', 'Tier 2 - Senior Management', 'Natalie White (COO)', 'Owns organisational structure, strategic growth and innovation.'],
      ['D03', 'Finance & Accounts', 'Tier 2 - Senior Management', 'Frankie White (CFO)', 'Manages accounts, payroll, VAT and financial reporting.'],
      ['D04', 'Scheduling & Client Services', 'Tier 3 - Functional Management', 'Jay Boyd-Carpenter', 'Coordinates job scheduling and customer communications.'],
      ['D05', 'Health & Safety (H&S)', 'Tier 3 - Functional Management', 'Charlie Kingham', 'H&S paperwork, crew training and site compliance.'],
      ['D06', 'Field Operations', 'Tier 3 - Functional Management', 'Deke Rivers', 'Manages large jobs, subcontractors and yard operations.'],
      ['D07', 'Reception & Front Office', 'Tier 4 - Administrative Support', 'Aimee Daffin', 'First point of contact for customer enquiries and sorting sales leads.'],
      ['D08', 'Yard & Materials Management', 'Tier 4 - Operational Support', 'Tony Lloyd', 'Yard, stock, fixings and fleet vehicle management.'],
      ['D09', 'Roofing Team (In-House)', 'Tier 5 - Field Delivery', 'Ethan Wood (Foreman)', 'Delivers on-site roofing installations and repairs.'],
    ];
    const wsDept = XLSX.utils.aoa_to_sheet(deptData);
    XLSX.utils.book_append_sheet(wb, wsDept, 'Organizational Departments');

    // 2. Employees Template
    const empData = [
      ['Employee ID', 'Full Name', 'Job Title', 'Department ID', 'Department Name (Lookup)', 'Reports To', 'Employment Status', 'Core Responsibilities'],
      ['E01', 'Richard White', 'Director', 'D01', 'Executive Leadership & Board', 'Board / Shareholders', 'Active', 'Service & People KPIs, annual jobs and scheduling.'],
      ['E02', 'Debbie White', 'Director', 'D01', 'Executive Leadership & Board', 'Board / Shareholders', 'Active', 'Strategic board-level governance.'],
      ['E03', 'Stephanie White', 'Chief Executive Officer (CEO)', 'D01', 'Executive Leadership & Board', 'Directors and Executive team', 'Active', 'Overall enterprise leadership and executive oversight.'],
      ['E04', 'Rasel Mahmud', 'Non-Executive', 'D01', 'Executive Leadership & Board', 'CEO', 'Active', 'Non-executive advisory and field management oversight.'],
      ['E05', 'Natalie White', 'Chief Operating Officer (COO)', 'D02', 'Operations (COO)', 'CEO', 'Active', 'Company operations, HR structure and strategic delivery.'],
      ['E06', 'Frankie White', 'Chief Financial Officer (CFO)', 'D03', 'Finance & Accounts', 'CEO + Board', 'Active', 'Financial controller, payroll and compliance.'],
      ['E13', 'Ethan Wood', 'Foreman', 'D09', 'Roofing Team (In-House)', 'Natalie White', 'Active', 'On-site crew leadership and quality assurance.'],
      ['E14', 'Lee Merrett', 'Roofer (lone-work certified)', 'D09', 'Roofing Team (In-House)', 'Ethan Wood', 'Active', 'Roofing installation and certified lone working.'],
    ];
    const wsEmp = XLSX.utils.aoa_to_sheet(empData);
    XLSX.utils.book_append_sheet(wb, wsEmp, 'Employees Directory');

    XLSX.writeFile(wb, 'Practical_Roofing_EMS_Template.xlsx');
  };

  const handleExecuteImport = async () => {
    if (departments.length === 0 && employees.length === 0) return;
    setImporting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Import Departments
      if (departments.length > 0) {
        await api.post('/departments/bulk-import', departments);
      }

      // 2. Import Employees
      if (employees.length > 0) {
        await api.post('/employees/bulk-import', employees);
      }

      setSuccessMessage(
        `Successfully imported ${departments.length} departments and ${employees.length} employees into the system!`,
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to complete import');
    } finally {
      setImporting(false);
    }
  };

  const handleLoadSampleData = () => {
    // Load pre-parsed sample dataset directly from Practical Roofing dataset
    setFileName('Practical_Roofing_EMS_Dataset.xlsx (Preset)');
    setDepartments([
      { code: 'D01', name: 'Executive Leadership & Board', tier: 'Tier 1 - Governance', head: 'Stephanie White (CEO)', description: '[Tier 1 - Governance] Sets overall company strategy and governs operations.' },
      { code: 'D02', name: 'Operations (COO)', tier: 'Tier 2 - Senior Management', head: 'Natalie White (COO)', description: '[Tier 2 - Senior Management] Owns organisational structure, strategic growth and innovation.' },
      { code: 'D03', name: 'Finance & Accounts', tier: 'Tier 2 - Senior Management', head: 'Frankie White (CFO)', description: '[Tier 2 - Senior Management] Manages company accounts, payroll and financial reporting.' },
      { code: 'D04', name: 'Scheduling & Client Services', tier: 'Tier 3 - Functional Management', head: 'Jay Boyd-Carpenter', description: '[Tier 3 - Functional Management] Coordinates job scheduling and client relations.' },
      { code: 'D05', name: 'Health & Safety (H&S)', tier: 'Tier 3 - Functional Management (Elevated)', head: 'Charlie Kingham', description: '[Tier 3 - Functional Management] H&S compliance, crew training and safety audits.' },
      { code: 'D06', name: 'Field Operations', tier: 'Tier 3 - Functional Management', head: 'Deke Rivers', description: '[Tier 3 - Functional Management] Large jobs management, yard operations and drawings.' },
      { code: 'D07', name: 'Reception & Front Office', tier: 'Tier 4 - Administrative Support', head: 'Aimee Daffin', description: '[Tier 4 - Administrative Support] First point of contact and customer lead routing.' },
      { code: 'D08', name: 'Yard & Materials Management', tier: 'Tier 4 - Operational Support', head: 'Tony Lloyd', description: '[Tier 4 - Operational Support] Stock, yard materials and fleet vehicles.' },
      { code: 'D09', name: 'Roofing Team (In-House)', tier: 'Tier 5 - Field Delivery', head: 'Ethan Wood (Foreman)', description: '[Tier 5 - Field Delivery] On-site roofing installation and repair crews.' },
      { code: 'D10', name: 'Subcontractor Network', tier: 'External / Extended Workforce', head: 'Contracts Manager (vacant)', description: '[External] External trade partner contractors.' },
    ]);
    setEmployees([
      { employeeNumber: 'E01', fullName: 'Richard White', title: 'Director', deptCode: 'D01', reportsTo: 'Board', status: 'Active', coreResponsibilities: 'Service & People KPIs, annual jobs and scheduling.' },
      { employeeNumber: 'E02', fullName: 'Debbie White', title: 'Director', deptCode: 'D01', reportsTo: 'Board', status: 'Active', coreResponsibilities: 'Strategic corporate governance and oversight.' },
      { employeeNumber: 'E03', fullName: 'Stephanie White', title: 'Chief Executive Officer (CEO)', deptCode: 'D01', reportsTo: 'Directors', status: 'Active', coreResponsibilities: 'Enterprise leadership, sales and operations.' },
      { employeeNumber: 'E04', fullName: 'Rasel Mahmud', title: 'Non-Executive', deptCode: 'D01', reportsTo: 'CEO', status: 'Active', coreResponsibilities: 'Non-executive oversight and Field Manager line manager.' },
      { employeeNumber: 'E05', fullName: 'Natalie White', title: 'Chief Operating Officer (COO)', deptCode: 'D02', reportsTo: 'CEO', status: 'Active', coreResponsibilities: 'Organisational structure, operations and growth.' },
      { employeeNumber: 'E06', fullName: 'Frankie White', title: 'Chief Financial Officer (CFO)', deptCode: 'D03', reportsTo: 'CEO', status: 'Active', coreResponsibilities: 'Cost/sales control, accounts and payroll.' },
      { employeeNumber: 'E07', fullName: 'Pantea Rezvani', title: 'Assistant Accounts Manager', deptCode: 'D03', reportsTo: 'Frankie White', status: 'Active', coreResponsibilities: 'Accounts, invoicing and VAT reporting.' },
      { employeeNumber: 'E08', fullName: 'Jay Boyd-Carpenter', title: 'Scheduling & Client Services', deptCode: 'D04', reportsTo: 'Natalie White', status: 'Active', coreResponsibilities: 'Jobs scheduling and customer communication.' },
      { employeeNumber: 'E09', fullName: 'Charlie Kingham', title: 'H&S Supervisor', deptCode: 'D05', reportsTo: 'Stephanie White', status: 'Active', coreResponsibilities: 'Health & safety compliance and inspections.' },
      { employeeNumber: 'E10', fullName: 'Deke Rivers', title: 'Field Manager', deptCode: 'D06', reportsTo: 'Rasel Mahmud', status: 'Active', coreResponsibilities: 'Field operations, projects and site management.' },
      { employeeNumber: 'E11', fullName: 'Aimee Daffin', title: 'Reception', deptCode: 'D07', reportsTo: 'Frankie White', status: 'Active', coreResponsibilities: 'Customer reception, calls and enquiry triage.' },
      { employeeNumber: 'E12', fullName: 'Tony Lloyd', title: 'Yard Manager', deptCode: 'D08', reportsTo: 'Deke Rivers', status: 'Active', coreResponsibilities: 'Materials stock, yard and vehicle fleet.' },
      { employeeNumber: 'E13', fullName: 'Ethan Wood', title: 'Foreman', deptCode: 'D09', reportsTo: 'Natalie White', status: 'Active', coreResponsibilities: 'Leads on-site roofing crew and quality.' },
      { employeeNumber: 'E14', fullName: 'Lee Merrett', title: 'Roofer (lone-work certified)', deptCode: 'D09', reportsTo: 'Ethan Wood', status: 'Active', coreResponsibilities: 'On-site installation and repair.' },
      { employeeNumber: 'E15', fullName: 'Lewis Bowle', title: 'Roofer', deptCode: 'D09', reportsTo: 'Ethan Wood', status: 'Active', coreResponsibilities: 'On-site roofing installation.' },
      { employeeNumber: 'E16', fullName: 'Lewis Evans', title: 'Roofer', deptCode: 'D09', reportsTo: 'Ethan Wood', status: 'Active', coreResponsibilities: 'On-site roofing installation.' },
      { employeeNumber: 'E17', fullName: 'Jay Tomms', title: 'Roofer', deptCode: 'D09', reportsTo: 'Ethan Wood', status: 'Active', coreResponsibilities: 'On-site roofing installation.' },
      { employeeNumber: 'E18', fullName: 'Will Hodgkins', title: 'Roofer', deptCode: 'D09', reportsTo: 'Ethan Wood', status: 'Active', coreResponsibilities: 'On-site roofing installation.' },
      { employeeNumber: 'E19', fullName: 'Matt Galpin', title: 'Roofer', deptCode: 'D09', reportsTo: 'Ethan Wood', status: 'Active', coreResponsibilities: 'On-site roofing installation.' },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight font-serif">
                Import Datasheet (Excel / CSV)
              </h2>
              <p className="text-xs text-neutral-500">
                Upload Practical Roofing organization structure and staff directory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Bar / Upload area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="md:col-span-2 border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-neutral-50/50 hover:bg-neutral-50 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center text-neutral-600 group-hover:scale-110 transition-transform mb-3">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                ) : (
                  <Upload className="w-6 h-6 text-neutral-500 group-hover:text-amber-600 transition-colors" />
                )}
              </div>
              <p className="text-sm font-semibold text-neutral-800">
                {fileName ? fileName : 'Click to browse or drag & drop datasheet'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Supports .xlsx, .xls, and .csv (Practical Roofing EMS format)
              </p>
            </div>

            {/* Template & Preset Actions */}
            <div className="flex flex-col gap-3 justify-center">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold transition-all border border-neutral-200 shadow-sm"
              >
                <Download className="w-4 h-4 text-neutral-600" />
                Download Excel Template
              </button>

              <button
                type="button"
                onClick={handleLoadSampleData}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold transition-all border border-amber-200/60 shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-amber-600" />
                Load Practical Roofing Preset
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Preview Tabs & Content */}
          {(departments.length > 0 || employees.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveSheetTab('departments')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeSheetTab === 'departments'
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Departments ({departments.length})
                  </button>
                  <button
                    onClick={() => setActiveSheetTab('employees')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeSheetTab === 'employees'
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Employees ({employees.length})
                  </button>
                </div>
                <span className="text-xs text-neutral-400">
                  Ready to import into database
                </span>
              </div>

              {/* Departments Table Preview */}
              {activeSheetTab === 'departments' && (
                <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Department Name</th>
                        <th className="py-2.5 px-3">Tier</th>
                        <th className="py-2.5 px-3">Head / Owner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {departments.map((d, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          <td className="py-2 px-3 font-mono font-bold text-amber-700">{d.code}</td>
                          <td className="py-2 px-3 font-medium text-neutral-800">{d.name}</td>
                          <td className="py-2 px-3 text-neutral-500">{d.tier || '—'}</td>
                          <td className="py-2 px-3 text-neutral-600">{d.head || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Employees Table Preview */}
              {activeSheetTab === 'employees' && (
                <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-medium sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Job Title</th>
                        <th className="py-2.5 px-3">Dept ID</th>
                        <th className="py-2.5 px-3">Reports To</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {employees.map((e, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          <td className="py-2 px-3 font-mono font-bold text-blue-700">{e.employeeNumber}</td>
                          <td className="py-2 px-3 font-medium text-neutral-800">{e.fullName}</td>
                          <td className="py-2 px-3 text-neutral-600">{e.title}</td>
                          <td className="py-2 px-3 font-mono text-neutral-500">{e.deptCode}</td>
                          <td className="py-2 px-3 text-neutral-500">{e.reportsTo || '—'}</td>
                          <td className="py-2 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-800 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={importing || (departments.length === 0 && employees.length === 0)}
            onClick={handleExecuteImport}
            className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing Records...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Import {departments.length > 0 ? `${departments.length} Depts` : ''}
                {departments.length > 0 && employees.length > 0 ? ' & ' : ''}
                {employees.length > 0 ? `${employees.length} Staff` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
