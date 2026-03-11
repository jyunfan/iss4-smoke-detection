export type SponsorCampaign = {
  id: string;
  name: string;
  status: string;
  hourlyRewardAmount: number;
  budgetLimit: number;
  spentBudget: number;
};

export type RewardZone = {
  id: string;
  campaignId: string;
  name: string;
  centerLon: number;
  centerLat: number;
  radiusMeters: number;
  isActive: boolean;
};
