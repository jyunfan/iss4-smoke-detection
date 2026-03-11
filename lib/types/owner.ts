export type OwnerDevice = {
  id: string;
  externalDeviceId: string;
  provider: string;
  nickname: string | null;
  status: string;
  lastSeenAt: string | null;
};

export type OwnerRewardItem = {
  payoutHour: string;
  zoneId: string;
  amount: number;
  status: string;
};
