import enmRole from 'src/app/enums/role.enum';

export const dashboardRoutes = new Map(
  [
    [enmRole.L0, "emp-l0/dashboard"],
    [enmRole.L1, "emp-l1/dashboard"],
    [enmRole.L2, "emp-l2/dashboard"],
    [enmRole.L3, "emp-l3/dashboard"]
  ]
);

export const rolePrefix = new Map(
  [
    [enmRole.L0, "emp-l0"],
    [enmRole.L1, "emp-l1"],
    [enmRole.L2, "emp-l2"],
    [enmRole.L3, "emp-l3"]
  ]
);