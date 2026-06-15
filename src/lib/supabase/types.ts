/** Typed shape of the Supabase tables this site reads/writes.
 *  Keep in sync with `supabase/migrations/*.sql`.  When the admin DB
 *  schema is finalized and imported into this project, regenerate via
 *  `npx supabase gen types typescript --project-id <id>` to replace
 *  this file with the full database typings. */

export type Database = {
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          interest: string | null;
          message: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          interest?: string | null;
          message: string;
          source?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contact_submissions"]["Insert"]>;
        Relationships: [];
      };
      newsletter_subscriptions: {
        Row: {
          id: string;
          email: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          source?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["newsletter_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          mobile: string;
          username: string | null;
          email: string | null;
          role: string;
          avatar_url: string | null;
          employee_code: string | null;
          salary: number;
          allowance: number;
          deduction: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          mobile: string;
          username?: string | null;
          email?: string | null;
          role?: string;
          avatar_url?: string | null;
          employee_code?: string | null;
          salary?: number;
          allowance?: number;
          deduction?: number;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_name: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_name?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          detail?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          member_id: string | null;
          staff_ref: string | null;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          member_id?: string | null;
          staff_ref?: string | null;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
        Relationships: [];
      };
      finance_accounts: {
        Row: {
          id: string;
          name: string;
          type: string;
          account_number: string | null;
          opening_balance: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          account_number?: string | null;
          opening_balance?: number;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["finance_accounts"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          type: string;
          amount: number;
          category: string;
          account_id: string | null;
          project_slug: string | null;
          txn_date: string;
          description: string | null;
          party: string | null;
          method: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          amount: number;
          category: string;
          account_id?: string | null;
          project_slug?: string | null;
          txn_date?: string;
          description?: string | null;
          party?: string | null;
          method?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      client_followups: {
        Row: {
          id: string;
          client_name: string;
          mobile: string | null;
          email: string | null;
          interest: string | null;
          source: string | null;
          status: string;
          assigned_to: string | null;
          next_followup: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          mobile?: string | null;
          email?: string | null;
          interest?: string | null;
          source?: string | null;
          status?: string;
          assigned_to?: string | null;
          next_followup?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_followups"]["Insert"]>;
        Relationships: [];
      };
      daily_reports: {
        Row: {
          id: string;
          member_id: string;
          report_date: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          report_date?: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_reports"]["Insert"]>;
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          cover_url: string | null;
          body: string;
          title_en: string | null;
          excerpt_en: string | null;
          body_en: string | null;
          tags: string[] | null;
          published: boolean;
          published_at: string | null;
          author_name: string | null;
          meta_title: string | null;
          meta_description: string | null;
          layout: string;
          author_role: string | null;
          category: string | null;
          project: string | null;
          access_type: string;
          region: string | null;
          custom_css: string | null;
          custom_schema: string | null;
          status: string;
          scheduled_at: string | null;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          cover_url?: string | null;
          body: string;
          title_en?: string | null;
          excerpt_en?: string | null;
          body_en?: string | null;
          tags?: string[] | null;
          published?: boolean;
          published_at?: string | null;
          author_name?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          layout?: string;
          author_role?: string | null;
          category?: string | null;
          project?: string | null;
          access_type?: string;
          region?: string | null;
          custom_css?: string | null;
          custom_schema?: string | null;
          status?: string;
          scheduled_at?: string | null;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blog_posts"]["Insert"]>;
        Relationships: [];
      };
      blog_categories: {
        Row: { id: string; name: string; slug: string; created_at: string };
        Insert: { id?: string; name: string; slug: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["blog_categories"]["Insert"]>;
        Relationships: [];
      };
      blog_projects: {
        Row: { id: string; name: string; slug: string; sort: number; created_at: string };
        Insert: { id?: string; name: string; slug: string; sort?: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["blog_projects"]["Insert"]>;
        Relationships: [];
      };
      post_views: {
        Row: { slug: string; views: number; updated_at: string };
        Insert: { slug: string; views?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["post_views"]["Insert"]>;
        Relationships: [];
      };
      vault_credentials: {
        Row: {
          id: string;
          site_name: string;
          site_url: string | null;
          login_url: string | null;
          username: string | null;
          password: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_name: string;
          site_url?: string | null;
          login_url?: string | null;
          username?: string | null;
          password?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vault_credentials"]["Insert"]>;
        Relationships: [];
      };
      project_overrides: {
        Row: {
          slug: string;
          status: string | null;
          buildings: Record<string, unknown> | null;
          unit_map: Record<string, unknown> | null;
          share_map: Record<string, unknown> | null;
          facts: Record<string, unknown> | null;
          updated_at: string;
        };
        Insert: {
          slug: string;
          status?: string | null;
          buildings?: Record<string, unknown> | null;
          unit_map?: Record<string, unknown> | null;
          share_map?: Record<string, unknown> | null;
          facts?: Record<string, unknown> | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_overrides"]["Insert"]>;
        Relationships: [];
      };
      org_settings: {
        Row: {
          key: string;
          value: Record<string, unknown>;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Record<string, unknown>;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["org_settings"]["Insert"]>;
        Relationships: [];
      };
      marketing_officers: {
        Row: {
          id: string;
          name: string;
          officer_type: string;
          position: string | null;
          officer_code: string | null;
          district: string | null;
          mobile: string | null;
          reference: string | null;
          points: number;
          afr_total: number;
          income_total: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          officer_type?: string;
          position?: string | null;
          officer_code?: string | null;
          district?: string | null;
          mobile?: string | null;
          reference?: string | null;
          points?: number;
          afr_total?: number;
          income_total?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_officers"]["Insert"]>;
        Relationships: [];
      };
      marketing_point_entries: {
        Row: {
          id: string;
          officer_id: string;
          project_slug: string | null;
          item_label: string | null;
          quantity: number;
          points: number;
          afr: number;
          income: number;
          sale_date: string | null;
          client_name: string | null;
          client_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          officer_id: string;
          project_slug?: string | null;
          item_label?: string | null;
          quantity?: number;
          points: number;
          afr?: number;
          income?: number;
          sale_date?: string | null;
          client_name?: string | null;
          client_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_point_entries"]["Insert"]>;
        Relationships: [];
      };
      marketing_point_items: {
        Row: {
          id: string;
          label: string;
          points: number;
          afr: number;
          income: number;
          sort: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          points?: number;
          afr?: number;
          income?: number;
          sort?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_point_items"]["Insert"]>;
        Relationships: [];
      };
      investment_projects: {
        Row: {
          project_id: string;
          project_name: string;
          status: string;
          project_address: string | null;
          project_details: string | null;
          total_amount_required: number | null;
          per_user_share_amount: number | null;
          hide_total_amount: boolean;
          hide_share_price: boolean;
          current_funded_amount: number;
          project_progress: number;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          project_name: string;
          status: string;
          project_address?: string | null;
          project_details?: string | null;
          total_amount_required?: number | null;
          per_user_share_amount?: number | null;
          hide_total_amount?: boolean;
          hide_share_price?: boolean;
          current_funded_amount?: number;
          project_progress?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["investment_projects"]["Insert"]>;
        Relationships: [];
      };
      investment_types: {
        Row: {
          name: string;
          operator: string;
          classification: string;
          is_editable: boolean;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          name: string;
          operator: string;
          classification: string;
          is_editable?: boolean;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["investment_types"]["Insert"]>;
        Relationships: [];
      };
      investor_accounts: {
        Row: {
          uid: string;
          profile_id: string | null;
          fid: string | null;
          full_name: string;
          phone_number: string;
          email: string | null;
          language: string;
          is_verified: boolean;
          is_active: boolean;
          balance: Record<string, number> | null;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          uid: string;
          profile_id?: string | null;
          fid?: string | null;
          full_name?: string;
          phone_number: string;
          email?: string | null;
          language?: string;
          is_verified?: boolean;
          is_active?: boolean;
          balance?: Record<string, number> | null;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["investor_accounts"]["Insert"]>;
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          uid: string;
          project_id: string;
          total_paid: number;
          custom_share_price: number | null;
          discount: number;
          user_specific_start_date: string | null;
          user_specific_end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uid: string;
          project_id: string;
          total_paid?: number;
          custom_share_price?: number | null;
          discount?: number;
          user_specific_start_date?: string | null;
          user_specific_end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["investments"]["Insert"]>;
        Relationships: [];
      };
      investor_transactions: {
        Row: {
          transaction_id: string;
          rashid_number: string | null;
          uid: string;
          project_id: string | null;
          date: string;
          amount: number;
          type: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          transaction_id: string;
          rashid_number?: string | null;
          uid: string;
          project_id?: string | null;
          date: string;
          amount: number;
          type: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["investor_transactions"]["Insert"]>;
        Relationships: [];
      };
      investor_unsubscribe_requests: {
        Row: {
          id: string;
          uid: string;
          project_id: string;
          status: string;
          requested_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          admin_notes: string | null;
        };
        Insert: {
          id?: string;
          uid: string;
          project_id: string;
          status?: string;
          requested_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          admin_notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["investor_unsubscribe_requests"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
