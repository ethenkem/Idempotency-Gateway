export class Audit {}
import { ObjectId } from 'mongodb';
import {
  Entity,
  Column,
  CreateDateColumn,
  ObjectIdColumn,
} from 'typeorm';

@Entity('PaymentAudit')
export class PaymentAudit {
  @ObjectIdColumn()
  _id: ObjectId;

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
