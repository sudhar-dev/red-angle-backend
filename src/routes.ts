import * as Hapi from "@hapi/hapi";
import { employeeRoutes } from "./api/employees/routes";

export default class Router {
  public static async loadRoutes(server: Hapi.Server): Promise<any> {
    await new employeeRoutes().register(server);
  }
}
