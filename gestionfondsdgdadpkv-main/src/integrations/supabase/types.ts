export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          libelle: string
          numero_ordre: number | null
          type: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          libelle: string
          numero_ordre?: number | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          libelle?: string
          numero_ordre?: number | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contentieux: {
        Row: {
          code: string
          code_rubrique: string | null
          created_at: string
          id: string
          libelle: string
          montant: number | null
          numero_ordre: number
          rubrique_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          code_rubrique?: string | null
          created_at?: string
          id?: string
          libelle: string
          montant?: number | null
          numero_ordre?: number
          rubrique_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          code_rubrique?: string | null
          created_at?: string
          id?: string
          libelle?: string
          montant?: number | null
          numero_ordre?: number
          rubrique_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contentieux_rubrique_id_fkey"
            columns: ["rubrique_id"]
            isOneToOne: false
            referencedRelation: "rubriques"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          annee: number | null
          beneficiaire: string
          code_contentieux: string | null
          created_at: string
          date_transaction: string
          heure: string
          id: string
          mois: number | null
          mois_annee: string | null
          mois_lettre: string | null
          montant: number
          montant_lettre: string | null
          motif: string
          numero_beo: string | null
          numero_bon: number
          observation: string | null
          rubrique_id: string | null
          service_id: string | null
          signature_compt: boolean | null
          signature_daf: boolean | null
          signature_dp: boolean | null
          solde_apres: number | null
          solde_avant: number | null
          statut: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          annee?: number | null
          beneficiaire: string
          code_contentieux?: string | null
          created_at?: string
          date_transaction?: string
          heure?: string
          id?: string
          mois?: number | null
          mois_annee?: string | null
          mois_lettre?: string | null
          montant: number
          montant_lettre?: string | null
          motif: string
          numero_beo?: string | null
          numero_bon?: number
          observation?: string | null
          rubrique_id?: string | null
          service_id?: string | null
          signature_compt?: boolean | null
          signature_daf?: boolean | null
          signature_dp?: boolean | null
          solde_apres?: number | null
          solde_avant?: number | null
          statut?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          annee?: number | null
          beneficiaire?: string
          code_contentieux?: string | null
          created_at?: string
          date_transaction?: string
          heure?: string
          id?: string
          mois?: number | null
          mois_annee?: string | null
          mois_lettre?: string | null
          montant?: number
          montant_lettre?: string | null
          motif?: string
          numero_beo?: string | null
          numero_bon?: number
          observation?: string | null
          rubrique_id?: string | null
          service_id?: string | null
          signature_compt?: boolean | null
          signature_daf?: boolean | null
          signature_dp?: boolean | null
          solde_apres?: number | null
          solde_avant?: number | null
          statut?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "depenses_rubrique_id_fkey"
            columns: ["rubrique_id"]
            isOneToOne: false
            referencedRelation: "rubriques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "depenses_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      feuilles_caisse: {
        Row: {
          cloturee_at: string | null
          cloturee_par: string | null
          created_at: string
          date_feuille: string
          id: string
          is_cloturee: boolean
          observations: string | null
          solde_final: number
          solde_initial: number
          total_depenses: number
          total_recettes: number
          updated_at: string
        }
        Insert: {
          cloturee_at?: string | null
          cloturee_par?: string | null
          created_at?: string
          date_feuille: string
          id?: string
          is_cloturee?: boolean
          observations?: string | null
          solde_final?: number
          solde_initial?: number
          total_depenses?: number
          total_recettes?: number
          updated_at?: string
        }
        Update: {
          cloturee_at?: string | null
          cloturee_par?: string | null
          created_at?: string
          date_feuille?: string
          id?: string
          is_cloturee?: boolean
          observations?: string | null
          solde_final?: number
          solde_initial?: number
          total_depenses?: number
          total_recettes?: number
          updated_at?: string
        }
        Relationships: []
      }
      local_users: {
        Row: {
          created_at: string
          failed_attempts: number
          full_name: string | null
          id: string
          is_active: boolean
          is_protected: boolean
          last_login_at: string | null
          locked_until: string | null
          password_hash: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_protected?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          password_hash: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_protected?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          password_hash?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          username: string
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          username: string
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          username?: string
        }
        Relationships: []
      }
      parametres: {
        Row: {
          cle: string
          created_at: string
          description: string | null
          id: string
          updated_at: string
          valeur: string
        }
        Insert: {
          cle: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur: string
        }
        Update: {
          cle?: string
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          valeur?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          failed_login_attempts: number
          full_name: string | null
          id: string
          is_active: boolean
          is_locked: boolean
          last_login_at: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          failed_login_attempts?: number
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          last_login_at?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          failed_login_attempts?: number
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          last_login_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      programmations: {
        Row: {
          annee: number
          created_at: string
          designation: string
          id: string
          is_validated: boolean
          jours: number | null
          mois: number
          montant_lettre: string | null
          montant_prevu: number
          numero_ordre: number | null
          periode: string | null
          rubrique_id: string | null
          signature_compt: boolean | null
          signature_daf: boolean | null
          signature_dp: boolean | null
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          annee: number
          created_at?: string
          designation: string
          id?: string
          is_validated?: boolean
          jours?: number | null
          mois: number
          montant_lettre?: string | null
          montant_prevu?: number
          numero_ordre?: number | null
          periode?: string | null
          rubrique_id?: string | null
          signature_compt?: boolean | null
          signature_daf?: boolean | null
          signature_dp?: boolean | null
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          annee?: number
          created_at?: string
          designation?: string
          id?: string
          is_validated?: boolean
          jours?: number | null
          mois?: number
          montant_lettre?: string | null
          montant_prevu?: number
          numero_ordre?: number | null
          periode?: string | null
          rubrique_id?: string | null
          signature_compt?: boolean | null
          signature_daf?: boolean | null
          signature_dp?: boolean | null
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programmations_rubrique_id_fkey"
            columns: ["rubrique_id"]
            isOneToOne: false
            referencedRelation: "rubriques"
            referencedColumns: ["id"]
          },
        ]
      }
      recettes: {
        Row: {
          annee: number | null
          created_at: string
          date_transaction: string
          heure: string
          id: string
          mois: number | null
          mois_annee: string | null
          mois_lettre: string | null
          montant: number
          montant_lettre: string | null
          motif: string
          numero_beo: string | null
          numero_bon: number
          observation: string | null
          provenance: string
          rubrique_id: string | null
          service_id: string | null
          signature_compt: boolean | null
          signature_daf: boolean | null
          signature_dp: boolean | null
          solde_apres: number | null
          solde_avant: number | null
          statut: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          annee?: number | null
          created_at?: string
          date_transaction?: string
          heure?: string
          id?: string
          mois?: number | null
          mois_annee?: string | null
          mois_lettre?: string | null
          montant: number
          montant_lettre?: string | null
          motif: string
          numero_beo?: string | null
          numero_bon?: number
          observation?: string | null
          provenance: string
          rubrique_id?: string | null
          service_id?: string | null
          signature_compt?: boolean | null
          signature_daf?: boolean | null
          signature_dp?: boolean | null
          solde_apres?: number | null
          solde_avant?: number | null
          statut?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          annee?: number | null
          created_at?: string
          date_transaction?: string
          heure?: string
          id?: string
          mois?: number | null
          mois_annee?: string | null
          mois_lettre?: string | null
          montant?: number
          montant_lettre?: string | null
          motif?: string
          numero_beo?: string | null
          numero_bon?: number
          observation?: string | null
          provenance?: string
          rubrique_id?: string | null
          service_id?: string | null
          signature_compt?: boolean | null
          signature_daf?: boolean | null
          signature_dp?: boolean | null
          solde_apres?: number | null
          solde_avant?: number | null
          statut?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recettes_rubrique_id_fkey"
            columns: ["rubrique_id"]
            isOneToOne: false
            referencedRelation: "rubriques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recettes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      repartitions: {
        Row: {
          created_at: string
          date_repartition: string
          id: string
          montant: number
          montant_lettre: string | null
          numero_ordre: number
          numero_repartition: string
          observation: string | null
          service_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_repartition?: string
          id?: string
          montant?: number
          montant_lettre?: string | null
          numero_ordre?: number
          numero_repartition: string
          observation?: string | null
          service_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_repartition?: string
          id?: string
          montant?: number
          montant_lettre?: string | null
          numero_ordre?: number
          numero_repartition?: string
          observation?: string | null
          service_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repartitions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          config: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          is_public: boolean
          name: string
          updated_at: string
        }
        Insert: {
          config: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      rubriques: {
        Row: {
          categorie: string | null
          categorie_id: string | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          imp: string | null
          imputation: string | null
          is_active: boolean
          libelle: string
          no_beo: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          categorie?: string | null
          categorie_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          imp?: string | null
          imputation?: string | null
          is_active?: boolean
          libelle: string
          no_beo?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          categorie?: string | null
          categorie_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          imp?: string | null
          imputation?: string | null
          is_active?: boolean
          libelle?: string
          no_beo?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubriques_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          libelle: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          libelle: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          libelle?: string
          updated_at?: string
        }
        Relationships: []
      }
      signataires: {
        Row: {
          created_at: string
          fonction: string | null
          grade: string | null
          id: string
          is_active: boolean | null
          matricule: string
          nom: string
          type_signature: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fonction?: string | null
          grade?: string | null
          id?: string
          is_active?: boolean | null
          matricule: string
          nom: string
          type_signature?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fonction?: string | null
          grade?: string | null
          id?: string
          is_active?: boolean | null
          matricule?: string
          nom?: string
          type_signature?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          id: string
          signature_hash: string | null
          signed_at: string
          transaction_id: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          type_signature: string
          user_id: string
        }
        Insert: {
          id?: string
          signature_hash?: string | null
          signed_at?: string
          transaction_id: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          type_signature: string
          user_id: string
        }
        Update: {
          id?: string
          signature_hash?: string | null
          signed_at?: string
          transaction_id?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          type_signature?: string
          user_id?: string
        }
        Relationships: []
      }
      sommaires_sauvegardes: {
        Row: {
          annee: number | null
          categorie_id: string | null
          code: string | null
          created_at: string
          id: string
          libelle: string
          mois: number | null
          mois_annee: string | null
          montant: number | null
          montant_lettre: string | null
          numero_sommaire: number
          signature_compt: boolean | null
          signature_daf: boolean | null
          signature_dp: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          annee?: number | null
          categorie_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          libelle: string
          mois?: number | null
          mois_annee?: string | null
          montant?: number | null
          montant_lettre?: string | null
          numero_sommaire?: number
          signature_compt?: boolean | null
          signature_daf?: boolean | null
          signature_dp?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          annee?: number | null
          categorie_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          libelle?: string
          mois?: number | null
          mois_annee?: string | null
          montant?: number | null
          montant_lettre?: string | null
          numero_sommaire?: number
          signature_compt?: boolean | null
          signature_daf?: boolean | null
          signature_dp?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sommaires_sauvegardes_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "local_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "instructeur" | "observateur"
      transaction_status: "brouillon" | "valide" | "archive"
      transaction_type: "recette" | "depense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "instructeur", "observateur"],
      transaction_status: ["brouillon", "valide", "archive"],
      transaction_type: ["recette", "depense"],
    },
  },
} as const
