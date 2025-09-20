import * as Hapi from "@hapi/hapi";

import IRoute from "../../helper/iroute";
import { employeeController } from "./controller";

export class employeeRoutes implements IRoute {
  public async register(server: any): Promise<any> {
    return new Promise((resolve) => {
      const controller = new employeeController();
      server.route([
        {
          method: "POST",
          path: "/api/v1/routes/addEmployee",
          config: {
            handler: controller.addEmployeeControllerV1,
            description: "Add Employee Routes",
            tags: ["api", "users"],
            auth: false,
          },
        },
      ]);
      resolve(true);
    });
  }
}
