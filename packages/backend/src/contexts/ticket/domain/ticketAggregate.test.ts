import { describe, expect, it } from 'vitest';
import { Ticket } from './ticketAggregate.js';
import { TicketId } from './valueObject/ticketId.js';
import { TicketReference } from './valueObject/reference.js';
import { FeatureId } from './valueObject/featureId.js';
import { Title } from './valueObject/title.js';
import { Description } from './valueObject/description.js';
import { TicketStatus } from './valueObject/status.js';
import { Note } from './valueObject/note.js';
import { StatusForbiddenOnIdeaException } from './exception/statusForbiddenOnIdea.js';
import { NoteNotFoundException } from './exception/noteNotFound.js';
import { Document } from '@shared/domain/entity/document.js';
import { DocumentId } from '@shared/domain/valueObject/documentId.js';
import { DocumentType } from '@shared/domain/valueObject/documentType.js';

function ticket(status: TicketStatus = TicketStatus.Pending, documents: Document[] = []): Ticket {
    return new Ticket(
        new TicketId(),
        new TicketReference('4.8.23'),
        new FeatureId('f1'),
        new Title('Un titre'),
        new Description('Une description'),
        status,
        [],
        documents,
    );
}

function document(id: string, url = '/uploads/a.png'): Document {
    return new Document(new DocumentId(id), 'image', url, DocumentType.IMAGE);
}

describe('Ticket — avancement', () => {
    it('avance normalement quand le porteur est un projet', () => {
        const subject = ticket();

        subject.changeStatus(TicketStatus.InProgress, false);

        expect(subject.getStatus()).toBe(TicketStatus.InProgress);
    });

    it('refuse tout autre statut que « en attente » quand le porteur est une idée', () => {
        // Une idée n'est pas un travail commencé : ses tickets ne peuvent ni avancer ni finir.
        const subject = ticket();

        expect(() => subject.changeStatus(TicketStatus.InProgress, true)).toThrow(StatusForbiddenOnIdeaException);
        expect(() => subject.changeStatus(TicketStatus.Finished, true)).toThrow(StatusForbiddenOnIdeaException);
        expect(subject.getStatus()).toBe(TicketStatus.Pending);
    });

    it('accepte « en attente » même sur une idée', () => {
        const subject = ticket(TicketStatus.Pending);

        subject.changeStatus(TicketStatus.Pending, true);

        expect(subject.getStatus()).toBe(TicketStatus.Pending);
    });
});

describe('Ticket — notes', () => {
    it('ajoute les notes dans l’ordre', () => {
        const subject = ticket();

        subject.addNote(new Note('première'));
        subject.addNote(new Note('deuxième'));

        expect(subject.getNotes().map(n => n.getValue())).toEqual(['première', 'deuxième']);
    });

    it('remplace une note existante', () => {
        const subject = ticket();
        subject.addNote(new Note('avant'));

        subject.replaceNote(0, new Note('après'));

        expect(subject.getNotes().map(n => n.getValue())).toEqual(['après']);
    });

    it('refuse une position hors bornes plutôt que d’écrire à côté', () => {
        const subject = ticket();
        subject.addNote(new Note('seule'));

        expect(() => subject.replaceNote(1, new Note('x'))).toThrow(NoteNotFoundException);
        expect(() => subject.replaceNote(-1, new Note('x'))).toThrow(NoteNotFoundException);
    });

    it('rend une copie : modifier la liste rendue ne touche pas le ticket', () => {
        const subject = ticket();
        subject.addNote(new Note('a'));

        subject.getNotes().push(new Note('intrus'));

        expect(subject.getNotes()).toHaveLength(1);
    });
});

describe('Ticket — documents', () => {
    it('ignore un document déjà attaché', () => {
        const subject = ticket();
        subject.addDocument(document('d1'));

        subject.addDocument(document('d1', '/uploads/autre.png'));

        expect(subject.getDocuments()).toHaveLength(1);
    });

    it('retire un document par son identifiant', () => {
        const subject = ticket();
        subject.addDocument(document('d1'));
        subject.addDocument(document('d2'));

        subject.removeDocument(new DocumentId('d1'));

        expect(subject.getDocuments().map(d => d.getId().getValue())).toEqual(['d2']);
    });

    it('reste inchangé si le document à retirer n’existe pas', () => {
        const subject = ticket();
        subject.addDocument(document('d1'));

        subject.removeDocument(new DocumentId('inconnu'));

        expect(subject.getDocuments()).toHaveLength(1);
    });

    it('écarte les entrées nulles venues de la persistance', () => {
        // Les documents vivent dans une colonne jsonb : un trou dans le tableau ne doit pas
        // faire tomber l'agrégat à la relecture.
        const subject = ticket(TicketStatus.Pending, [document('d1'), null as unknown as Document]);

        expect(subject.getDocuments()).toHaveLength(1);
    });
});
