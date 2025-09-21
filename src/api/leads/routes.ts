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
    ]);
  }
}
