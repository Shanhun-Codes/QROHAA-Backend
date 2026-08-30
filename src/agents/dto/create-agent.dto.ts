export class CreateAgentDto {
  firstName!: string;
  lastName!: string;
  email!: string;
  phone?: string;
  brokerageName?: string;
  active?: boolean;
  isActive?: boolean;
}
