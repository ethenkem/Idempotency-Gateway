export class Audit {}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('PaymentAudit')
export class PaymentAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column()
  idempotencyKey: string;

  @Column('simple-json')
  requestBody: any;

  @Column('simple-json', { nullable: true })
  responseBody: any;

  @Column()
  status: 'processing' | 'completed' | 'replayed';

  @CreateDateColumn()
  createdAt: Date;
}
