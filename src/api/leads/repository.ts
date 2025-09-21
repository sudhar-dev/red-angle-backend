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
}
