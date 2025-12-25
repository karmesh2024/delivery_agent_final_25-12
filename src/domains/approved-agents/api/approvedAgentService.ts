import { supabase } from "@/lib/supabase";
import { NewAgentPayload, CoreAgent, AgentDetails, AgentProfile, Wallet, ApprovedAgent, AgentDocument, RawApprovedAgentQueryResult, ApprovedAgentZone, GeographicZone, AgentCommission, SupabaseAgentResponse } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper function to map SupabaseAgentResponse to ApprovedAgent
const mapSupabaseAgentToApprovedAgent = (agent: SupabaseAgentResponse): ApprovedAgent => {
  console.log("mapSupabaseAgentToApprovedAgent: Incoming agent data", JSON.stringify(agent, null, 2));

  // Safely extract details
  let resolvedDetails: AgentDetails | null = null;
  if (agent.details !== null) {
    resolvedDetails = { ...agent.details, agent_id: agent.id } as AgentDetails;
  }

  // Ensure function_specific_commissions is always an array within resolvedDetails
  if (resolvedDetails) {
    if (resolvedDetails.function_specific_commissions && !Array.isArray(resolvedDetails.function_specific_commissions)) {
      resolvedDetails.function_specific_commissions = [resolvedDetails.function_specific_commissions as AgentCommission];
    } else if (!resolvedDetails.function_specific_commissions) {
      resolvedDetails.function_specific_commissions = [];
    }
  }

  // Safely extract profile
  let resolvedProfile: AgentProfile | null = null;
  if (agent.profile !== null) {
    resolvedProfile = agent.profile as AgentProfile;
  }

  // Wallets is an array, extract the first element if available, otherwise null
  const resolvedWallet: Wallet | null = Array.isArray(agent.wallets) && agent.wallets.length > 0
    ? agent.wallets[0]
    : null;

  // Keep approved_agent_zones as an empty array if empty or null, instead of null
  const resolvedApprovedAgentZones: ApprovedAgentZone[] = Array.isArray(agent.approved_agent_zones)
    ? agent.approved_agent_zones
    : [];

  // Documents are an array, ensure they are mapped correctly. If null/undefined, set to empty array.
  const resolvedDocuments: AgentDocument[] = Array.isArray(agent.documents)
    ? agent.documents
    : [];

  console.log("mapSupabaseAgentToApprovedAgent: Resolved details=", resolvedDetails, "profile=", resolvedProfile, "wallet=", resolvedWallet, "zones=", resolvedApprovedAgentZones, "documents=", resolvedDocuments);
  console.log("mapSupabaseAgentToApprovedAgent: Agent's original full_name=", agent.full_name, "email=", agent.email, "phone=", agent.phone);
  console.log("mapSupabaseAgentToApprovedAgent: Resolved profile full_name=", resolvedProfile?.full_name, "email=", resolvedProfile?.email, "phone=", resolvedProfile?.phone);

  return {
    id: agent.id,
    created_at: agent.created_at,
    updated_at: agent.updated_at,
    details: resolvedDetails,
    profile: resolvedProfile,
    wallet: resolvedWallet,
    full_name: resolvedProfile?.full_name || agent.full_name || null,
    email: resolvedProfile?.email || agent.email || null,
    phone: resolvedProfile?.phone || agent.phone || null,
    approved_agent_zones: resolvedApprovedAgentZones,
    documents: resolvedDocuments,
  };
};

export interface SqlResponse {
  data: Record<string, unknown>[]; // تحديد نوع بيانات أكثر دقة بناءً على الاستجابة المتوقعة
  error: { message: string, code: string } | null;
}

export const approvedAgentService = {
  /**
   * ينشئ وكيلًا معتمدًا جديدًا، بما في ذلك المصادقة، وتفاصيل الوكيل، والملف الشخصي، والمحفظة.
   * @param payload البيانات الخاصة بالوكيل الجديد.
   * @returns معرف الوكيل الذي تم إنشاؤه حديثًا أو خطأ.
   */
  createApprovedAgent: async (payload: NewAgentPayload): Promise<{ agentId: string; error: string | null }> => {
    console.log("createApprovedAgent: Payload received", payload);
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { agentId: '', error: 'Supabase client is not initialized.' };
    }

    try {
      const { data: authData, error: authError } = await supabase!.auth.signUp({
        phone: payload.phone,
        password: payload.password || Math.random().toString(36).slice(-8),
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError?.message);
        let userFriendlyError = 'فشل إنشاء مستخدم المصادقة.';
        if (authError?.message.includes('User already registered')) {
          userFriendlyError = 'رقم الهاتف هذا مسجل بالفعل. يرجى استخدام رقم هاتف آخر أو التواصل مع الدعم.';
        }
        return { agentId: '', error: userFriendlyError };
      }

      const newAgentId = authData.user.id;

      const { error: agentError } = await supabase!
        .from('agents')
        .insert([{
          id: newAgentId,
          full_name: payload.full_name || null,
          phone: payload.phone || null,
          email: payload.email || null,
        }]);

      if (agentError) {
        console.error('Error inserting into agents table:', agentError.message);
        return { agentId: '', error: agentError.message };
      }

      const { error: detailsError } = await supabase!
        .from('agent_details')
        .insert([{
          id: newAgentId,
          storage_location: payload.storage_location || "N/A",
          region: payload.region || "N/A",
          agent_type: payload.agent_type || "individual",
          payment_method: payload.payment_method || "N/A",
          approved: payload.approved ?? false,
          function_specific_commissions: payload.function_specific_commissions || [],
        }]);

      if (detailsError) {
        console.error('Error inserting into agent_details table:', detailsError.message);
        await supabase!.from('agents').delete().eq('id', newAgentId);
        return { agentId: '', error: detailsError.message };
      }

      console.log("createApprovedAgent: Inserting into agent_profiles with payload", {
        id: newAgentId,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        avatar_url: payload.avatar_url,
        billing_address: payload.billing_address,
        payment_info: payload.payment_info,
      });
      const { error: profileError } = await supabase!
        .from('agent_profiles')
        .insert([{
          id: newAgentId,
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          avatar_url: payload.avatar_url,
          billing_address: payload.billing_address,
          payment_info: payload.payment_info,
        }]);

      if (profileError) {
        console.error("Error inserting into agent_profiles table:", profileError.message || profileError);
        await supabase!.from('agent_details').delete().eq('id', newAgentId);
        await supabase!.from('agents').delete().eq('id', newAgentId);
        return { agentId: '', error: profileError.message };
      }
      console.log("createApprovedAgent: Successfully inserted into agent_profiles");

      // Insert approved agent zones if provided
      if (payload.approved_agent_zones && payload.approved_agent_zones.length > 0) {
        console.log("createApprovedAgent: Inserting approved_agent_zones", payload.approved_agent_zones);
        const zonesToInsert = payload.approved_agent_zones.map(zone => ({
          agent_id: newAgentId,
          geographic_zone_id: zone.geographic_zone_id,
          zone_name: zone.zone_name,
          is_active: zone.is_active,
          is_primary: zone.is_primary,
        }));
        const { error: zonesError } = await supabase!
          .from('approved_agent_zones')
          .insert(zonesToInsert);

        if (zonesError) {
          console.error('Error inserting into approved_agent_zones table:', zonesError.message);
          // Rollback previous insertions on error
          await supabase!.from('wallets').delete().eq('user_id', newAgentId);
          await supabase!.from('agent_profiles').delete().eq('id', newAgentId);
          await supabase!.from('agent_details').delete().eq('id', newAgentId);
          await supabase!.from('agents').delete().eq('id', newAgentId);
          return { agentId: '', error: zonesError.message };
        }
        console.log("createApprovedAgent: Successfully inserted approved_agent_zones");
      }

      // Insert agent documents if provided
      if (payload.agent_documents && payload.agent_documents.length > 0) {
        console.log("createApprovedAgent: Inserting agent_documents", payload.agent_documents);
        const documentsToInsert = payload.agent_documents.map(doc => ({
          agent_id: newAgentId,
          document_type: doc.document_type,
          document_url: doc.document_url,
          verification_status: doc.verification_status,
          // uploaded_at: new Date().toISOString(), // Supabase should handle this default
        }));
        const { error: documentsError } = await supabase!
          .from('agent_documents')
          .insert(documentsToInsert);

        if (documentsError) {
          console.error('Error inserting into agent_documents table:', documentsError.message);
          // Rollback previous insertions on error
          await supabase!.from('wallets').delete().eq('user_id', newAgentId);
          await supabase!.from('approved_agent_zones').delete().eq('agent_id', newAgentId);
          await supabase!.from('agent_profiles').delete().eq('id', newAgentId);
          await supabase!.from('agent_details').delete().eq('id', newAgentId);
          await supabase!.from('agents').delete().eq('id', newAgentId);
          return { agentId: '', error: documentsError.message };
        }
        console.log("createApprovedAgent: Successfully inserted agent_documents");
      }

      const { error: walletError } = await supabase!
        .from('wallets')
        .insert([{
          user_id: newAgentId,
          balance: payload.initial_balance ?? 0.0,
          currency: payload.currency ?? 'SAR',
          wallet_type: payload.wallet_type ?? 'AGENT_WALLET',
        }]);

      if (walletError) {
        console.error('Error creating wallet:', walletError.message);
        await supabase!.from('agent_profiles').delete().eq('id', newAgentId);
        await supabase!.from('agent_details').delete().eq('id', newAgentId);
        await supabase!.from('agents').delete().eq('id', newAgentId);
        return { agentId: '', error: walletError.message };
      }

      return { agentId: newAgentId, error: null };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error during agent creation:', errorMessage);
      return { agentId: '', error: errorMessage };
    }
  },

  /**
   * يجلب قائمة بالوكلاء المعتمدين مع تفاصيلهم وملفاتهم الشخصية ومحافظهم.
   * @returns مصفوفة من ApprovedAgent أو خطأ.
   */
  getApprovedAgents: async (): Promise<{ agents: ApprovedAgent[] | null; error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { agents: null, error: 'Supabase client is not initialized.' };
    }

    try {
      // 1) اجلب بيانات الوكلاء بدون تضمين المحافظ لتفادي غموض العلاقات في PostgREST
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select(`
          id, created_at, updated_at, full_name, email, phone,
          details:agent_details(*),
          profile:agent_profiles(*, avatar_url),
          approved_agent_zones(id, geographic_zone_id, zone_name, is_active, is_primary),
          documents:agent_documents!agent_documents_agent_id_fkey(*)
        `);

      if (agentsError) {
        console.error('Error fetching approved agents:', agentsError.message);
        return { agents: null, error: agentsError.message };
      }

      if (!agentsData) {
        return { agents: [], error: null };
      }

      console.log("getApprovedAgents: Raw agents (without wallets):", agentsData);

      // 2) اجلب المحافظ في استعلام منفصل ثم قم بالدمج محليًا حسب user_id = agent.id
      const agentIds = (agentsData as Array<{ id: string }>).map(a => a.id);
      let walletsByUserId = new Map<string, Wallet>();
      if (agentIds.length > 0) {
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select('id, user_id, balance, currency, wallet_type')
          .in('user_id', agentIds);

        if (walletsError) {
          console.error('Error fetching wallets for agents:', walletsError.message);
        } else if (walletsData) {
          for (const w of walletsData as Wallet[]) {
            // إذا كان هناك أكثر من محفظة للمستخدم، اختر الأولى وفق الترتيب الحالي
            if (!walletsByUserId.has(w.user_id)) {
              walletsByUserId.set(w.user_id, w);
            }
          }
        }
      }

      // 3) دمج المحافظ ضمن كل عنصر قبل التحويل إلى ApprovedAgent
      const agentsWithWallets = (agentsData as unknown as SupabaseAgentResponse[]).map((agent) => {
        const wallet = walletsByUserId.get(agent.id || '');
        // أضف كمصفوفة لتتوافق مع mapSupabaseAgentToApprovedAgent
        return {
          ...agent,
          wallets: wallet ? [wallet] : [],
        } as SupabaseAgentResponse;
      });

      const approvedAgents: ApprovedAgent[] = agentsWithWallets.map(mapSupabaseAgentToApprovedAgent);

      return { agents: approvedAgents, error: null };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error fetching approved agents:', errorMessage);
      return { agents: null, error: errorMessage };
    }
  },

  /**
   * يجلب ملخص وكيل معتمد واحد بناءً على معرف الوكيل.
   * @param agentId معرف الوكيل.
   * @returns كائن ApprovedAgent أو خطأ.
   */
  getApprovedAgentSummary: async (agentId: string): Promise<{ agent: ApprovedAgent | null; error: string | null }> => {
    console.log("getApprovedAgentSummary: Fetching summary for agentId", agentId);
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { agent: null, error: 'Supabase client is not initialized.' };
    }

    try {
      // 1) اجلب بيانات الوكيل بدون تضمين المحافظ لتفادي غموض العلاقات في PostgREST
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select(`
          id, created_at, updated_at, full_name, email, phone,
          details:agent_details(id, storage_location, region, agent_type, payment_method, approved, function_specific_commissions, created_at, updated_at),
          profile:agent_profiles(*, avatar_url),
          approved_agent_zones(id, geographic_zone_id, zone_name, is_active, is_primary),
          documents:agent_documents!agent_documents_agent_id_fkey(*)
        `)
        .eq('id', agentId)
        .single();

      if (agentError) {
        console.error('Error fetching approved agent summary:', agentError.message);
        return { agent: null, error: agentError.message };
      }

      if (!agentData) {
        console.log("getApprovedAgentSummary: No data found for agentId", agentId);
        return { agent: null, error: 'No agent data found.' };
      }

      console.log("getApprovedAgentSummary: Raw data from Supabase (without wallets):", agentData);

      // 2) اجلب المحفظة في استعلام منفصل ثم قم بالدمج محليًا
      let wallet: Wallet | null = null;
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select('id, user_id, balance, currency, wallet_type')
        .or(`user_id.eq.${agentId},agent_id.eq.${agentId}`)
        .limit(1)
        .single();

      if (walletsError) {
        console.warn('Error fetching wallet (non-fatal):', walletsError.message);
        // لا نعتبر هذا خطأ قاتل، فقط نسجل تحذير
      } else if (walletsData) {
        wallet = walletsData as Wallet;
        console.log("getApprovedAgentSummary: Fetched wallet separately:", wallet);
      }

      // 3) دمج المحفظة مع بيانات الوكيل
      const agentDataWithWallet = {
        ...agentData,
        wallets: wallet ? [wallet] : []
      };

      console.log("getApprovedAgentSummary: Combined data with wallet:", agentDataWithWallet);

      const approvedAgent: ApprovedAgent = mapSupabaseAgentToApprovedAgent(agentDataWithWallet as unknown as SupabaseAgentResponse);
      console.log("getApprovedAgentSummary: Mapped ApprovedAgent", approvedAgent);

      return { agent: approvedAgent, error: null };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error fetching agent summary:', errorMessage);
      return { agent: null, error: errorMessage };
    }
  },

  /**
   * يجلب المناطق الجغرافية المحددة في النظام.
   * @returns مصفوفة من GeographicZone أو خطأ.
   */
  getGeographicZones: async (): Promise<{ data: GeographicZone[] | null; error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { data: null, error: 'Supabase client is not initialized.' };
    }
    try {
      const { data, error } = await supabase
        .from('geographic_zones')
        .select('*');

      if (error) {
        console.error('Error fetching geographic zones:', error.message);
        return { data: null, error: error.message };
      }
      return { data: data as GeographicZone[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error fetching geographic zones:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * يجلب المناطق المعتمدة لوكيل معين.
   * @param agentId معرف الوكيل.
   * @returns مصفوفة من ApprovedAgentZone أو خطأ.
   */
  getApprovedAgentZones: async (agentId: string): Promise<{ data: ApprovedAgentZone[] | null; error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { data: null, error: 'Supabase client is not initialized.' };
    }
    try {
      const { data, error } = await supabase
        .from('approved_agent_zones')
        .select('*')
        .eq('agent_id', agentId);

      if (error) {
        console.error('Error fetching approved agent zones:', error.message);
        return { data: null, error: error.message };
      }
      return { data: data as ApprovedAgentZone[], error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error fetching approved agent zones:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * يضيف منطقة معتمدة جديدة لوكيل.
   * @param payload بيانات المنطقة المعتمدة الجديدة.
   * @returns كائن ApprovedAgentZone الذي تم إنشاؤه حديثًا أو خطأ.
   */
  addApprovedAgentZone: async (payload: {
    agent_id: string;
    geographic_zone_id: string;
    zone_name: string;
    is_active: boolean;
    is_primary: boolean;
  }): Promise<{ data: ApprovedAgentZone | null; error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { data: null, error: 'Supabase client is not initialized.' };
    }
    try {
      const { data, error } = await supabase
        .from('approved_agent_zones')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error adding approved agent zone:', error.message);
        return { data: null, error: error.message };
      }
      return { data: data as ApprovedAgentZone, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error adding approved agent zone:', errorMessage);
      return { data: null, error: errorMessage };
    }
  },

  /**
   * يحدث حالة منطقة معتمدة لوكيل.
   * @param zoneId معرف المنطقة المعتمدة.
   * @param status الحالة الجديدة (نشط/غير نشط).
   * @returns خطأ إذا فشلت العملية.
   */
  updateApprovedAgentZoneStatus: async (zoneId: string, status: boolean): Promise<{ error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { error: 'Supabase client is not initialized.' };
    }
    try {
      const { error } = await supabase
        .from('approved_agent_zones')
        .update({ is_active: status })
        .eq('id', zoneId);

      if (error) {
        console.error('Error updating approved agent zone status:', error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error updating approved agent zone status:', errorMessage);
      return { error: errorMessage };
    }
  },

  /**
   * يحدث المنطقة الأساسية لوكيل.
   * @param zoneId معرف المنطقة المعتمدة.
   * @param isPrimary هل هي المنطقة الأساسية الجديدة.
   * @returns خطأ إذا فشلت العملية.
   */
  updateApprovedAgentZonePrimary: async (zoneId: string, isPrimary: boolean): Promise<{ error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { error: 'Supabase client is not initialized.' };
    }
    try {
      // أولاً، قم بإلغاء تعيين المنطقة الأساسية الحالية لهذا الوكيل إذا كانت موجودة
      // هذا يتطلب معرف الوكيل، الذي يجب أن نحصل عليه من zoneId
      const { data: zoneData, error: fetchError } = await supabase
        .from('approved_agent_zones')
        .select('agent_id')
        .eq('id', zoneId)
        .single();

      if (fetchError || !zoneData) {
        console.error('Error fetching zone data to update primary:', fetchError?.message || 'No zone data found');
        return { error: fetchError?.message || 'Zone not found.' };
      }

      if (isPrimary) {
        await supabase
          .from('approved_agent_zones')
          .update({ is_primary: false })
          .eq('agent_id', zoneData.agent_id);
      }

      const { error } = await supabase
        .from('approved_agent_zones')
        .update({ is_primary: isPrimary })
        .eq('id', zoneId);

      if (error) {
        console.error('Error updating approved agent zone primary status:', error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error updating approved agent zone primary status:', errorMessage);
      return { error: errorMessage };
    }
  },

  /**
   * يحذف منطقة معتمدة لوكيل.
   * @param zoneId معرف المنطقة المعتمدة.
   * @returns خطأ إذا فشلت العملية.
   */
  deleteApprovedAgentZone: async (zoneId: string): Promise<{ error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { error: 'Supabase client is not initialized.' };
    }
    try {
      const { error } = await supabase
        .from('approved_agent_zones')
        .delete()
        .eq('id', zoneId);

      if (error) {
        console.error('Error deleting approved agent zone:', error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error deleting approved agent zone:', errorMessage);
      return { error: errorMessage };
    }
  },

  updateApprovedAgentDetails: async (agentId: string, payload: {
    storage_location?: string;
    region?: string;
    agent_type?: string;
    payment_method?: string;
    function_specific_commissions?: AgentCommission[] | null;
    notes?: string;
    approved?: boolean;
  }): Promise<{ error: string | null }> => {
    if (!supabase) {
      return { error: 'Supabase client is not initialized.' };
    }
    const { error: updateError } = await supabase
      .from('agent_details')
      .update({
        storage_location: payload.storage_location,
        region: payload.region,
        agent_type: payload.agent_type,
        payment_method: payload.payment_method,
        function_specific_commissions: payload.function_specific_commissions,
        notes: payload.notes,
        approved: payload.approved,
      })
      .eq('id', agentId);

    if (updateError) {
      console.error(`Error updating agent details for agent ${agentId}:`, updateError.message);
      return { error: updateError.message };
    }
    return { error: null };
  },

  /**
   * يرفع مستند وكيل إلى Supabase Storage ويسجل معلوماته في قاعدة البيانات.
   * @param agentId معرف الوكيل.
   * @param file الملف المراد رفعه.
   * @param documentType نوع المستند (مثل national_id_front).
   * @returns عنوان URL العام للملف المرفوع أو خطأ.
   */
  uploadAgentDocument: async (agentId: string, file: File, documentType: string): Promise<{ publicUrl: string | null; error: string | null }> => {
    if (!supabase) {
      return { publicUrl: null, error: 'Supabase client is not initialized.' };
    }
    try {
      const encodedFileName = encodeURIComponent(file.name);
      const filePath = `${agentId}/${documentType}_${Date.now()}_${encodedFileName}`;
      
      const bucketName = 'agents-documents'; // Always use agents-documents

      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      // If upload failed, return an error immediately.
      if (uploadError) {
        console.error(`Error uploading file to Supabase Storage: ${uploadError.message}`);
        return { publicUrl: null, error: `فشل رفع الملف إلى Supabase Storage: ${uploadError.message}` };
      }

      let publicUrl: string | null = null;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {
        publicUrl = publicUrlData.publicUrl;
      } else {
        // If publicUrlData is null or publicUrl is null after successful upload,
        // it's an unexpected state. This should ideally not happen if upload was successful.
        const errorMessage = 'فشل في الحصول على الرابط العام بعد الرفع بنجاح. قد يشير هذا إلى حالة غير متوقعة.';
        console.error(errorMessage);
        return { publicUrl: null, error: errorMessage };
      }

      // Always insert into agent_documents table
      const { error: insertError } = await supabase
        .from('agent_documents')
        .insert({
          agent_id: agentId,
          document_type: documentType,
          document_url: publicUrl,
          verification_status: 'pending',
        });

      if (insertError) {
        console.error(`Error inserting document ${documentType} into agent_documents table:`, insertError.message);
        return { publicUrl: null, error: insertError.message };
      }
      console.log(`Successfully inserted document ${documentType} for agent ${agentId} with URL: ${publicUrl}`);

      return { publicUrl: publicUrl, error: null };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء رفع المستند.';
      console.error('Unexpected error during document upload (catch block):', errorMessage);
      return { publicUrl: null, error: errorMessage };
    }
  },

  /**
   * يحدث مناطق عمل الوكيل في قاعدة البيانات.
   * @param agentId معرف الوكيل.
   * @param zones مصفوفة بأسماء المناطق.
   * @returns خطأ إذا فشلت العملية.
   */
  updateAgentZones: async (agentId: string, zones: string[]): Promise<{ error: string | null }> => {
    if (!supabase) {
      return { error: 'Supabase client is not initialized.' };
    }
    // NOTE: area_covered is now managed by approved_agent_zones table, so this function is deprecated for its original purpose.
    // Keep it here for now if there are other uses, but its functionality for area_covered in agent_details is removed.
    return { error: null };
  },

  /**
   * Updates the approval status of an agent.
   * @param agentId The ID of the agent to update.
   * @param isApproved The new approval status (true for approved, false for not approved).
   * @returns An object with success status and any error.
   */
  updateAgentApprovalStatus: async (
    agentId: string,
    isApproved: boolean
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { success: false, error: 'Supabase client is not initialized.' };
    }

    try {
      const { data, error } = await supabase
        .from('agent_details')
        .update({ approved: isApproved })
        .eq('id', agentId);

      if (error) {
        console.error('Error updating agent approval status:', error.message);
        return { success: false, error: error.message };
      }

      console.log(`Agent ${agentId} approval status updated to ${isApproved}.`, data);
      return { success: true, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('Unexpected error updating agent approval status:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Updates the profile information of an agent.
   * @param agentId The ID of the agent to update.
   * @param payload The profile data to update.
   * @returns An object with success status and any error.
   */
  updateAgentProfile: async (
    agentId: string,
    payload: {
      full_name?: string;
      email?: string;
      phone?: string;
      avatar_url?: string;
      billing_address?: string;
      payment_info?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { success: false, error: 'Supabase client is not initialized.' };
    }

    try {
      const { data, error } = await supabase
        .from('agent_profiles')
        .update({
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          avatar_url: payload.avatar_url,
          billing_address: payload.billing_address,
          payment_info: payload.payment_info,
        })
        .eq('id', agentId);

      if (error) {
        console.error(`Error updating agent profile for agent ${agentId}:`, error.message);
        return { success: false, error: error.message };
      }

      console.log(`Agent ${agentId} profile updated successfully.`, data);
      return { success: true, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('Unexpected error updating agent profile:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * يحدّث حالة التحقق من مستند وكيل.
   * @param documentId معرف المستند.
   * @param status الحالة الجديدة (pending, approved, rejected).
   * @returns خطأ إذا فشلت العملية.
   */
  updateAgentDocumentStatus: async (documentId: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ error: string | null }> => {
    if (!supabase) {
      return { error: 'Supabase client is not initialized.' };
    }
    try {
      const { error } = await supabase
        .from('agent_documents')
        .update({ verification_status: status })
        .eq('id', documentId);

      if (error) {
        console.error(`Error updating document status for ${documentId}:`, error.message);
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تحديث حالة المستند.';
      console.error('Unexpected error updating document status:', errorMessage);
      return { error: errorMessage };
    }
  },

  /**
   * يحذف مستند وكيل من Supabase Storage ومن قاعدة البيانات.
   * @param documentId معرف المستند.
   * @returns خطأ إذا فشلت العملية.
   */
  deleteAgentDocument: async (documentId: string): Promise<{ error: string | null }> => {
    if (!supabase) {
      return { error: 'Supabase client is not initialized.' };
    }
    try {
      // أولاً، احصل على عنوان URL للمستند لحذفه من التخزين
      const { data: documentData, error: fetchError } = await supabase
        .from('agent_documents')
        .select('document_url')
        .eq('id', documentId)
        .single();

      if (fetchError || !documentData) {
        console.error('Error fetching document data for deletion:', fetchError?.message || 'Document not found.');
        return { error: fetchError?.message || 'Document not found.' };
      }

      const publicUrl = documentData.document_url;
      const bucketName = 'agents-documents';
      // استخراج filePath من publicUrl
      const filePath = publicUrl.split(`${bucketName}/`)[1];

      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);

        if (storageError) {
          console.error(`Error deleting file from Supabase Storage: ${storageError.message}`);
          return { error: `فشل حذف الملف من Supabase Storage: ${storageError.message}` };
        }
        console.log(`Successfully deleted file from storage: ${filePath}`);
      } else {
        console.warn(`Could not extract file path from public URL: ${publicUrl}. Proceeding with database deletion.`);
      }

      // ثم احذف السجل من جدول agent_documents
      const { error: dbError } = await supabase
        .from('agent_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error(`Error deleting document from agent_documents table:`, dbError.message);
        return { error: dbError.message };
      }
      console.log(`Successfully deleted document ${documentId} from database.`);

      return { error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء حذف المستند.';
      console.error('Unexpected error during document deletion (catch block):', errorMessage);
      return { error: errorMessage };
    }
  },

  /**
   * يحدّث مستند وكيل موجود بملف جديد.
   * يقوم بحذف المستند القديم من التخزين وقاعدة البيانات ثم يرفع المستند الجديد.
   * @param documentId معرف المستند الذي سيتم تحديثه.
   * @param agentId معرف الوكيل الذي يملك المستند.
   * @param file الملف الجديد المراد رفعه.
   * @param documentType نوع المستند (مثل national_id_front).
   * @returns عنوان URL العام للملف المرفوع حديثًا أو خطأ.
   */
  updateAgentDocument: async (documentId: string, agentId: string, file: File, documentType: string): Promise<{ publicUrl: string | null; error: string | null }> => {
    if (!supabase) {
      return { publicUrl: null, error: 'Supabase client is not initialized.' };
    }
    try {
      // أولاً، احذف المستند القديم
      const { error: deleteError } = await approvedAgentService.deleteAgentDocument(documentId);
      if (deleteError) {
        console.error(`Failed to delete old document ${documentId} for update:`, deleteError);
        return { publicUrl: null, error: `فشل تحديث المستند: ${deleteError}` };
      }

      // ثم ارفع المستند الجديد
      const { publicUrl, error: uploadError } = await approvedAgentService.uploadAgentDocument(agentId, file, documentType);
      if (uploadError) {
        console.error(`Failed to upload new document for update:`, uploadError);
        return { publicUrl: null, error: `فشل تحديث المستند: ${uploadError}` };
      }

      console.log(`Successfully updated document ${documentId} with new file. New URL: ${publicUrl}`);
      return { publicUrl: publicUrl, error: null };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تحديث المستند.';
      console.error('Unexpected error during document update (catch block):', errorMessage);
      return { publicUrl: null, error: errorMessage };
    }
  },

  /**
   * Updates the status of a join request.
   * @param requestId The ID of the join request to update.
   * @param status The new status ('pending' | 'approved' | 'rejected').
   * @returns An object with success status and any error.
   */
  updateJoinRequestStatus: async (
    requestId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { success: false, error: 'Supabase client is not initialized.' };
    }

    try {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: status })
        .eq('id', requestId);

      if (error) {
        console.error(`Error updating join request ${requestId} status to ${status}:`, error.message);
        return { success: false, error: error.message };
      }

      console.log(`Join request ${requestId} status updated to ${status}.`);
      return { success: true, error: null };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      console.error('Unexpected error updating join request status:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * إعادة تعيين كلمة مرور الوكيل وإنشاء واحدة جديدة
   * @param agentId معرف الوكيل
   * @returns كلمة المرور الجديدة أو خطأ
   */
  resetAgentPassword: async (agentId: string): Promise<{ password: string | null; error: string | null }> => {
    console.log("resetAgentPassword: Resetting password for agentId", agentId);
    if (!supabase) {
      console.error('Supabase client is not initialized.');
      return { password: null, error: 'Supabase client is not initialized.' };
    }

    try {
      // جلب معلومات الوكيل للحصول على البريد الإلكتروني أو رقم الهاتف
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id, email, phone')
        .eq('id', agentId)
        .single();

      if (agentError || !agentData) {
        console.error('Error fetching agent data:', agentError?.message);
        return { password: null, error: 'لم يتم العثور على بيانات الوكيل.' };
      }

      // إنشاء كلمة مرور جديدة عشوائية
      const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '@123';

      // محاولة تحديث كلمة المرور باستخدام Admin API
      // ملاحظة: هذا يتطلب Service Role Key ويجب أن يتم على السيرفر
      // للآن، سنستخدم resetPasswordForEmail لإرسال رابط إعادة التعيين
      // لكن بما أن المستخدم يريد "معرفة" كلمة المرور، سنستخدم طريقة أخرى

      // الحل البديل: استخدام API route على السيرفر
      const response = await fetch('/api/agents/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agentId,
          newPassword: newPassword
        }),
      });

      if (!response.ok) {
        let errorMessage = 'فشل إعادة تعيين كلمة المرور.';
        try {
          // محاولة قراءة الاستجابة كنص أولاً
          const responseText = await response.text();
          console.error('Error resetting password via API (raw):', responseText);
          
          // محاولة تحليل JSON
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // إذا لم يكن JSON، استخدم النص مباشرة
            errorMessage = responseText || `خطأ HTTP: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `خطأ HTTP: ${response.status} ${response.statusText}`;
        }
        return { password: null, error: errorMessage };
      }

      const result = await response.json();
      if (result.success) {
        return { password: newPassword, error: null };
      } else {
        return { password: null, error: result.error || result.message || 'فشل إعادة تعيين كلمة المرور.' };
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
      console.error('Unexpected error resetting agent password:', errorMessage);
      return { password: null, error: errorMessage };
    }
  },
}; 