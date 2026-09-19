import { describe, expect, it } from 'vitest';
import { Ticket } from './ticketAggregate.js';
import { TicketId } from './valueObject/ticketId.js';
import { TicketReference } from './valueObject/reference.js';
import { FeatureId } from './valueObject/featureId.js';
import { Title } from './valueObject/title.js';
import { Description } from './valueObject/description.js';
import { TicketStatus } from './valueObject/status.js';
import { Note } from './entity/note.js';
import { NoteId } from './valueObject/noteId.js';
import { StatusForbiddenOnIdeaException } from './exception/statusForbiddenOnIdea.js';
import { NoteNotFoundException } from './exception/noteNotFound.js';
import { Document } from '@shared/domain/entity/document.js';
import { DocumentId } from '@shared/domain/valueObject/documentId.js';

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
    return new Document(new DocumentId(id), 'image', url);
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
    const note = (text: string, id?: string) => new Note(new NoteId(id), text);

    it('ajoute les notes dans l’ordre', () => {
        const subject = ticket();

        subject.addNote(note('première'));
        subject.addNote(note('deuxième'));

        expect(subject.getNotes().map(n => n.getText())).toEqual(['première', 'deuxième']);
    });

    it('réécrit une note désignée par son identifiant, pas par sa position', () => {
        const subject = ticket();
        subject.addNote(note('garde', 'n1'));
        subject.addNote(note('avant', 'n2'));

        subject.rewriteNote(new NoteId('n2'), 'après');

        expect(subject.getNotes().map(n => n.getText())).toEqual(['garde', 'après']);
    });

    it('refuse une note inconnue plutôt que d’écrire à côté', () => {
        const subject = ticket();
        subject.addNote(note('seule', 'n1'));

        expect(() => subject.rewriteNote(new NoteId('absente'), 'x')).toThrow(NoteNotFoundException);
    });

    it('refuse un texte vide, à la création comme à la réécriture', () => {
        const subject = ticket();
        subject.addNote(note('seule', 'n1'));

        expect(() => note('   ')).toThrow();
        expect(() => subject.rewriteNote(new NoteId('n1'), '  ')).toThrow();
        expect(subject.getNotes()[0].getText()).toBe('seule');
    });

    it('ignore une note déjà présente plutôt que de la dupliquer', () => {
        const subject = ticket();
        subject.addNote(note('a', 'n1'));

        subject.addNote(note('a', 'n1'));

        expect(subject.getNotes()).toHaveLength(1);
    });

    it('rend une copie : modifier la liste rendue ne touche pas le ticket', () => {
        const subject = ticket();
        subject.addNote(note('a'));

        subject.getNotes().push(note('intrus'));

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
