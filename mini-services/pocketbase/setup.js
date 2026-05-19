/**
 * PocketBase Collection Setup Script for Infinity Legal ZA
 * Uses PocketBase v0.25.x API format
 */

const PB_URL = "http://127.0.0.1:8090";
const ADMIN_EMAIL = "admin@infinitylegal.co.za";
const ADMIN_PASSWORD = "InfinityAdmin2026!";

async function main() {
  // Step 1: Authenticate as superuser
  const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  
  if (!authRes.ok) {
    console.error("Failed to authenticate:", await authRes.text());
    process.exit(1);
  }
  
  const authData = await authRes.json();
  const token = authData.token;
  console.log("✅ Authenticated as admin");
  
  const headers = {
    "Content-Type": "application/json",
    Authorization: token,
  };

  // Helper to create or update collection
  async function upsertCollection(collection) {
    // Try to create first
    try {
      const res = await fetch(`${PB_URL}/api/collections`, {
        method: "POST",
        headers,
        body: JSON.stringify(collection),
      });
      if (res.ok) {
        console.log(`✅ Created collection: ${collection.name}`);
        return await res.json();
      } else {
        const err = await res.text();
        if (err.includes("already exists")) {
          // Try to update existing
          const getRes = await fetch(`${PB_URL}/api/collections/${collection.name}`, { headers });
          if (getRes.ok) {
            const existing = await getRes.json();
            const updateRes = await fetch(`${PB_URL}/api/collections/${existing.id}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ ...collection, id: existing.id }),
            });
            if (updateRes.ok) {
              console.log(`✅ Updated collection: ${collection.name}`);
              return await updateRes.json();
            } else {
              console.error(`❌ Failed to update ${collection.name}:`, await updateRes.text());
            }
          }
        } else {
          console.error(`❌ Failed to create ${collection.name}:`, err);
        }
      }
    } catch (e) {
      console.error(`❌ Error with ${collection.name}:`, e.message);
    }
    return null;
  }

  // Get users collection ID for relations
  const usersRes = await fetch(`${PB_URL}/api/collections/users`, { headers });
  const usersCol = await usersRes.json();
  const usersCollectionId = usersCol.id;
  console.log(`📋 Users collection ID: ${usersCollectionId}`);

  // Helper to add field with unique id
  function field(overrides) {
    return {
      system: false,
      id: overrides.name + "_" + Math.random().toString(36).substring(2, 8),
      ...overrides,
    };
  }

  // =============================================
  // 1. UPDATE USERS COLLECTION (Auth)
  // =============================================
  const updatedUsersFields = [
    ...usersCol.fields,
    field({ name: "full_name", type: "text", required: false, options: { min: null, max: null, pattern: "" } }),
    field({ name: "phone", type: "text", required: false, options: { min: null, max: null, pattern: "" } }),
    field({ name: "role", type: "select", required: true, options: { maxSelect: 1, values: ["managing_director","senior_partner","associate","paralegal","legal_officer","supervising_officer","senior_consultant","consultant","candidate_attorney","hr_manager","finance_manager","office_administrator","systems_admin","receptionist","client","guest"] } }),
    field({ name: "department", type: "select", required: false, options: { maxSelect: 1, values: ["management","litigation","conveyancing","family_law","corporate","criminal_law","estate_planning","consulting","hr","finance","it","administration"] } }),
    field({ name: "bar_number", type: "text", required: false, options: { min: null, max: null, pattern: "" } }),
    field({ name: "supervisor_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, minSelect: null, maxSelect: 1, displayFields: ["email"] } }),
    field({ name: "hire_date", type: "date", required: false, options: { min: "", max: "" } }),
    field({ name: "is_active", type: "bool", required: false }),
    field({ name: "avatar", type: "file", required: false, options: { maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png","image/jpeg","image/webp"] } }),
    field({ name: "password_expires_at", type: "date", required: false, options: { min: "", max: "" } }),
    field({ name: "last_password_change", type: "date", required: false, options: { min: "", max: "" } }),
  ];

  const updateUsersRes = await fetch(`${PB_URL}/api/collections/${usersCol.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ ...usersCol, fields: updatedUsersFields }),
  });
  if (updateUsersRes.ok) {
    console.log("✅ Updated users collection with custom fields");
  } else {
    console.error("❌ Failed to update users:", await updateUsersRes.text());
  }

  // =============================================
  // 2. PROFILES
  // =============================================
  await upsertCollection({
    name: "profiles",
    type: "base",
    fields: [
      field({ name: "user_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: true, maxSelect: 1 } }),
      field({ name: "email", type: "email", required: true }),
      field({ name: "full_name", type: "text", required: true, options: { min: 2, max: 200 } }),
      field({ name: "phone", type: "text", required: false, options: { pattern: "" } }),
      field({ name: "role", type: "select", required: true, options: { maxSelect: 1, values: ["managing_director","senior_partner","associate","paralegal","legal_officer","supervising_officer","senior_consultant","consultant","candidate_attorney","hr_manager","finance_manager","office_administrator","systems_admin","receptionist","client","guest"] } }),
      field({ name: "department", type: "select", required: false, options: { maxSelect: 1, values: ["management","litigation","conveyancing","family_law","corporate","criminal_law","estate_planning","consulting","hr","finance","it","administration"] } }),
      field({ name: "bar_number", type: "text", required: false, options: {} }),
      field({ name: "supervisor_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "hire_date", type: "date", required: false, options: { min: "", max: "" } }),
      field({ name: "is_active", type: "bool", required: false }),
      field({ name: "avatar", type: "url", required: false }),
    ],
    indexes: [
      "CREATE INDEX idx_profiles_user_id ON profiles (user_id)",
      "CREATE INDEX idx_profiles_role ON profiles (role)",
      "CREATE INDEX idx_profiles_department ON profiles (department)",
      "CREATE INDEX idx_profiles_email ON profiles (email)",
    ],
    listRule: "@request.auth.id != '' && user_id = @request.auth.id",
    viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
    createRule: "",
    updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
    deleteRule: "",
  });

  // =============================================
  // 3. CASES
  // =============================================
  await upsertCollection({
    name: "cases",
    type: "base",
    fields: [
      field({ name: "matter_number", type: "text", required: true, options: { min: 1, max: 50 } }),
      field({ name: "title", type: "text", required: true, options: { min: 3, max: 500 } }),
      field({ name: "description", type: "text", required: false, options: { max: 5000 } }),
      field({ name: "case_type", type: "select", required: true, options: { maxSelect: 1, values: ["family_law","criminal_defence","civil_litigation","conveyancing","estate_planning","corporate_commercial","debt_collection","immigration","labour_law","personal_injury","other"] } }),
      field({ name: "urgency", type: "select", required: true, options: { maxSelect: 1, values: ["low","medium","high","critical"] } }),
      field({ name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["intake","pending_review","active","on_hold","settled","closed","archived"] } }),
      field({ name: "client_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "lead_attorney_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "support_paralegal_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "court_date", type: "date", required: false, options: { min: "", max: "" } }),
      field({ name: "filing_date", type: "date", required: false, options: { min: "", max: "" } }),
      field({ name: "closing_date", type: "date", required: false, options: { min: "", max: "" } }),
      field({ name: "estimated_value", type: "number", required: false, options: { min: 0 } }),
      field({ name: "ai_analysis", type: "json", required: false }),
      field({ name: "is_high_risk", type: "bool", required: false }),
      field({ name: "next_action", type: "text", required: false, options: { max: 500 } }),
      field({ name: "next_action_date", type: "date", required: false, options: { min: "", max: "" } }),
    ],
    indexes: [
      "CREATE INDEX idx_cases_status ON cases (status)",
      "CREATE INDEX idx_cases_case_type ON cases (case_type)",
      "CREATE INDEX idx_cases_client_id ON cases (client_id)",
      "CREATE INDEX idx_cases_lead_attorney ON cases (lead_attorney_id)",
      "CREATE INDEX idx_cases_matter_number ON cases (matter_number)",
      "CREATE INDEX idx_cases_urgency ON cases (urgency)",
      "CREATE INDEX idx_cases_created ON cases (created)",
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    updateRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    deleteRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
  });

  // Get cases collection ID for leads relation
  const casesRes = await fetch(`${PB_URL}/api/collections/cases`, { headers });
  let casesCollectionId = "";
  if (casesRes.ok) {
    const casesCol = await casesRes.json();
    casesCollectionId = casesCol.id;
  }

  // =============================================
  // 4. LEADS
  // =============================================
  await upsertCollection({
    name: "leads",
    type: "base",
    fields: [
      field({ name: "name", type: "text", required: true, options: { min: 2, max: 200 } }),
      field({ name: "email", type: "email", required: true }),
      field({ name: "phone", type: "text", required: false, options: {} }),
      field({ name: "source", type: "select", required: true, options: { maxSelect: 1, values: ["website","referral","walk_in","social_media","advertisement","cold_call","other"] } }),
      field({ name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["new","contacted","qualified","consultation_scheduled","retained","lost","disqualified"] } }),
      field({ name: "case_type", type: "select", required: false, options: { maxSelect: 1, values: ["family_law","criminal_defence","civil_litigation","conveyancing","estate_planning","corporate_commercial","debt_collection","immigration","labour_law","personal_injury","other"] } }),
      field({ name: "description", type: "text", required: false, options: { max: 3000 } }),
      field({ name: "assigned_paralegal_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "assigned_officer_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "lead_score", type: "number", required: false, options: { min: 0, max: 100 } }),
      field({ name: "qualification_notes", type: "text", required: false, options: {} }),
      field({ name: "estimated_value", type: "number", required: false, options: { min: 0 } }),
      field({ name: "first_contact_date", type: "date", required: false, options: { min: "", max: "" } }),
      field({ name: "sla_deadline", type: "date", required: false, options: { min: "", max: "" } }),
      field({ name: "converted_case_id", type: "relation", required: false, options: { collectionId: casesCollectionId, cascadeDelete: false, maxSelect: 1 } }),
    ],
    indexes: [
      "CREATE INDEX idx_leads_status ON leads (status)",
      "CREATE INDEX idx_leads_source ON leads (source)",
      "CREATE INDEX idx_leads_email ON leads (email)",
      "CREATE INDEX idx_leads_assigned ON leads (assigned_paralegal_id)",
      "CREATE INDEX idx_leads_sla ON leads (sla_deadline)",
    ],
    listRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    viewRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    deleteRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
  });

  // Get leads collection ID for intake relation
  const leadsRes = await fetch(`${PB_URL}/api/collections/leads`, { headers });
  let leadsCollectionId = "";
  if (leadsRes.ok) {
    const leadsCol = await leadsRes.json();
    leadsCollectionId = leadsCol.id;
  }

  // =============================================
  // 5. DOCUMENTS
  // =============================================
  await upsertCollection({
    name: "documents",
    type: "base",
    fields: [
      field({ name: "title", type: "text", required: true, options: { min: 3, max: 500 } }),
      field({ name: "case_id", type: "relation", required: true, options: { collectionId: casesCollectionId, cascadeDelete: true, maxSelect: 1 } }),
      field({ name: "document_type", type: "select", required: true, options: { maxSelect: 1, values: ["contract","pleading","correspondence","court_filing","affidavit","opinion","memo","invoice","consent_form","id_document","other"] } }),
      field({ name: "workflow_status", type: "select", required: true, options: { maxSelect: 1, values: ["draft","review","approved","signed","filed","archived"] } }),
      field({ name: "version", type: "number", required: false, options: { min: 1 } }),
      field({ name: "file_url", type: "url", required: false }),
      field({ name: "file", type: "file", required: false, options: { maxSelect: 1, maxSize: 52428800, mimeTypes: ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","image/png","image/jpeg","text/plain"] } }),
      field({ name: "prepared_by", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "approved_by", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "signed_by", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "supervising_officer", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "is_locked", type: "bool", required: false }),
      field({ name: "locked_by", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
      field({ name: "description", type: "text", required: false, options: { max: 3000 } }),
    ],
    indexes: [
      "CREATE INDEX idx_documents_case ON documents (case_id)",
      "CREATE INDEX idx_documents_type ON documents (document_type)",
      "CREATE INDEX idx_documents_workflow ON documents (workflow_status)",
      "CREATE INDEX idx_documents_prepared ON documents (prepared_by)",
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    updateRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
    deleteRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
  });

  // =============================================
  // 6-18: Remaining collections (simplified)
  // =============================================
  const collections = [
    {
      name: "intake_submissions",
      type: "base",
      fields: [
        field({ name: "reference_id", type: "text", required: true, options: {} }),
        field({ name: "full_name", type: "text", required: true, options: { min: 2, max: 200 } }),
        field({ name: "email", type: "email", required: true }),
        field({ name: "phone", type: "text", required: false, options: {} }),
        field({ name: "id_number", type: "text", required: false, options: {} }),
        field({ name: "case_type", type: "select", required: true, options: { maxSelect: 1, values: ["family_law","criminal_defence","civil_litigation","conveyancing","estate_planning","corporate_commercial","debt_collection","immigration","labour_law","personal_injury","other"] } }),
        field({ name: "description", type: "text", required: true, options: { min: 10, max: 5000 } }),
        field({ name: "opposing_party", type: "text", required: false, options: {} }),
        field({ name: "urgency", type: "select", required: false, options: { maxSelect: 1, values: ["low","medium","high","critical"] } }),
        field({ name: "has_documents", type: "bool", required: false }),
        field({ name: "consent_given", type: "bool", required: true }),
        field({ name: "popia_consent", type: "bool", required: true }),
        field({ name: "ai_analysis", type: "json", required: false }),
        field({ name: "converted_case_id", type: "relation", required: false, options: { collectionId: casesCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "status", type: "select", required: false, options: { maxSelect: 1, values: ["submitted","under_review","converted","rejected"] } }),
      ],
      indexes: [
        "CREATE INDEX idx_intake_email ON intake_submissions (email)",
        "CREATE INDEX idx_intake_status ON intake_submissions (status)",
        "CREATE INDEX idx_intake_case_type ON intake_submissions (case_type)",
        "CREATE INDEX idx_intake_reference ON intake_submissions (reference_id)",
      ],
      listRule: "",
      viewRule: "",
      createRule: "@request.body.consent_given = true && @request.body.popia_consent = true",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "tasks",
      type: "base",
      fields: [
        field({ name: "title", type: "text", required: true, options: { min: 3, max: 300 } }),
        field({ name: "description", type: "text", required: false, options: { max: 3000 } }),
        field({ name: "case_id", type: "relation", required: false, options: { collectionId: casesCollectionId, cascadeDelete: true, maxSelect: 1 } }),
        field({ name: "assigned_to", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "created_by", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "priority", type: "select", required: true, options: { maxSelect: 1, values: ["low","medium","high","urgent"] } }),
        field({ name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["pending","in_progress","completed","overdue","cancelled"] } }),
        field({ name: "due_date", type: "date", required: false, options: { min: "", max: "" } }),
        field({ name: "completed_date", type: "date", required: false, options: { min: "", max: "" } }),
      ],
      indexes: [
        "CREATE INDEX idx_tasks_status ON tasks (status)",
        "CREATE INDEX idx_tasks_assigned ON tasks (assigned_to)",
        "CREATE INDEX idx_tasks_case ON tasks (case_id)",
        "CREATE INDEX idx_tasks_due ON tasks (due_date)",
        "CREATE INDEX idx_tasks_priority ON tasks (priority)",
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id = assigned_to || @request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    },
    {
      name: "messages",
      type: "base",
      fields: [
        field({ name: "case_id", type: "relation", required: true, options: { collectionId: casesCollectionId, cascadeDelete: true, maxSelect: 1 } }),
        field({ name: "sender_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "recipient_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "content", type: "text", required: true, options: { min: 1, max: 10000 } }),
        field({ name: "is_read", type: "bool", required: false }),
        field({ name: "message_type", type: "select", required: false, options: { maxSelect: 1, values: ["message","note","system","alert"] } }),
      ],
      indexes: [
        "CREATE INDEX idx_messages_case ON messages (case_id)",
        "CREATE INDEX idx_messages_sender ON messages (sender_id)",
        "CREATE INDEX idx_messages_recipient ON messages (recipient_id)",
        "CREATE INDEX idx_messages_read ON messages (is_read)",
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id = sender_id",
      deleteRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    },
    {
      name: "audit_logs",
      type: "base",
      fields: [
        field({ name: "user_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "action", type: "text", required: true, options: {} }),
        field({ name: "resource_type", type: "text", required: true, options: {} }),
        field({ name: "resource_id", type: "text", required: false, options: {} }),
        field({ name: "details", type: "json", required: false }),
        field({ name: "ip_address", type: "text", required: false, options: {} }),
        field({ name: "user_agent", type: "text", required: false, options: {} }),
      ],
      indexes: [
        "CREATE INDEX idx_audit_user ON audit_logs (user_id)",
        "CREATE INDEX idx_audit_action ON audit_logs (action)",
        "CREATE INDEX idx_audit_resource ON audit_logs (resource_type, resource_id)",
        "CREATE INDEX idx_audit_created ON audit_logs (created)",
      ],
      listRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
      viewRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "consent_logs",
      type: "base",
      fields: [
        field({ name: "user_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: true, maxSelect: 1 } }),
        field({ name: "consent_type", type: "select", required: true, options: { maxSelect: 1, values: ["data_processing","marketing","third_party_sharing","automated_decision","popia_general"] } }),
        field({ name: "purpose", type: "text", required: true, options: {} }),
        field({ name: "granted", type: "bool", required: true }),
        field({ name: "ip_address", type: "text", required: false, options: {} }),
        field({ name: "user_agent", type: "text", required: false, options: {} }),
      ],
      indexes: [
        "CREATE INDEX idx_consent_user ON consent_logs (user_id)",
        "CREATE INDEX idx_consent_type ON consent_logs (consent_type)",
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' || @request.body.consent_type != ''",
      updateRule: "",
      deleteRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    },
    {
      name: "notifications",
      type: "base",
      fields: [
        field({ name: "user_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: true, maxSelect: 1 } }),
        field({ name: "type", type: "select", required: true, options: { maxSelect: 1, values: ["case_update","task_assigned","document_review","message","system","deadline","lead_assigned","consultation"] } }),
        field({ name: "title", type: "text", required: true, options: { max: 300 } }),
        field({ name: "message", type: "text", required: true, options: { max: 1000 } }),
        field({ name: "is_read", type: "bool", required: false }),
        field({ name: "link", type: "url", required: false }),
        field({ name: "related_id", type: "text", required: false, options: {} }),
      ],
      indexes: [
        "CREATE INDEX idx_notifications_user ON notifications (user_id)",
        "CREATE INDEX idx_notifications_read ON notifications (is_read)",
        "CREATE INDEX idx_notifications_type ON notifications (type)",
      ],
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
    },
    {
      name: "consultations",
      type: "base",
      fields: [
        field({ name: "client_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "attorney_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "case_id", type: "relation", required: false, options: { collectionId: casesCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "scheduled_date", type: "date", required: true, options: { min: "", max: "" } }),
        field({ name: "scheduled_time", type: "text", required: true, options: {} }),
        field({ name: "duration_minutes", type: "number", required: false, options: { min: 15, max: 480 } }),
        field({ name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["scheduled","confirmed","completed","cancelled","no_show"] } }),
        field({ name: "notes", type: "text", required: false, options: { max: 2000 } }),
        field({ name: "meeting_type", type: "select", required: false, options: { maxSelect: 1, values: ["in_person","video_call","phone_call"] } }),
      ],
      indexes: [
        "CREATE INDEX idx_consultations_client ON consultations (client_id)",
        "CREATE INDEX idx_consultations_attorney ON consultations (attorney_id)",
        "CREATE INDEX idx_consultations_date ON consultations (scheduled_date)",
        "CREATE INDEX idx_consultations_status ON consultations (status)",
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    },
    {
      name: "pricing_plans",
      type: "base",
      fields: [
        field({ name: "name", type: "text", required: true, options: {} }),
        field({ name: "slug", type: "text", required: true, options: {} }),
        field({ name: "price_monthly", type: "number", required: true, options: { min: 0 } }),
        field({ name: "price_annual", type: "number", required: false, options: { min: 0 } }),
        field({ name: "currency", type: "text", required: false, options: { max: 3 } }),
        field({ name: "features", type: "json", required: true }),
        field({ name: "max_cases", type: "number", required: false, options: {} }),
        field({ name: "max_documents", type: "number", required: false, options: {} }),
        field({ name: "is_active", type: "bool", required: false }),
        field({ name: "sort_order", type: "number", required: false, options: {} }),
      ],
      indexes: [
        "CREATE INDEX idx_plans_slug ON pricing_plans (slug)",
        "CREATE INDEX idx_plans_active ON pricing_plans (is_active)",
      ],
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "user_subscriptions",
      type: "base",
      fields: [
        field({ name: "user_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: true, maxSelect: 1 } }),
        field({ name: "plan_id", type: "relation", required: true, options: { collectionId: "pricing_plans", cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["active","past_due","cancelled","expired","trialing"] } }),
        field({ name: "current_period_start", type: "date", required: false, options: { min: "", max: "" } }),
        field({ name: "current_period_end", type: "date", required: false, options: { min: "", max: "" } }),
        field({ name: "cancel_at_period_end", type: "bool", required: false }),
      ],
      indexes: [
        "CREATE INDEX idx_sub_user ON user_subscriptions (user_id)",
        "CREATE INDEX idx_sub_status ON user_subscriptions (status)",
      ],
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "case_timeline",
      type: "base",
      fields: [
        field({ name: "case_id", type: "relation", required: true, options: { collectionId: casesCollectionId, cascadeDelete: true, maxSelect: 1 } }),
        field({ name: "user_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "action", type: "text", required: true, options: {} }),
        field({ name: "description", type: "text", required: false, options: { max: 2000 } }),
        field({ name: "previous_value", type: "text", required: false, options: {} }),
        field({ name: "new_value", type: "text", required: false, options: {} }),
      ],
      indexes: [
        "CREATE INDEX idx_timeline_case ON case_timeline (case_id)",
        "CREATE INDEX idx_timeline_created ON case_timeline (created)",
      ],
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "privileged_notes",
      type: "base",
      fields: [
        field({ name: "case_id", type: "relation", required: true, options: { collectionId: casesCollectionId, cascadeDelete: true, maxSelect: 1 } }),
        field({ name: "author_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "content", type: "text", required: true, options: { min: 1, max: 10000 } }),
        field({ name: "visibility", type: "select", required: true, options: { maxSelect: 1, values: ["officer_only","managing_partner_only","attorney_client"] } }),
      ],
      indexes: [
        "CREATE INDEX idx_privnotes_case ON privileged_notes (case_id)",
        "CREATE INDEX idx_privnotes_author ON privileged_notes (author_id)",
      ],
      listRule: "@request.auth.id != '' && (@request.auth.role = 'legal_officer' || @request.auth.role = 'supervising_officer' || @request.auth.role = 'managing_director' || @request.auth.role = 'senior_partner')",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != '' && @request.auth.role != 'client' && @request.auth.role != 'guest'",
      updateRule: "@request.auth.id = author_id",
      deleteRule: "@request.auth.id = author_id || @request.auth.role = 'managing_director'",
    },
    {
      name: "api_analytics",
      type: "base",
      fields: [
        field({ name: "endpoint", type: "text", required: true, options: {} }),
        field({ name: "method", type: "text", required: true, options: {} }),
        field({ name: "status_code", type: "number", required: true, options: {} }),
        field({ name: "response_time_ms", type: "number", required: false, options: {} }),
        field({ name: "user_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "ip_address", type: "text", required: false, options: {} }),
        field({ name: "user_agent", type: "text", required: false, options: {} }),
      ],
      indexes: [
        "CREATE INDEX idx_analytics_endpoint ON api_analytics (endpoint)",
        "CREATE INDEX idx_analytics_status ON api_analytics (status_code)",
        "CREATE INDEX idx_analytics_created ON api_analytics (created)",
        "CREATE INDEX idx_analytics_user ON api_analytics (user_id)",
      ],
      listRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
      viewRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "error_logs",
      type: "base",
      fields: [
        field({ name: "error_type", type: "select", required: true, options: { maxSelect: 1, values: ["runtime","api","database","auth","validation","network","unknown"] } }),
        field({ name: "message", type: "text", required: true, options: {} }),
        field({ name: "stack_trace", type: "text", required: false, options: {} }),
        field({ name: "url", type: "url", required: false }),
        field({ name: "user_id", type: "relation", required: false, options: { collectionId: usersCollectionId, cascadeDelete: false, maxSelect: 1 } }),
        field({ name: "metadata", type: "json", required: false }),
        field({ name: "resolved", type: "bool", required: false }),
      ],
      indexes: [
        "CREATE INDEX idx_errors_type ON error_logs (error_type)",
        "CREATE INDEX idx_errors_resolved ON error_logs (resolved)",
        "CREATE INDEX idx_errors_created ON error_logs (created)",
      ],
      listRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
      viewRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    },
    {
      name: "attorneys",
      type: "base",
      fields: [
        field({ name: "user_id", type: "relation", required: true, options: { collectionId: usersCollectionId, cascadeDelete: true, maxSelect: 1 } }),
        field({ name: "lpc_number", type: "text", required: false, options: {} }),
        field({ name: "firm_name", type: "text", required: false, options: {} }),
        field({ name: "specializations", type: "select", required: false, options: { maxSelect: 5, values: ["family_law","criminal_defence","civil_litigation","conveyancing","estate_planning","corporate_commercial","debt_collection","immigration","labour_law","personal_injury"] } }),
        field({ name: "years_experience", type: "number", required: false, options: { min: 0, max: 60 } }),
        field({ name: "is_verified", type: "bool", required: false }),
        field({ name: "hourly_rate", type: "number", required: false, options: { min: 0 } }),
        field({ name: "bio", type: "text", required: false, options: { max: 2000 } }),
        field({ name: "availability_status", type: "select", required: false, options: { maxSelect: 1, values: ["available","busy","on_leave","unavailable"] } }),
      ],
      indexes: [
        "CREATE INDEX idx_attorneys_user ON attorneys (user_id)",
        "CREATE INDEX idx_attorneys_lpc ON attorneys (lpc_number)",
        "CREATE INDEX idx_attorneys_verified ON attorneys (is_verified)",
      ],
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "@request.auth.id = user_id || @request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
      deleteRule: "@request.auth.role = 'managing_director' || @request.auth.role = 'systems_admin'",
    },
  ];

  for (const col of collections) {
    await upsertCollection(col);
  }

  // =============================================
  // SEED: Pricing Plans
  // =============================================
  console.log("\n📦 Seeding pricing plans...");
  const plans = [
    { name: "Free", slug: "free", price_monthly: 0, price_annual: 0, currency: "ZAR", features: ["1 Active Case", "Basic Document Upload", "Email Support", "POPIA Compliant"], max_cases: 1, max_documents: 5, is_active: true, sort_order: 1 },
    { name: "Starter", slug: "starter", price_monthly: 499, price_annual: 4990, currency: "ZAR", features: ["5 Active Cases", "50 Documents", "AI Case Analysis", "Priority Email Support", "Consultation Booking"], max_cases: 5, max_documents: 50, is_active: true, sort_order: 2 },
    { name: "Family", slug: "family", price_monthly: 999, price_annual: 9990, currency: "ZAR", features: ["15 Active Cases", "200 Documents", "AI Case Analysis", "Priority Support", "Consultation Booking", "Family Law Specialist Access", "Document Workflow"], max_cases: 15, max_documents: 200, is_active: true, sort_order: 3 },
    { name: "Premium", slug: "premium", price_monthly: 2499, price_annual: 24990, currency: "ZAR", features: ["Unlimited Cases", "Unlimited Documents", "Advanced AI Analysis", "24/7 Priority Support", "Dedicated Attorney", "Full Document Workflow", "Lead Pipeline", "Custom Reporting"], max_cases: -1, max_documents: -1, is_active: true, sort_order: 4 },
  ];

  for (const plan of plans) {
    try {
      const res = await fetch(`${PB_URL}/api/collections/pricing_plans/records`, {
        method: "POST",
        headers,
        body: JSON.stringify(plan),
      });
      if (res.ok) {
        console.log(`✅ Seeded plan: ${plan.name}`);
      } else {
        console.error(`❌ Failed to seed plan ${plan.name}:`, await res.text());
      }
    } catch (e) {
      console.error(`❌ Error seeding ${plan.name}:`, e.message);
    }
  }

  console.log("\n🎉 PocketBase setup complete!");
}

main().catch(console.error);
