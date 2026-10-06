// Generated from the Supabase schema (project fcg-find-connect-grow) — regenerate after schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }
type T<R, I = Partial<R>> = { Row: R; Insert: I; Update: Partial<I>; Relationships: Rel[] }

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.18' }
  public: {
    Tables: {
      admins: T<{ created_at: string; user_id: string }, { created_at?: string; user_id: string }>
      attributes: T<{ idx: number; key: string; label_en: string; label_nl: string }, { idx: number; key: string; label_en: string; label_nl: string }>
      donation_impact_items: T<{ cost_eur: number; key: string; sort: number }, { cost_eur: number; key: string; sort: number }>
      donations: T<
        { amount_eur: number; anonymous: boolean; created_at: string; donor_email: string; donor_name: string; frequency: string; id: string; lang: string; payment_method: string; region_key: string | null; status: string; wants_updates: boolean },
        { amount_eur: number; anonymous?: boolean; created_at?: string; donor_email: string; donor_name: string; frequency: string; id?: string; lang?: string; payment_method: string; region_key?: string | null; status?: string; wants_updates?: boolean }>
      centre_kinds: T<{ key: string; label_en: string; label_nl: string; sort: number }, { key: string; label_en: string; label_nl: string; sort: number }>
      centres: T<
        { active_since: number; active_until: number | null; archived_at: string | null; city: string; country: string; created_at: string; key: string; kind_key: string; lat: number; lng: number; name_en: string; name_nl: string; note_en: string; note_nl: string; published: boolean; region_key: string | null; scouts: number; sort: number; updated_at: string },
        { active_since: number; active_until?: number | null; archived_at?: string | null; city: string; country: string; created_at?: string; key: string; kind_key: string; lat: number; lng: number; name_en: string; name_nl: string; note_en?: string; note_nl?: string; published?: boolean; region_key?: string | null; scouts?: number; sort?: number; updated_at?: string }>
      club_levels: T<{ key: string; label_en: string; label_nl: string; sort: number }, { key: string; label_en: string; label_nl: string; sort: number }>
      clubs: T<
        { archived_at: string | null; city: string; country: string; created_at: string; key: string; lat: number; league: string; level_key: string; lng: number; name: string; note_en: string; note_nl: string; offers: string[]; partner_since: number; placements: number; published: boolean; sort: number; squads: string; tier_key: string | null; updated_at: string },
        { archived_at?: string | null; city: string; country: string; created_at?: string; key: string; lat: number; league: string; level_key: string; lng: number; name: string; note_en?: string; note_nl?: string; offers?: string[]; partner_since: number; placements?: number; published?: boolean; sort?: number; squads?: string; tier_key?: string | null; updated_at?: string }>
      dossier_request_talents: T<{ request_id: string; talent_id: string }, { request_id: string; talent_id: string }>
      dossier_requests: T<
        { club: string; created_at: string; email: string; id: string; lang: string; message: string | null; name: string; nda_accepted: boolean; role: string; status: string },
        { club: string; created_at?: string; email: string; id?: string; lang?: string; message?: string | null; name: string; nda_accepted: boolean; role: string; status?: string }>
      fund_allocation: T<{ key: string; label_en: string; label_nl: string; percent: number; sort: number }, { key: string; label_en: string; label_nl: string; percent: number; sort: number }>
      help_offers: T<
        { created_at: string; email: string; id: string; kind: string; lang: string; name: string; offer: string; status: string },
        { created_at?: string; email: string; id?: string; kind: string; lang?: string; name: string; offer: string; status?: string }>
      locations: T<{ key: string; kind: string; lat: number; lng: number; name: string; sort: number }, { key: string; kind: string; lat: number; lng: number; name: string; sort: number }>
      newsletter_subscribers: T<{ created_at: string; email: string; id: string; lang: string }, { created_at?: string; email: string; id?: string; lang?: string }>
      nominations: T<
        { contact: string; country_or_camp: string; created_at: string; guardian_aware: boolean; id: string; lang: string; nominator_name: string; nominator_role: string; player_age: number; player_first_name: string; position_key: string | null; reason: string; status: string; video_url: string | null },
        { contact: string; country_or_camp: string; created_at?: string; guardian_aware: boolean; id?: string; lang?: string; nominator_name: string; nominator_role: string; player_age: number; player_first_name: string; position_key?: string | null; reason: string; status?: string; video_url?: string | null }>
      partnership_applications: T<
        { charter_accepted: boolean; club: string; country: string | null; created_at: string; email: string; id: string; lang: string; level: string; message: string | null; name: string; need: string; status: string; tier_key: string | null },
        { charter_accepted: boolean; club: string; country?: string | null; created_at?: string; email: string; id?: string; lang?: string; level: string; message?: string | null; name: string; need: string; status?: string; tier_key?: string | null }>
      partnership_tiers: T<
        { featured: boolean; key: string; name: string; period: string; price_eur: number | null; sort: number },
        { featured?: boolean; key: string; name: string; period?: string; price_eur?: number | null; sort: number }>
      position_groups: T<{ key: string; label_en: string; label_nl: string; sort: number }, { key: string; label_en: string; label_nl: string; sort: number }>
      positions: T<
        { group_key: string; key: string; label_en: string; label_nl: string; ovr_weights: number[]; sort: number },
        { group_key: string; key: string; label_en: string; label_nl: string; ovr_weights: number[]; sort: number }>
      regions: T<
        { active_since: number; iso_codes: string[]; key: string; lat: number; lng: number; name_en: string; name_nl: string; note_en: string; note_nl: string; place: string; scouts: number; sort: number },
        { active_since: number; iso_codes?: string[]; key: string; lat: number; lng: number; name_en: string; name_nl: string; note_en: string; note_nl: string; place: string; scouts: number; sort: number }>
      site_metrics: T<
        { key: string; label_en: string; label_nl: string; sort: number; suffix: string; value: number },
        { key: string; label_en: string; label_nl: string; sort: number; suffix?: string; value: number }>
      statuses: T<{ id: number; label_en: string; label_nl: string }, { id: number; label_en: string; label_nl: string }>
      talent_clips: T<
        { ball: Json; duration: number; ents: Json; events: Json; flash_at: number | null; flash_kind: string | null; match_en: string; match_nl: string; minute: number; sort: number; talent_id: string; title_en: string; title_nl: string },
        { ball: Json; duration: number; ents: Json; events?: Json; flash_at?: number | null; flash_kind?: string | null; match_en: string; match_nl: string; minute: number; sort: number; talent_id: string; title_en: string; title_nl: string }>
      talent_centres: T<{ centre_key: string; sort: number; talent_id: string }, { centre_key: string; sort?: number; talent_id: string }>
      talent_traits: T<{ sort: number; talent_id: string; trait_key: string }, { sort: number; talent_id: string; trait_key: string }>
      talents: T<
        { age: number; archived_at: string | null; assists: number | null; bio_en: string; bio_nl: string; city: string; clean_sheets: number | null; composure: number; created_at: string; display_name: string; foot: string; gender: string; goals: number | null; heat: Json | null; height_cm: number; id: string; joined_on: string; matches: number; pace: number; physical: number; position_key: string; published: boolean; quote_en: string; quote_nl: string; region_key: string; saves: number | null; shirt_no: number; sort: number; status_id: number; technique: number; trial_location_key: string | null; updated_at: string; vision: number; work_rate: number },
        { age: number; archived_at?: string | null; assists?: number | null; bio_en: string; bio_nl: string; city: string; clean_sheets?: number | null; composure: number; created_at?: string; display_name: string; foot: string; gender: string; goals?: number | null; heat?: Json | null; height_cm: number; id: string; joined_on: string; matches?: number; pace: number; physical: number; position_key: string; published?: boolean; quote_en: string; quote_nl: string; region_key: string; saves?: number | null; shirt_no: number; sort?: number; status_id: number; technique: number; trial_location_key?: string | null; updated_at?: string; vision: number; work_rate: number }>
      team_members: T<{ id: number; initials: string; role_en: string; role_nl: string; sort: number }, { initials: string; role_en: string; role_nl: string; sort: number }>
      traits: T<{ key: string; label_en: string; label_nl: string }, { key: string; label_en: string; label_nl: string }>
    }
    Views: {
      talents_public: {
        Row: {
          a: number[] | null; age: number | null; assists: number | null; bio_en: string | null; bio_nl: string | null; city: string | null
          clean_sheets: number | null; foot: string | null; g: string | null; goals: number | null; group: string | null; h: number | null; heat: Json | null
          id: string | null; joined: string | null; matches: number | null; name: string | null; no: number | null; ovr: number | null
          pos: string | null; quote_en: string | null; quote_nl: string | null; region: string | null; saves: number | null
          sort: number | null; status: number | null; traits: string[] | null; trial_city: string | null
        }
        Relationships: Rel[]
      }
    }
    Functions: {
      centre_talent_counts: { Args: Record<PropertyKey, never>; Returns: { centre_key: string; talents: number }[] }
      create_talent: { Args: { p: Json; p_traits?: string[] }; Returns: string }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      set_talent_centres: { Args: { p_centres: string[]; p_id: string }; Returns: undefined }
      set_talent_archived: { Args: { p_archived: boolean; p_id: string }; Returns: undefined }
      set_talent_heat: { Args: { p_heat: Json; p_id: string }; Returns: undefined }
      update_talent: { Args: { p: Json; p_traits?: string[] }; Returns: string }
      submit_dossier_request: {
        Args: { p_club: string; p_email: string; p_lang?: string; p_message: string; p_name: string; p_nda_accepted: boolean; p_role: string; p_talent_ids: string[] }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database['public']
export type Tables<K extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])> = (PublicSchema['Tables'] & PublicSchema['Views'])[K]['Row']
export type TablesInsert<K extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][K]['Insert']
