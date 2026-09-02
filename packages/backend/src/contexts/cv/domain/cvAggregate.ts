export class CvError extends Error {}

const MAX_NAME_LENGTH = 255;

export class Cv {
    private constructor(
        private readonly id: string,
        private name: string,
        private readonly fileUrl: string,
        private visible: boolean,
        private displayOrder: number,
        private readonly createdAt: Date,
    ) {}

    static rehydrate(
        id: string,
        name: string,
        fileUrl: string,
        visible: boolean,
        displayOrder: number,
        createdAt: Date,
    ): Cv {
        return new Cv(id, name, fileUrl, visible, displayOrder, createdAt);
    }

    static create(id: string, name: string, fileUrl: string, displayOrder: number, createdAt: Date = new Date()): Cv {
        const trimmedName = (name ?? '').trim();
        if (trimmedName === '') throw new CvError('A CV name cannot be empty');
        if (trimmedName.length > MAX_NAME_LENGTH) {
            throw new CvError(`A CV name cannot exceed ${MAX_NAME_LENGTH} characters`);
        }

        const trimmedUrl = (fileUrl ?? '').trim();
        if (trimmedUrl === '') throw new CvError('A CV must reference a file');
        if (!isPdfUrl(trimmedUrl)) throw new CvError('A CV must be a PDF file');

        return new Cv(id, trimmedName, trimmedUrl, true, displayOrder, createdAt);
    }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getFileUrl(): string {
        return this.fileUrl;
    }

    isVisible(): boolean {
        return this.visible;
    }

    getDisplayOrder(): number {
        return this.displayOrder;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    rename(name: string): void {
        const trimmed = (name ?? '').trim();
        if (trimmed === '') throw new CvError('A CV name cannot be empty');
        if (trimmed.length > MAX_NAME_LENGTH) {
            throw new CvError(`A CV name cannot exceed ${MAX_NAME_LENGTH} characters`);
        }
        this.name = trimmed;
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
    }

    moveTo(displayOrder: number): void {
        this.displayOrder = displayOrder;
    }
}

function isPdfUrl(url: string): boolean {
    return url.split('?')[0].toLowerCase().endsWith('.pdf');
}
