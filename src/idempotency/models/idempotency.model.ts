import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Idempotency')
export class IdempotencyModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  idempotencyKey: string;

  @Column()
  requestHash: string;

  @Column({ type: 'text', nullable: true })
  responseData: string;

  // stores the previous response status code
  // to determine if the request is pending, completed, or failed
  @Column({ nullable: true })
  statusCode: number;

  @Column()
  status: 'processing' | 'completed' | 'failed';

  @CreateDateColumn()
  createdAt: String;

  @UpdateDateColumn()
  updtedAt: String;
}
