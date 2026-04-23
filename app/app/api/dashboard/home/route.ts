import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from("larinova_users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    // Use organization_id if available, otherwise fetch data for all accessible consultations
    const organizationId = userData?.organization_id;

    // Fetch priority tasks (pending and in_progress)
    let tasks = [];
    const { data: doctor } = await supabase
      .from("larinova_doctors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    try {
      const { data, error: tasksError } = await supabase
        .from("larinova_tasks")
        .select(
          `
          *,
          patient:larinova_patients!larinova_tasks_patient_id_fkey(
            id,
            full_name,
            patient_code
          ),
          consultation:larinova_consultations!larinova_tasks_consultation_id_fkey(
            id,
            consultation_code
          )
        `,
        )
        .eq("assigned_to", doctor?.id)
        .in("status", ["pending", "in_progress"])
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true })
        .limit(5);

      if (!tasksError) tasks = data || [];
    } catch {
      // Tasks table doesn't exist yet, continue without it
    }

    // Fetch today's consultations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayConsultationsQuery = supabase
      .from("larinova_consultations")
      .select(
        `
        *,
        larinova_patients(
          id,
          full_name,
          patient_code,
          date_of_birth
        )
      `,
      )
      .gte("start_time", today.toISOString())
      .lt("start_time", tomorrow.toISOString())
      .order("start_time", { ascending: true });

    if (organizationId) {
      todayConsultationsQuery = todayConsultationsQuery.eq(
        "organization_id",
        organizationId,
      );
    }

    const { data: todayConsultations, error: consultationsError } =
      await todayConsultationsQuery;

    if (consultationsError) throw consultationsError;

    // Fetch recent documents (from document views)
    // Temporarily disabled until document_views table is created
    let recentDocuments = [];
    try {
      const { data: recentDocumentViews, error: docsError } = await supabase
        .from("larinova_document_views")
        .select("*")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(20);

      if (!docsError && recentDocumentViews) {
        // Fetch full details for each document type
        const documentDetails = await Promise.all(
          recentDocumentViews.map(async (view) => {
            let documentData = null;

            switch (view.document_type) {
              case "consultation": {
                const { data } = await supabase
                  .from("larinova_consultations")
                  .select(
                    `
                    *,
                    larinova_patients(full_name, patient_code)
                  `,
                  )
                  .eq("id", view.document_id)
                  .single();
                documentData = data;
                break;
              }
              case "prescription": {
                const { data } = await supabase
                  .from("larinova_prescriptions")
                  .select(
                    `
                    *,
                    larinova_patients(full_name, patient_code)
                  `,
                  )
                  .eq("id", view.document_id)
                  .single();
                documentData = data;
                break;
              }
              case "health_record":
              case "lab_report": {
                // For now, we'll just return the view data
                // You can extend this when you add health records and lab reports tables
                documentData = {
                  id: view.document_id,
                  type: view.document_type,
                };
                break;
              }
            }

            return {
              ...view,
              documentData,
            };
          }),
        );

        // Filter out null documents and limit to 6
        recentDocuments = documentDetails
          .filter((doc) => doc.documentData)
          .slice(0, 6);
      }
    } catch {
      // Document views table doesn't exist yet, continue without it
    }

    // Fetch recent consultations (last 5)
    let recentConsultationsQuery = supabase
      .from("larinova_consultations")
      .select(
        `
        *,
        larinova_patients(
          id,
          full_name,
          patient_code
        )
      `,
      )
      .order("start_time", { ascending: false })
      .limit(5);

    if (organizationId) {
      recentConsultationsQuery = recentConsultationsQuery.eq(
        "organization_id",
        organizationId,
      );
    }

    const { data: recentConsultations, error: recentError } =
      await recentConsultationsQuery;

    if (recentError) throw recentError;

    return NextResponse.json({
      tasks: tasks || [],
      todayConsultations: todayConsultations || [],
      recentDocuments,
      recentConsultations: recentConsultations || [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
