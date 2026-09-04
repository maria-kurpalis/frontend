interface DemoIdentity { id: string; name: string; email: string; communityId: string }
export type DemoLoginResponse =
  | (DemoIdentity & { userType: 'RESIDENT'; unitId: string })
  | (DemoIdentity & { userType: 'ADMIN' });
