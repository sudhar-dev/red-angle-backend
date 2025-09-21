// routes.ts
import { Server } from "@hapi/hapi";
import IRoute from "../../helper/iroute";
import { requestController } from "./controller";

export class requestRoutes implements IRoute {
  public async register(server: Server): Promise<any> {
    const controller = new requestController();

    server.route([
      {
        method: "POST",
        path: "/api/v1/request",
        handler: controller.createRequest,
        options: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/request",
        handler: controller.getAllRequests,
        options: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/request/{id}",
        handler: controller.getRequestById,
        options: { auth: false },
      },
      {
        method: "PUT",
        path: "/api/v1/request/{id}",
        handler: controller.updateRequest,
        options: { auth: false },
      },
      {
        method: "DELETE",
        path: "/api/v1/request/{id}",
        handler: controller.deleteRequest,
        options: { auth: false },
      },
    ]);
  }
}
