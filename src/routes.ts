import * as Hapi from "@hapi/hapi";
import { employeeRoutes } from "./api/employees/routes";
import { loginRoutes } from "./api/login/routes";
import { attendanceRoutes } from "./api/attendance/routes";
import { requestRoutes } from "./api/requests/routes";
import { packageRoutes } from "./api/packages/routes";

export default class Router {
  public static async loadRoutes(server: Hapi.Server): Promise<any> {
    await new employeeRoutes().register(server);
    await new loginRoutes().register(server);
    await new attendanceRoutes().register(server);
    await new requestRoutes().register(server);
    await new packageRoutes().register(server);
  }
}
