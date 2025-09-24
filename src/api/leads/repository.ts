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
          id, created_time, full_name, email, phone_number, wedding_type, package, wedding_location, event_dates, "createdAt", "createdBy", "isDelete"
        FROM public.wedding_leads
        WHERE "isDelete" = false
        ORDER BY id ASC
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
}
