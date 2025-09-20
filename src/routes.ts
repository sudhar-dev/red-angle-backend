import * as Hapi from "@hapi/hapi";
import { employeeRoutes } from "./api/employees/routes";
import { loginRoutes } from "./api/login/routes";
import { attendanceRoutes } from "./api/attendance/routes";

export default class Router {
  public static async loadRoutes(server: Hapi.Server): Promise<any> {
    await new employeeRoutes().register(server);
    await new loginRoutes().register(server);
    await new attendanceRoutes().register(server);
  }
}
