import { PoolClient } from "pg";
import { getClient } from "../../helper/db";
import logger from "../../helper/logger";

export class leadsRepository {
  public async updateLeadsRepoV1(leadsData: any[]) {
    const client: PoolClient = await getClient();

    try {
      for (const lead of leadsData) {
        const eventDates = Array.isArray(lead.enter_event_date_month)
          ? lead.enter_event_date_month
          : [lead.enter_event_date_month];

        await client.query(
          `
          INSERT INTO public.wedding_leads
            (created_time, full_name, email, phone_number, wedding_type, package, wedding_location, event_dates, "createdAt", "createdBy", "isDelete")
          VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),'system',false)
        `,
          [
            lead.created_time,
            lead.full_name,
            lead.E_mail,
            lead.Phone_number?.toString() || "",
            lead.what_type_of_your_wedding,
            lead.choose_your_package,
            lead.enter_your_wedding_location,
            JSON.stringify(eventDates),
          ]
        );
      }

      return { success: true, message: "Leads uploaded successfully" };
    } catch (error) {
      logger.error("Repository Error: Upload Leads", error);
      return { success: false, message: "Error uploading leads" };
    } finally {
      client.release();
    }
  }

  public async getLeadsRepoV1() {
    const client: PoolClient = await getClient();

    try {
      const res = await client.query(`
      SELECT 
        wl.id, wl.created_time, wl.full_name, wl.email, wl.phone_number, wl.wedding_type, wl.package, wl.wedding_location, wl.event_dates, wl."createdAt", wl."createdBy", wl."isDelete"
      FROM public.wedding_leads wl
      LEFT JOIN public.lead_assignments la
        ON wl.id = la.lead_id
      WHERE wl."isDelete" = false
        AND la.id IS NULL  -- unassigned leads only
      ORDER BY wl.id ASC;
    `);

      return res.rows;
    } catch (error) {
      logger.error("Repository Error: Get Leads", error);
      return [];
    } finally {
      client.release();
    }
  }

  public async addNewLead(formData: any) {
    const client: PoolClient = await getClient();

    try {
      await client.query("BEGIN");

      // 1️⃣ Insert into wedding_leads
      const fullName = `${formData.firstName} ${formData.lastName}`;
      const resLead = await client.query(
        `
        INSERT INTO public.wedding_leads
          (created_time, full_name, email, phone_number, wedding_type, package, wedding_location, event_dates, "createdAt", "createdBy", "isDelete")
        VALUES
          (NOW(), $1, $2, $3, $4, $5, $6, $7, NOW(), 'system', false)
        RETURNING id
        `,
        [
          fullName,
          formData.email,
          formData.mobile,
          formData.eventType,
          "", // package (optional)
          "", // wedding_location (optional)
          JSON.stringify([formData.eventDate]),
        ]
      );

      const leadId = resLead.rows[0].id;

      // 2️⃣ Insert into leads_additional_details
      await client.query(
        `
        INSERT INTO public.leads_additional_details
          (lead_id, secondary_mobile, door_no, street, city, district, state, country, event_type, lead_source, budget, event_date, advance, payment_date, notes, created_at, created_by, is_delete)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),'system',false)
        `,
        [
          leadId,
          formData.secondaryMobile,
          formData.doorNo,
          formData.street,
          formData.city,
          formData.district,
          formData.state,
          formData.country,
          formData.eventType,
          formData.leadSource,
          formData.budget || null,
          formData.eventDate || null,
          formData.advance || null,
          formData.paymentDate || null,
          formData.notes || null,
        ]
      );

      await client.query("COMMIT");

      return { success: true, message: "Lead added successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Repository Error: Add New Lead", error);
      return { success: false, message: "Error adding lead" };
    } finally {
      client.release();
    }
  }

  // ASSIGN LEADS
  public async assignLeads(
    leadIds: number[],
    employeeIds: number[],
    assignedBy: string = "system"
  ) {
    const client: PoolClient = await getClient();

    try {
      await client.query("BEGIN");

      for (const leadId of leadIds) {
        for (const employeeId of employeeIds) {
          await client.query(
            `
            INSERT INTO public.lead_assignments
              (lead_id, employee_id, assigned_by)
            VALUES ($1, $2, $3)
            ON CONFLICT (lead_id, employee_id) DO NOTHING
            `,
            [leadId, employeeId, assignedBy]
          );
        }
      }

      await client.query("COMMIT");
      return { success: true, message: "Leads assigned successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Repository Error: Assign Leads", error);
      return { success: false, message: "Error assigning leads" };
    } finally {
      client.release();
    }
  }

  public async getAssignments() {
    const client: PoolClient = await getClient();
    try {
      const res = await client.query(`
        SELECT la.id, la.lead_id, la.employee_id, la.assigned_at, la.assigned_by,
               wl.full_name AS lead_name,
               e."firstName" AS employee_first, e."lastName" AS employee_last
        FROM public.lead_assignments la
        LEFT JOIN public.wedding_leads wl ON la.lead_id = wl.id
        LEFT JOIN public.employees e ON la.employee_id = e.id
        ORDER BY la.assigned_at DESC
      `);
      return res.rows;
    } catch (error) {
      logger.error("Repository Error: Get Assignments", error);
      return [];
    } finally {
      client.release();
    }
  }

  public async getAssignedLeads() {
    const client: PoolClient = await getClient();

    try {
      const res = await client.query(`
      SELECT 
        wl.id, wl.full_name, wl.email, wl.phone_number, wl.wedding_type, wl.package, wl.wedding_location, wl.event_dates,
        la.employee_id, la.assigned_at, la.assigned_by
      FROM public.wedding_leads wl
      INNER JOIN public.lead_assignments la
        ON wl.id = la.lead_id
      WHERE wl."isDelete" = false
        AND NOT EXISTS (
          SELECT 1 FROM public.events e
          WHERE e.lead_id = wl.id
        )
      ORDER BY la.assigned_at DESC;
    `);

      return res.rows;
    } catch (error) {
      logger.error("Repository Error: Get Assigned Leads", error);
      return [];
    } finally {
      client.release();
    }
  }

  public async bookEventRepo(payload: any) {
    const client: PoolClient = await getClient();

    try {
      await client.query("BEGIN");

      const { leadId, eventDetails, paymentDetails } = payload;

      // 1️⃣ Insert into events
      const resEvent = await client.query(
        `
      INSERT INTO public.events
        (lead_id, event_name, date_time, highlights, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
      `,
        [
          leadId,
          eventDetails.eventName,
          eventDetails.dateTime,
          eventDetails.highlights,
          eventDetails.notes,
        ]
      );

      const eventId = resEvent.rows[0].id;

      // 2️⃣ Insert into payments
      await client.query(
        `
      INSERT INTO public.payments
        (event_id, payment_type, amount, payment_date, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      `,
        [
          eventId,
          paymentDetails.paymentType,
          paymentDetails.amount,
          paymentDetails.date,
          paymentDetails.notes,
        ]
      );

      await client.query("COMMIT");

      return { success: true, message: "Event & Payment stored successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Repository Error: Book Event", error);
      return { success: false, message: "Error saving event & payment" };
    } finally {
      client.release();
    }
  }

  public async getBookedEventsRepo() {
    const client: PoolClient = await getClient();

    try {
      const res = await client.query(`
      SELECT 
        wl.id AS lead_id,
        wl.full_name,
        wl.email,
        wl.phone_number,
        wl.wedding_type,
        wl.package,
        wl.wedding_location,
        wl.event_dates,
        
        e.id AS event_id,
        e.event_name,
        e.date_time,
        e.highlights,
        e.notes AS event_notes,
        e.created_at AS event_created_at,
        
        p.id AS payment_id,
        p.payment_type,
        p.amount,
        p.payment_date,
        p.notes AS payment_notes,
        p.created_at AS payment_created_at
        
      FROM public.wedding_leads wl
      INNER JOIN public.events e
        ON wl.id = e.lead_id
      LEFT JOIN public.payments p
        ON e.id = p.event_id
      WHERE wl."isDelete" = false
      ORDER BY e.created_at DESC;
    `);

      return res.rows;
    } catch (error) {
      logger.error("Repository Error: Get Booked Events", error);
      return [];
    } finally {
      client.release();
    }
  }
}
