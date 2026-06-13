"use client";

import {
  registerBatchAction,
  scanFreshnessAction,
  saveScanResultAction,
  recordMovementAction,
} from "@/app/actions/scresh";
import {
  approveLoanAction,
  rejectLoanAction,
  requestCollateralAction,
} from "@/app/actions/manager";
import {
  grantConsentAction,
  createLoanAction,
  submitRecommendationAction,
} from "@/app/actions/credit";
import {
  markNotificationReadAction,
  addAuditReviewAction,
} from "@/app/actions/audit";
import { withOfflineQueue } from "./offline-queue";

export const queuedRegisterBatchAction = withOfflineQueue(
  "registerBatch",
  registerBatchAction,
);

export const queuedScanFreshnessAction = withOfflineQueue(
  "scanFreshness",
  scanFreshnessAction,
);

export const queuedSaveScanResultAction = withOfflineQueue(
  "saveScanResult",
  saveScanResultAction,
);

export const queuedRecordMovementAction = withOfflineQueue(
  "recordMovement",
  recordMovementAction,
);

export const queuedApproveLoanAction = withOfflineQueue(
  "approveLoan",
  approveLoanAction,
);

export const queuedRejectLoanAction = withOfflineQueue(
  "rejectLoan",
  rejectLoanAction,
);

export const queuedRequestCollateralAction = withOfflineQueue(
  "requestCollateral",
  requestCollateralAction,
);

export const queuedGrantConsentAction = withOfflineQueue(
  "grantConsent",
  grantConsentAction,
);

export const queuedCreateLoanAction = withOfflineQueue(
  "createLoan",
  createLoanAction,
);

export const queuedSubmitRecommendationAction = withOfflineQueue(
  "submitRecommendation",
  submitRecommendationAction,
);

export const queuedMarkNotificationReadAction = withOfflineQueue(
  "markNotificationRead",
  markNotificationReadAction,
);

export const queuedAddAuditReviewAction = withOfflineQueue(
  "addAuditReview",
  addAuditReviewAction,
);
