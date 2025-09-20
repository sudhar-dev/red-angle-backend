import { employeeRepository } from "./repository";

export class Resolver {
  public employeeRepository: any;
  constructor() {
    this.employeeRepository = new employeeRepository();
  }

  public async addEmployeeResolverV1(userData: any, domainCode: any): Promise<any> {
    return await this.employeeRepository.addEmployeeRepoV1(userData, domainCode);
  }
}
