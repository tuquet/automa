import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RunCampaignDto {
  @IsString()
  @IsNotEmpty()
  workflowPath: string;

  @IsString()
  @IsOptional()
  accountId?: string;
}
