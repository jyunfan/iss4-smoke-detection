export type AppRole = "sensor_owner" | "sponsor" | "admin";

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type EmptyRecord = Record<string, never>;

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          role: AppRole;
          display_name: string | null;
          is_anonymous: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: AppRole;
          display_name?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AppRole;
          display_name?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sensor_devices: {
        Row: {
          id: string;
          owner_user_id: string;
          external_device_id: string;
          provider: string;
          nickname: string | null;
          install_lon: number | null;
          install_lat: number | null;
          status: string;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          external_device_id: string;
          provider?: string;
          nickname?: string | null;
          install_lon?: number | null;
          install_lat?: number | null;
          status?: string;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          external_device_id?: string;
          provider?: string;
          nickname?: string | null;
          install_lon?: number | null;
          install_lat?: number | null;
          status?: string;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sponsor_campaigns: {
        Row: {
          id: string;
          sponsor_user_id: string;
          name: string;
          description: string | null;
          status: string;
          hourly_reward_amount: number;
          budget_limit: number;
          reserved_budget: number;
          spent_budget: number;
          start_at: string | null;
          end_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sponsor_user_id: string;
          name: string;
          description?: string | null;
          status?: string;
          hourly_reward_amount: number;
          budget_limit: number;
          reserved_budget?: number;
          spent_budget?: number;
          start_at?: string | null;
          end_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sponsor_user_id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          hourly_reward_amount?: number;
          budget_limit?: number;
          reserved_budget?: number;
          spent_budget?: number;
          start_at?: string | null;
          end_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reward_zones: {
        Row: {
          id: string;
          campaign_id: string;
          name: string;
          center_lon: number;
          center_lat: number;
          radius_meters: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          name: string;
          center_lon: number;
          center_lat: number;
          radius_meters: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          name?: string;
          center_lon?: number;
          center_lat?: number;
          radius_meters?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      zone_enrollments: {
        Row: {
          id: string;
          zone_id: string;
          device_id: string;
          status: string;
          joined_at: string;
          left_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          zone_id: string;
          device_id: string;
          status?: string;
          joined_at?: string;
          left_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          zone_id?: string;
          device_id?: string;
          status?: string;
          joined_at?: string;
          left_at?: string | null;
          created_at?: string;
        };
      };
      sensor_readings: {
        Row: {
          id: number;
          device_id: string;
          observed_at: string;
          observed_lon: number | null;
          observed_lat: number | null;
          pm25: number | null;
          humidity: number | null;
          temperature_c: number | null;
          is_online: boolean;
          ingestion_source: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          device_id: string;
          observed_at: string;
          observed_lon?: number | null;
          observed_lat?: number | null;
          pm25?: number | null;
          humidity?: number | null;
          temperature_c?: number | null;
          is_online: boolean;
          ingestion_source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          device_id?: string;
          observed_at?: string;
          observed_lon?: number | null;
          observed_lat?: number | null;
          pm25?: number | null;
          humidity?: number | null;
          temperature_c?: number | null;
          is_online?: boolean;
          ingestion_source?: string | null;
          created_at?: string;
        };
      };
      eligibility_checks: {
        Row: {
          id: string;
          campaign_id: string;
          zone_id: string;
          device_id: string;
          check_hour: string;
          is_eligible: boolean;
          reason_code: string;
          detail: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          zone_id: string;
          device_id: string;
          check_hour: string;
          is_eligible: boolean;
          reason_code: string;
          detail?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          zone_id?: string;
          device_id?: string;
          check_hour?: string;
          is_eligible?: boolean;
          reason_code?: string;
          detail?: Json;
          created_at?: string;
        };
      };
      reward_payouts: {
        Row: {
          id: string;
          campaign_id: string;
          zone_id: string;
          device_id: string;
          payout_hour: string;
          amount: number;
          status: string;
          eligibility_check_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          zone_id: string;
          device_id: string;
          payout_hour: string;
          amount: number;
          status?: string;
          eligibility_check_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          zone_id?: string;
          device_id?: string;
          payout_hour?: string;
          amount?: number;
          status?: string;
          eligibility_check_id?: string | null;
          created_at?: string;
        };
      };
      campaign_budget_ledger: {
        Row: {
          id: string;
          campaign_id: string;
          entry_type: string;
          amount: number;
          reference_type: string | null;
          reference_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          entry_type: string;
          amount: number;
          reference_type?: string | null;
          reference_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          entry_type?: string;
          amount?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          actor_user_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          before_state: Json | null;
          after_state: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          before_state?: Json | null;
          after_state?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          before_state?: Json | null;
          after_state?: Json | null;
          created_at?: string;
        };
      };
      campaign_membership_stats: {
        Row: {
          campaign_id: string;
          active_zone_count: number;
          active_device_count: number;
          last_computed_at: string | null;
        };
        Insert: {
          campaign_id: string;
          active_zone_count?: number;
          active_device_count?: number;
          last_computed_at?: string | null;
        };
        Update: {
          campaign_id?: string;
          active_zone_count?: number;
          active_device_count?: number;
          last_computed_at?: string | null;
        };
      };
    };
    Views: EmptyRecord;
    Functions: EmptyRecord;
    Enums: EmptyRecord;
    CompositeTypes: EmptyRecord;
  };
};
