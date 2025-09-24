import { PoolClient } from "pg";
import { getClient } from "../../helper/db";
import logger from "../../helper/logger";
import { sendEmail } from "../../helper/mail";

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
        AND NOT EXISTS (
          SELECT 1
          FROM public.quotation_packages qp
          WHERE qp.event_id = e.id
        )
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

  public async addQuotationPackagesRepo({ leadId, eventId, packages }: any) {
    const client: PoolClient = await getClient();
    try {
      await client.query("BEGIN");

      for (const pkg of packages) {
        await client.query(
          `
        INSERT INTO public.quotation_packages
          (lead_id, event_id, service_name, description, quantity, price, created_at, created_by)
        VALUES
          ($1, $2, $3, $4, $5, $6, NOW(), 'system')
        `,
          [
            leadId,
            eventId,
            pkg.serviceName,
            pkg.description,
            pkg.quantity,
            pkg.price,
          ]
        );
      }

      await client.query("COMMIT");
      return {
        success: true,
        message: "Quotation packages saved successfully",
      };
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Repository Error: Add Quotation Packages", error);
      return { success: false, message: "Error saving quotation packages" };
    } finally {
      client.release();
    }
  }

  public async getQuotationCreatedLeadsRepo() {
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
        p.amount AS payment_amount,
        p.payment_date,
        p.notes AS payment_notes,
        p.created_at AS payment_created_at,
        
        -- Aggregate all quotation packages into an array of json objects
        json_agg(
          json_build_object(
            'quotation_package_id', qp.id,
            'service_name', qp.service_name,
            'description', qp.description,
            'quantity', qp.quantity,
            'price', qp.price,
            'created_at', qp.created_at
          )
        ) AS packages,
        
        -- Sum of all package prices
        SUM(qp.price::numeric) AS total_package_amount

      FROM public.wedding_leads wl
      INNER JOIN public.events e
        ON wl.id = e.lead_id
      LEFT JOIN public.payments p
        ON e.id = p.event_id
      INNER JOIN public.quotation_packages qp
        ON e.id = qp.event_id
      WHERE wl."isDelete" = false
      GROUP BY 
        wl.id, wl.full_name, wl.email, wl.phone_number, wl.wedding_type, wl.package, wl.wedding_location, wl.event_dates,
        e.id, e.event_name, e.date_time, e.highlights, e.notes, e.created_at,
        p.id, p.payment_type, p.amount, p.payment_date, p.notes, p.created_at
      ORDER BY e.created_at DESC;
    `);

      return res.rows;
    } catch (error) {
      logger.error("Repository Error: Get Quotation Created Leads", error);
      return [];
    } finally {
      client.release();
    }
  }

  public async sendQuotationForApprovalRepo(lead_id: number, event_id: number) {
    const client: PoolClient = await getClient();
    try {
      const status = "Pending Approval";
      const res = await client.query(
        `INSERT INTO quotation_approvals (lead_id, event_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (lead_id, event_id)
       DO UPDATE SET status = EXCLUDED.status;`,
        [lead_id, event_id, status]
      );
      return res.rows[0];
    } catch (error) {
      logger.error("Repository Error: Send Quotation For Approval", error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get approval status for leads
  public async getQuotationApprovalStatusRepo() {
    const client: PoolClient = await getClient();
    try {
      const res = await client.query(`
            SELECT lead_id, event_id, status
            FROM quotation_approvals
        `);
      return res.rows;
    } catch (error) {
      logger.error("Repository Error: Get Quotation Approval Status", error);
      return [];
    } finally {
      client.release();
    }
  }

  // repository/quotationApprovalRepository.t
  // Get all quotations with approval status
  public async getAllQuotationsWithApproval() {
    const client: PoolClient = await getClient();
    try {
      const res = await client.query(`
        SELECT 
          l.id AS lead_id,
          l.full_name,
          l.email,
          l.phone_number,
          l.wedding_type,
          l.package AS package_name,
          l.wedding_location,
          e.id AS event_id,
          e.event_name,
          e.date_time AS event_date,
          p.amount AS payment_amount,
          COALESCE(qa.status, 'Not Sent') AS approval_status,
          json_agg(
            json_build_object(
              'quotation_id', q.id,
              'service_name', q.service_name,
              'description', q.description,
              'quantity', q.quantity,
              'price', q.price,
              'total_amount', q.price * q.quantity
            )
          ) AS packages,
          SUM(q.price * q.quantity) AS total_package_amount
        FROM public.quotation_packages q
        JOIN public.wedding_leads l ON q.lead_id = l.id
        JOIN public.events e ON q.event_id = e.id
        LEFT JOIN public.quotation_approvals qa 
          ON q.lead_id = qa.lead_id AND q.event_id = qa.event_id
        LEFT JOIN public.payments p 
          ON q.lead_id = p.id AND q.event_id = p.event_id
        GROUP BY l.id, l.full_name, l.email, l.phone_number, l.wedding_type, l.package, l.wedding_location,
                 e.id, e.event_name, e.date_time, p.amount, qa.status
        ORDER BY e.date_time DESC;
      `);
      return res.rows;
    } catch (error) {
      logger.error("Repository Error: Fetch Quotations for Approval", error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async getQuotationByLeadId(lead_id: number) {
    const client: PoolClient = await getClient();
    try {
      const res = await client.query(
        `
        SELECT 
          l.full_name,
          l.email,
          l.phone_number,
          l.wedding_type,
          l.wedding_location,
          e.event_name,
          e.date_time AS event_date,
          json_agg(
            json_build_object(
              'service_name', q.service_name,
              'description', q.description,
              'quantity', q.quantity,
              'price', q.price,
              'total_amount', q.price * q.quantity
            )
          ) AS packages,
          SUM(q.price * q.quantity) AS total_package_amount
        FROM public.quotation_packages q
        JOIN public.wedding_leads l ON q.lead_id = l.id
        JOIN public.events e ON q.event_id = e.id
        WHERE l.id = $1
        GROUP BY l.full_name, l.email, l.phone_number, l.wedding_type, l.wedding_location, e.event_name, e.date_time;
      `,
        [lead_id]
      );

      return res.rows[0];
    } catch (error) {
      logger.error("Repository Error: Get Quotation By Lead", error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async sendQuotationToClient(lead_id: number): Promise<boolean> {
    try {
      const quotation = await this.getQuotationByLeadId(lead_id);

      if (!quotation) throw new Error("Quotation not found");

      const {
        full_name,
        email,
        wedding_type,
        wedding_location,
        event_name,
        event_date,
        packages,
        total_package_amount,
      } = quotation;

      // Build the HTML email
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #d32f2f;">Red Angle Studio</h2>
          <p>Dear <strong>${full_name}</strong>,</p>
          <p>Greetings from <strong>Red Angle Studio</strong>! Please find below the quotation for your upcoming <strong>${wedding_type}</strong> event.</p>

          <h3>Event Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td><strong>Event Name:</strong></td>
              <td>${event_name}</td>
            </tr>
            <tr>
              <td><strong>Event Date:</strong></td>
              <td>${new Date(event_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td><strong>Location:</strong></td>
              <td>${wedding_location}</td>
            </tr>
          </table>

          <h3>Packages</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 8px; border: 1px solid #ccc;">Service</th>
                <th style="padding: 8px; border: 1px solid #ccc;">Description</th>
                <th style="padding: 8px; border: 1px solid #ccc;">Quantity</th>
                <th style="padding: 8px; border: 1px solid #ccc;">Price</th>
                <th style="padding: 8px; border: 1px solid #ccc;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${packages
                .map(
                  (pkg: any) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">${
                    pkg.service_name
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">${
                    pkg.description || "-"
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">${
                    pkg.quantity
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">₹${
                    pkg.price
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ccc;">₹${
                    pkg.total_amount
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <h3>Total Package Amount: ₹${total_package_amount}</h3>

          <p>We look forward to making your event truly memorable!</p>
          <p>Best Regards,<br/><strong>Red Angle Studio Team</strong></p>
        </div>
      `;

      return await sendEmail({
        to: email,
        subject: `Quotation for Your ${wedding_type} Event - Red Angle Studio`,
        html: htmlContent,
      });
    } catch (error) {
      logger.error("Repository Error: Send Quotation To Client", error);
      throw error;
    }
  }
}
