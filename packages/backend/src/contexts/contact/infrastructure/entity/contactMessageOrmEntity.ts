import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ContactField } from '../../domain/contactMessageAggregate';

@Entity({ tableName: 'contact_messages' })
export class ContactMessageOrmEntity {
    @PrimaryKey()
    id!: string;

    /** The form's fields are editor-defined, so answers are stored as labelled pairs. */
    @Property({ type: 'json' })
    fields!: ContactField[];

    @Property({ type: 'varchar', nullable: true })
    senderEmail!: string | null;

    @Property({ type: 'timestamptz' })
    submittedAt!: Date;

    /** False when SMTP failed: the message is still here, nothing is lost. */
    @Property({ type: 'boolean', default: false })
    mailSent!: boolean;
}
