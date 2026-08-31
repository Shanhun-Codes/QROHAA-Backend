import { IsString } from "class-validator";

export class CreateOpenHouseDto {
 @IsStr
}
// model OpenHouse {
//   id String @id @default(cuid())

//   publicCode String @unique

//   startsAt DateTime
//   endsAt   DateTime

//   agentId String
//   agent   Agent  @relation(fields: [agentId], references: [id])

//   propertyId String
//   property   Property @relation(fields: [propertyId], references: [id])

//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }
