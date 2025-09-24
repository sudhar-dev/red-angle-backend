import * as Hapi from "@hapi/hapi";
import { leadsRepository } from "./repository";
import logger from "../../helper/logger";

export class leadsController {
  public repo = new leadsRepository();

  public updateLeadsV1 = async (request: any, h: Hapi.ResponseToolkit) => {
    logger.info("Controller: Update Leads");
    try {
      const leadsData = request.payload; // Expecting array of leads
      const result = await this.repo.updateLeadsRepoV1(leadsData);
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Update Leads", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public getLeadsV1 = async (_request: any, h: Hapi.ResponseToolkit) => {
    logger.info("Controller: Get All Leads");
    try {
      const result = await this.repo.getLeadsRepoV1();
      return h.response({ success: true, data: result }).code(200);
    } catch (error) {
      logger.error("Controller Error: Get Leads", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  public addNewLeadV1 = async (request: any, h: Hapi.ResponseToolkit) => {
    logger.info("Controller: Add New Lead");

    try {
      const formData = request.payload;
      const result = await this.repo.addNewLead(formData);
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Add New Lead", error);
      return h
        .response({ success: false, message: "Internal Server Error" })
        .code(500);
    }
  };

  // ASSIGN LEADS

  public assignLeadsV1 = async (request: any, h: Hapi.ResponseToolkit) => {
    try {
      const { leadIds, employeeIds, assignedBy } = request.payload;

      if (!Array.isArray(leadIds) || !Array.isArray(employeeIds)) {
        return h
          .response({
            success: false,
            message: "leadIds and employeeIds must be arrays",
          })
          .code(400);
      }

      const result = await this.repo.assignLeads(
        leadIds,
        employeeIds,
        assignedBy
      );
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Assign Leads", error);
      return h
        .response({ success: false, message: "Internal server error" })
        .code(500);
    }
  };

  public getAssignmentsV1 = async (_request: any, h: Hapi.ResponseToolkit) => {
    try {
      const result = await this.repo.getAssignments();
      return h.response({ success: true, data: result }).code(200);
    } catch (error) {
      logger.error("Controller Error: Get Assignments", error);
      return h
        .response({ success: false, message: "Internal server error" })
        .code(500);
    }
  };

  public getAssignedLeadsV1 = async (
    _request: any,
    h: Hapi.ResponseToolkit
  ) => {
    try {
      const result = await this.repo.getAssignedLeads();
      return h.response({ success: true, data: result }).code(200);
    } catch (error) {
      logger.error("Controller Error: Get Assigned Leads", error);
      return h
        .response({ success: false, message: "Internal server error" })
        .code(500);
    }
  };
  public bookEventV1 = async (request: any, h: Hapi.ResponseToolkit) => {
    try {
      const payload = request.payload;

      if (!payload.leadId || !payload.eventDetails || !payload.paymentDetails) {
        return h
          .response({
            success: false,
            message: "leadId, eventDetails, and paymentDetails are required",
          })
          .code(400);
      }

      const result = await this.repo.bookEventRepo(payload);
      return h.response(result).code(result.success ? 200 : 400);
    } catch (error) {
      logger.error("Controller Error: Book Event", error);
      return h
        .response({ success: false, message: "Internal server error" })
        .code(500);
    }
  };

  public getBookedEventsV1 = async (_request: any, h: Hapi.ResponseToolkit) => {
    try {
      const result = await this.repo.getBookedEventsRepo();
      return h.response({ success: true, data: result }).code(200);
    } catch (error) {
      logger.error("Controller Error: Get Booked Events", error);
      return h
        .response({ success: false, message: "Internal server error" })
        .code(500);
    }
  };
}
