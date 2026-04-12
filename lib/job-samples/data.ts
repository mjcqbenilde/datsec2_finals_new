/** In-memory demo records for job modules (replace with DB-backed queries later). */

export type FinanceReport = {
  id: string;
  title: string;
  period: string;
  amount: string;
};

export type BudgetLine = {
  id: string;
  department: string;
  allocated: string;
  spent: string;
};

export type LedgerRow = {
  id: string;
  date: string;
  description: string;
  amount: string;
};

export type EmployeeRow = {
  id: string;
  name: string;
  role: string;
  office: string;
};

export type AttendanceRow = {
  id: string;
  employee: string;
  date: string;
  status: string;
};

export type OrderRow = {
  id: string;
  customer: string;
  total: string;
  status: string;
};

export type InventoryRow = {
  id: string;
  sku: string;
  qty: number;
  location: string;
};

export type VendorRow = {
  id: string;
  name: string;
  contract: string;
};

export type PolicyRow = {
  id: string;
  title: string;
  version: string;
  ackRequired: boolean;
};

export type TrainingRow = {
  id: string;
  course: string;
  due: string;
  completed: boolean;
};

export type ChecklistRow = {
  id: string;
  name: string;
  itemsDone: number;
  itemsTotal: number;
};

export const SAMPLE_FINANCE_REPORTS: FinanceReport[] = [
  { id: "FR-001", title: "Q1 Revenue summary", period: "2026-Q1", amount: "$128,400" },
  { id: "FR-002", title: "Expense breakdown", period: "2026-Q1", amount: "$42,100" },
];

export const SAMPLE_BUDGET_LINES: BudgetLine[] = [
  { id: "B-01", department: "Engineering", allocated: "$200,000", spent: "$87,300" },
  { id: "B-02", department: "Sales", allocated: "$95,000", spent: "$41,200" },
];

let demoTxCounter = 9000;
export function nextDemoTransactionId() {
  demoTxCounter += 1;
  return `TX-${demoTxCounter}`;
}

export const SAMPLE_TRANSACTIONS: LedgerRow[] = [
  {
    id: "TX-9001",
    date: "2026-04-01",
    description: "Vendor payment — cloud hosting",
    amount: "-$2,450",
  },
  {
    id: "TX-9002",
    date: "2026-04-03",
    description: "Client invoice #4412",
    amount: "+$18,000",
  },
];

export const SAMPLE_EMPLOYEES: EmployeeRow[] = [
  { id: "E-101", name: "Jordan Lee", role: "Analyst", office: "Manila" },
  { id: "E-102", name: "Sam Rivera", role: "Engineer", office: "Remote" },
];

export const SAMPLE_ATTENDANCE: AttendanceRow[] = [
  { id: "A-1", employee: "Jordan Lee", date: "2026-04-11", status: "Present" },
  { id: "A-2", employee: "Sam Rivera", date: "2026-04-11", status: "Remote" },
];

export const SAMPLE_ORDERS: OrderRow[] = [
  { id: "ORD-5001", customer: "Acme Co.", total: "$4,200", status: "Shipped" },
  { id: "ORD-5002", customer: "Northwind", total: "$890", status: "Processing" },
];

export const SAMPLE_INVENTORY: InventoryRow[] = [
  { id: "INV-1", sku: "SKU-ALPHA", qty: 240, location: "WH-A" },
  { id: "INV-2", sku: "SKU-BETA", qty: 18, location: "WH-B" },
];

export const SAMPLE_VENDORS: VendorRow[] = [
  { id: "V-01", name: "Global Supplies Ltd.", contract: "2026-12-31" },
  { id: "V-02", name: "Metro Logistics", contract: "2027-03-15" },
];

export const SAMPLE_POLICIES: PolicyRow[] = [
  { id: "P-1", title: "Data handling & privacy", version: "3.2", ackRequired: true },
  { id: "P-2", title: "Remote work", version: "1.1", ackRequired: false },
];

export const SAMPLE_TRAINING: TrainingRow[] = [
  { id: "T-1", course: "Security awareness", due: "2026-05-01", completed: false },
  { id: "T-2", course: "Anti-harassment", due: "2026-04-20", completed: true },
];

export const SAMPLE_CHECKLISTS: ChecklistRow[] = [
  { id: "C-1", name: "Quarterly access review", itemsDone: 4, itemsTotal: 7 },
  { id: "C-2", name: "SOX controls", itemsDone: 12, itemsTotal: 12 },
];
