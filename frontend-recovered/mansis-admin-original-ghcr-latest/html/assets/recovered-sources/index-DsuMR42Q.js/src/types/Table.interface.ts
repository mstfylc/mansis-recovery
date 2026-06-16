export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
  BLOCKED = 'BLOCKED'
}

export enum TableShape {
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  SQUARE = 'SQUARE'
}

export interface FloorPlan {
  id: number;
  branchId: number;
  name: string;
  gridRows: number;
  gridCols: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  tables?: Table[];
  sections?: FloorSection[];
}

export interface Table {
  id: number;
  floorPlanId: number;
  floorPlan?: Pick<FloorPlan, 'id' | 'name'>;
  branchId: number;
  label: string;
  tableNumber: number;
  shape: TableShape;
  capacity: number;
  gridRow: number;
  gridCol: number;
  gridRowSpan: number;
  gridColSpan: number;
  status: TableStatus;
  occupiedAt?: string | Date | null;
  assignedEmployeeId?: number | null;
  assignedEmployee?: {
    id: number;
    name: string;
    surname: string;
  } | null;
  sortOrder: number;
  isActive: boolean;
  qrToken?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface FloorSection {
  id: number;
  branchId: number;
  floorPlanId: number;
  floorPlan?: Pick<FloorPlan, 'id' | 'name'>;
  name: string;
  color: string;
  tableIds: number[];
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface FloorPlanListResponse {
  items: FloorPlan[];
  total: number;
}

export interface TableListResponse {
  items: Table[];
  total: number;
}

export interface CreateFloorPlanData {
  name: string;
  gridRows?: number;
  gridCols?: number;
  sortOrder?: number;
}

export type UpdateFloorPlanData = Partial<CreateFloorPlanData> & {
  isActive?: boolean;
};

export interface CreateTableData {
  floorPlanId: number;
  label: string;
  shape?: TableShape;
  capacity?: number;
  isActive?: boolean;
  gridRow: number;
  gridCol: number;
  gridRowSpan?: number;
  gridColSpan?: number;
}

export type UpdateTableData = Partial<
  Pick<CreateTableData, 'label' | 'shape' | 'capacity'> & {
    isActive?: boolean;
    sortOrder?: number;
  }
>;
