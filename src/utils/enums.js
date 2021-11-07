const StaffRole = {
  Support: 1,
  Business: 2,
  Appraisal: 3,
  Director: 4,
};
const ProofOfIncomeType = {
  LaborContract: 1,
  SalaryConfirmation: 2,
  HouseRentalContract: 3,
  CarRentalContract: 4,
  BusinessLicense: 5,
};

const LoanType = {
  EachTime: 1,
  CreditLine: 2,
  InvestmentProject: 3,
  Installment: 4,
  StandbyCreditLimit: 5,
  CapitalMeeting: 6,
  UnderOverdraftLimit: 7,
};

const CustomerType = {
  Business: 1,
  Resident: 2,
};

const LoanProfileStatus = {
  Pending: 1,
  Done: 2,
  Rejected: 3,
};

export {
  StaffRole,
  LoanType,
  CustomerType,
  ProofOfIncomeType,
  LoanProfileStatus,
};
