import IRoute from "../../helper/iroute";
import { leadsController } from "./controller";

export class leadsRoutes implements IRoute {
  public async register(server: any): Promise<any> {
    const controller = new leadsController();

    server.route([
      {
        method: "PUT",
        path: "/api/v1/leads/updateBulk",
        handler: controller.updateLeadsV1,
        config: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/leads/getAll",
        handler: controller.getLeadsV1,
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/api/v1/leads/addNew",
        handler: controller.addNewLeadV1,
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/api/v1/leads/assign",
        handler: controller.assignLeadsV1,
        config: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/leads/assignments",
        handler: controller.getAssignmentsV1,
        config: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/leads/assigned",
        handler: controller.getAssignedLeadsV1,
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/api/v1/leads/bookEvent",
        handler: controller.bookEventV1,
        config: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/leads/booked",
        handler: controller.getBookedEventsV1,
        config: { auth: false },
      },
      {
        method: "POST",
        path: "/api/v1/leads/quotationPackages",
        handler: controller.addQuotationPackagesV1,
        config: { auth: false },
      },

      {
        method: "GET",
        path: "/api/v1/leads/quotation-created",
        handler: controller.getQuotationCreatedLeadsV1,
        config: { auth: false },
      },
    ]);
  }
}
