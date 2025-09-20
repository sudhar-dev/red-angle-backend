import IRoute from "../../helper/iroute";
import { employeeController } from "./controller";

export class employeeRoutes implements IRoute {
  public async register(server: any): Promise<any> {
    const controller = new employeeController();
    server.route([
      {
        method: "POST",
        path: "/api/v1/routes/addEmployee",
        handler: controller.addEmployeeControllerV1,
        config: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/routes/employees",
        handler: controller.getAllEmployeesController,
        config: { auth: false },
      },
      {
        method: "GET",
        path: "/api/v1/routes/employees/{id}",
        handler: controller.getEmployeeByIdController,
        config: { auth: false },
      },
      {
        method: "PUT",
        path: "/api/v1/routes/employees/{id}",
        handler: controller.updateEmployeeController,
        config: { auth: false },
      },
      {
        method: "DELETE",
        path: "/api/v1/routes/employees/{id}",
        handler: controller.deleteEmployeeController,
        config: { auth: false },
      },
    ]);
  }
}
