import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
export class IdempotencyModel {
  @PrimaryGeneratedColumn()
  id: number;

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
  status: 'pending' | 'completed' | 'failed';
}
