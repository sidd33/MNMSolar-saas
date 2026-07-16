const fs = require('fs');

const path = 'c:\\Users\\Siddhartha\\.gemini\\antigravity\\scratch\\task-manager\\prisma\\schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

// 1. Add new models
const newModels = `
model PurchaseOrder {
  id             String       @id @default(cuid())
  projectId      String
  vendorName     String
  orderType      String       @default("BOS")
  status         POStatus     @default(PENDING)
  amount         Float?
  items          Json?
  organizationId String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  project        Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([projectId])
  @@index([organizationId])
}

model MaterialReleaseNote {
  id             String       @id @default(cuid())
  projectId      String
  mrnNumber      String
  status         MRNStatus    @default(DISPATCHED)
  items          Json?
  dispatchedBy   String?
  vehicleNumber  String?
  driverName     String?
  organizationId String
  createdAt      DateTime     @default(now())

  project        Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([projectId])
  @@index([organizationId])
}

model Challan {
  id             String       @id @default(cuid())
  projectId      String
  challanNumber  String
  type           ChallanType  @default(INWARD)
  status         ChallanStatus @default(RECEIVED)
  items          Json?
  loggedByUserId String?
  organizationId String
  createdAt      DateTime     @default(now())

  project        Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([projectId])
  @@index([organizationId])
}

enum POStatus {
  PENDING
  APPROVED
  FULFILLED
  CANCELLED
}

enum MRNStatus {
  DRAFT
  DISPATCHED
  DELIVERED
}

enum ChallanType {
  INWARD
  RETURN
}

enum ChallanStatus {
  RECEIVED
  DISCREPANCY
  CLEARED
}
`;

if (!schema.includes('model PurchaseOrder')) {
    schema += '\n' + newModels;
}

// 2. Add relation fields to Project
if (!schema.includes('purchaseOrders PurchaseOrder[]')) {
    schema = schema.replace(
        '  projectComments ProjectComment[]',
        '  projectComments ProjectComment[]\n  purchaseOrders PurchaseOrder[]\n  mrns           MaterialReleaseNote[]\n  challans       Challan[]'
    );
}

// 3. Add relation fields to Organization
if (!schema.includes('purchaseOrders       PurchaseOrder[]')) {
    schema = schema.replace(
        '  comments             ProjectComment[]\n\n  @@index([organizationId])',
        '  comments             ProjectComment[]\n  purchaseOrders       PurchaseOrder[]\n  mrns                 MaterialReleaseNote[]\n  challans             Challan[]\n\n  @@index([organizationId])'
    );
}

// 4. Update FileCategory
if (!schema.includes('PURCHASE_ORDER')) {
    schema = schema.replace(
        'enum FileCategory {\n  LIAISONING\n  TECHNICAL\n  COMMERCIAL\n  HANDOVER_SHEET\n  EXECUTION\n}',
        'enum FileCategory {\n  LIAISONING\n  TECHNICAL\n  COMMERCIAL\n  HANDOVER_SHEET\n  EXECUTION\n  PURCHASE_ORDER\n  MRN_DOCUMENT\n  RETURN_CHALLAN\n}'
    );
}

fs.writeFileSync(path, schema);
console.log('Schema updated successfully');
