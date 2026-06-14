export enum UserRole {
  SuperAdmin = 1,
  OrgAdmin = 2,
  Manager = 3,
  EntryStaff = 4,
  ExitStaff = 5,
  Auditor = 6,
}

export enum QrStatus {
  Generated = 1,
  Active = 2,
  Returned = 3,
  Refunded = 4,
  Invalid = 5,
  Expired = 6,
}

export enum RefundMethod {
  Cash = 1,
  UPI = 2,
  Coupon = 3,
  Wallet = 4,
  BankTransfer = 5,
}

export enum ScanResult {
  Success = 1,
  AlreadyRedeemed = 2,
  InvalidQr = 3,
  WrongOrganization = 4,
  Expired = 5,
  NotFound = 6,
}

export interface UserDto {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  roleName: string;
  organizationId?: string;
  organizationName?: string;
  organizationCode?: string;
  profileImageUrl?: string;
  assignedLocationId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PagedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Organization {
  id: string;
  organizationCode: string;
  organizationName: string;
  organizationType: number;
  email: string;
  phone: string;
  isActive: boolean;
  isLoginEnabled: boolean;
  subscriptionPlan: number;
  subscriptionExpiresAt?: string;
  createdAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  isLoginEnabled: boolean;
  lastLoginAt?: string;
  assignedLocationId?: string;
  assignedLocationName?: string;
  createdAt: string;
}

export interface Location {
  id: string;
  locationName: string;
  locationType: number;
  typeName: string;
  description?: string;
  isActive: boolean;
  itemCount: number;
}

export interface ItemType {
  id: string;
  typeName: string;
  description?: string;
  defaultDepositAmount: number;
  isActive: boolean;
}

export interface QrCode {
  id: string;
  qrCodeNumber: string;
  status: QrStatus;
  statusName: string;
  itemTypeName?: string;
  depositAmount?: number;
  generatedBy?: string;
  generatedAt: string;
  expiresAt?: string;
  redeemedAt?: string;
  scanAttemptCount: number;
}

export interface DashboardStats {
  activeItems: number;
  todayItems: number;
  totalRefunds: number;
  todayRefunds: number;
  totalDepositsCollected: number;
  totalRefundsProcessed: number;
  monthlyDeposits: number;
  monthlyRefunds: number;
  fraudAttempts: number;
  activeStaff: number;
}

export interface ScanQrResponse {
  result: ScanResult;
  message: string;
  canRefund: boolean;
  qrCodeId?: string;
  qrCodeNumber?: string;
  itemId?: string;
  itemNumber?: string;
  itemTypeName?: string;
  depositAmount?: number;
  organizationName?: string;
  registeredAt?: string;
  locationName?: string;
}

export interface GenerateQrResponse {
  qrCodeId: string;
  qrCodeNumber: string;
  qrImageBase64: string;
  itemId: string;
  itemNumber: string;
  itemTypeName: string;
  depositAmount: number;
  expiresAt: string;
  printLabelBase64?: string;
}

export interface Refund {
  id: string;
  qrCodeNumber?: string;
  itemTypeName?: string;
  amount: number;
  refundMethod: RefundMethod;
  refundMethodName: string;
  transactionReference?: string;
  processedByEmail?: string;
  processedAt: string;
  notes?: string;
}
